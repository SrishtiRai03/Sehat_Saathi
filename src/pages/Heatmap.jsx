import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertTriangle, MapPin, Activity, Filter, Bell, ChevronDown, X } from 'lucide-react';

const sevColorMap = { RED:'#E74C3C', YELLOW:'#F1C40F', GREEN:'#2ECC71' };

function LeafletMap({ villages, onMarkerClick }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return;
    // Dynamically use Leaflet
    const L = window.L;
    if (!L) return;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        center: [26.92, 75.78],
        zoom: 10,
        zoomControl: true,
        attributionControl: false,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(mapInstance.current);
    }

    // Clear old markers
    markersRef.current.forEach(m => mapInstance.current.removeLayer(m));
    markersRef.current = [];

    // Add village markers
    villages.forEach(v => {
      if (!v.lat || !v.lng) return;
      const color = sevColorMap[v.maxSeverity] || '#2ECC71';
      const size = Math.min(40, Math.max(16, v.totalCases * 2));

      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width:${size}px; height:${size}px; border-radius:50%;
          background:${color}40; border:3px solid ${color};
          display:flex; align-items:center; justify-content:center;
          font:bold 11px/1 'Inter',sans-serif; color:${color};
          box-shadow:0 2px 8px ${color}60;
          cursor:pointer; transition:transform 0.2s;
        " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">${v.totalCases}</div>`,
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
      });

      const marker = L.marker([v.lat, v.lng], { icon }).addTo(mapInstance.current);
      marker.on('click', () => onMarkerClick(v));
      markersRef.current.push(marker);
    });

    // Fit bounds
    if (villages.length > 0) {
      const bounds = villages.filter(v => v.lat && v.lng).map(v => [v.lat, v.lng]);
      if (bounds.length > 1) mapInstance.current.fitBounds(bounds, { padding: [30, 30] });
    }

    return () => {};
  }, [villages]);

  return <div ref={mapRef} style={{ width:'100%', height:'100%', borderRadius:'var(--radius-lg)' }} />;
}

export default function Heatmap() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [symptomFilter, setSymptomFilter] = useState('all');
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [showAlerts, setShowAlerts] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/heatmap/data').then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
    fetch('/api/heatmap/alerts').then(r => r.json()).then(setAlerts).catch(() => {});
  }, []);

  const filteredVillages = useMemo(() => {
    if (!data?.villages) return [];
    if (symptomFilter === 'all') return data.villages;
    return data.villages.map(v => {
      const filteredSymptoms = v.symptoms.filter(s => s.type === symptomFilter);
      const totalCases = filteredSymptoms.reduce((a, s) => a + s.count, 0);
      const maxSeverity = filteredSymptoms.reduce((max, s) => {
        const order = { GREEN:0, YELLOW:1, RED:2 };
        return order[s.severity] > order[max] ? s.severity : max;
      }, 'GREEN');
      return { ...v, symptoms: filteredSymptoms, totalCases, maxSeverity };
    }).filter(v => v.totalCases > 0);
  }, [data, symptomFilter]);

  const backPath = user?.role === 'doctor' ? '/doctor' : '/patient';

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div className="animate-pulse" style={{font:'var(--text-h3)',color:'var(--primary)'}}>Loading heatmap...</div></div>;

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg, #E74C3C 0%, #C0392B 50%, #FF6B9D 100%)', padding:'20px 20px 24px', borderRadius:'0 0 32px 32px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
          <button onClick={() => navigate(backPath)} style={{ display:'flex', alignItems:'center', gap:'8px', color:'rgba(255,255,255,0.8)' }}><ArrowLeft size={20} /> Back</button>
          <button onClick={() => setShowAlerts(true)} style={{ position:'relative', width:'40px',height:'40px',borderRadius:'12px',background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <Bell size={20} color="white" />
            {alerts && alerts.redCount > 0 && (
              <div style={{ position:'absolute', top:'-4px', right:'-4px', width:'18px', height:'18px', borderRadius:'50%', background:'#FF4757', color:'white', fontSize:'10px', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {alerts.redCount}
              </div>
            )}
          </button>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'48px', height:'48px', borderRadius:'14px', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <MapPin size={24} color="white" />
          </div>
          <div>
            <h1 style={{ font:'var(--text-h2)', color:'white' }}>Village Health Heatmap</h1>
            <p style={{ font:'var(--text-body-sm)', color:'rgba(255,255,255,0.8)' }}>District-level disease surveillance</p>
          </div>
        </div>
      </div>

      <div style={{ padding:'16px 20px 100px' }}>
        {/* Symptom Filter */}
        <div style={{ display:'flex', gap:'6px', marginBottom:'16px', overflowX:'auto', paddingBottom:'4px' }}>
          <button onClick={() => setSymptomFilter('all')}
            style={{ padding:'6px 14px', borderRadius:'var(--radius-pill)', font:'var(--text-caption)', fontWeight:600, background: symptomFilter==='all' ? 'var(--primary)' : 'var(--bg-card)', color: symptomFilter==='all' ? 'white' : 'var(--text-secondary)', border: symptomFilter==='all' ? 'none' : '1px solid var(--border)', whiteSpace:'nowrap' }}>
            All Symptoms
          </button>
          {data?.symptomTypes?.map(s => (
            <button key={s} onClick={() => setSymptomFilter(s)}
              style={{ padding:'6px 14px', borderRadius:'var(--radius-pill)', font:'var(--text-caption)', fontWeight:600, background: symptomFilter===s ? 'var(--primary)' : 'var(--bg-card)', color: symptomFilter===s ? 'white' : 'var(--text-secondary)', border: symptomFilter===s ? 'none' : '1px solid var(--border)', whiteSpace:'nowrap' }}>
              {s}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display:'flex', gap:'16px', marginBottom:'16px', font:'var(--text-caption)' }}>
          {[{label:'Low Risk',color:'#2ECC71'},{label:'Medium Risk',color:'#F1C40F'},{label:'High Risk',color:'#E74C3C'}].map(l => (
            <div key={l.label} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
              <div style={{ width:'12px',height:'12px',borderRadius:'50%',background:l.color }} />
              <span style={{ color:'var(--text-secondary)' }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Map */}
        <div className="card" style={{ padding:0, height:'350px', marginBottom:'16px', overflow:'hidden' }}>
          <LeafletMap villages={filteredVillages} onMarkerClick={setSelectedVillage} />
        </div>

        {/* Summary Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'16px' }}>
          {[
            { label:'Villages', value: filteredVillages.length, color:'var(--primary)' },
            { label:'Total Cases', value: filteredVillages.reduce((a,v) => a+v.totalCases,0), color:'var(--peach-dark)' },
            { label:'Red Zones', value: filteredVillages.filter(v => v.maxSeverity === 'RED').length, color:'var(--critical)' },
          ].map((s,i) => (
            <div key={i} className="card" style={{ textAlign:'center', padding:'14px' }}>
              <div style={{ font:'var(--text-stat)', fontSize:'22px', color:s.color }}>{s.value}</div>
              <div style={{ font:'var(--text-caption)', color:'var(--text-secondary)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Village List */}
        <h3 style={{ font:'var(--text-h3)', marginBottom:'12px' }}>Villages by Severity</h3>
        {filteredVillages.sort((a,b) => {
          const order = { RED:2, YELLOW:1, GREEN:0 };
          return (order[b.maxSeverity]||0) - (order[a.maxSeverity]||0) || b.totalCases - a.totalCases;
        }).map((v,i) => (
          <motion.div key={v.village_id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}
            className="card" style={{ marginBottom:'8px', cursor:'pointer', borderLeft:`4px solid ${sevColorMap[v.maxSeverity]}` }}
            onClick={() => setSelectedVillage(v)}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ font:'var(--text-body-medium)' }}>{v.name}</div>
                <div style={{ font:'var(--text-caption)', color:'var(--text-secondary)' }}>{v.district} • Pop: {v.population?.toLocaleString()}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ font:'var(--text-stat)', fontSize:'20px', color:sevColorMap[v.maxSeverity] }}>{v.totalCases}</div>
                <div style={{ font:'var(--text-caption)', color:'var(--text-tertiary)' }}>cases</div>
              </div>
            </div>
            {v.symptoms?.length > 0 && (
              <div style={{ display:'flex', gap:'6px', marginTop:'8px', flexWrap:'wrap' }}>
                {v.symptoms.map((s,si) => (
                  <span key={si} className={`badge ${s.severity==='RED'?'badge-danger':s.severity==='YELLOW'?'badge-warning':'badge-success'}`} style={{ fontSize:'10px' }}>
                    {s.type}: {s.count}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Village Detail Panel */}
      <AnimatePresence>
        {selectedVillage && (
          <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type:'spring',damping:25}}
            style={{ position:'fixed', bottom:0, left:0, right:0, maxHeight:'60vh', background:'var(--bg-card)', borderRadius:'24px 24px 0 0', boxShadow:'0 -8px 40px rgba(0,0,0,0.2)', zIndex:200, overflow:'auto' }}>
            <div style={{ padding:'20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                <div>
                  <h2 style={{ font:'var(--text-h2)' }}>{selectedVillage.name}</h2>
                  <p style={{ font:'var(--text-caption)', color:'var(--text-secondary)' }}>{selectedVillage.district} • Pop: {selectedVillage.population?.toLocaleString()}</p>
                </div>
                <button onClick={() => setSelectedVillage(null)} style={{ width:'32px',height:'32px',borderRadius:'50%',background:'var(--primary-bg)',display:'flex',alignItems:'center',justifyContent:'center' }}><X size={18} color="var(--primary)" /></button>
              </div>

              <div style={{ display:'flex', gap:'10px', marginBottom:'16px' }}>
                <div className="card-flat" style={{ flex:1, textAlign:'center' }}>
                  <div style={{ font:'var(--text-stat)', fontSize:'28px', color:sevColorMap[selectedVillage.maxSeverity] }}>{selectedVillage.totalCases}</div>
                  <div style={{ font:'var(--text-caption)', color:'var(--text-secondary)' }}>Total Cases</div>
                </div>
                <div className="card-flat" style={{ flex:1, textAlign:'center' }}>
                  <span className={`badge ${selectedVillage.maxSeverity==='RED'?'badge-danger':selectedVillage.maxSeverity==='YELLOW'?'badge-warning':'badge-success'}`} style={{ fontSize:'14px', padding:'6px 16px' }}>
                    {selectedVillage.maxSeverity}
                  </span>
                  <div style={{ font:'var(--text-caption)', color:'var(--text-secondary)', marginTop:'4px' }}>Severity</div>
                </div>
              </div>

              <h3 style={{ font:'var(--text-body-medium)', marginBottom:'10px' }}>Symptoms Breakdown</h3>
              {selectedVillage.symptoms?.map((s,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom: '1px solid var(--divider)' }}>
                  <span style={{ font:'var(--text-body-sm)' }}>{s.type}</span>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <span className={`badge ${s.severity==='RED'?'badge-danger':s.severity==='YELLOW'?'badge-warning':'badge-success'}`}>{s.severity}</span>
                    <span style={{ font:'var(--text-stat)', fontSize:'16px' }}>{s.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerts Panel */}
      <AnimatePresence>
        {showAlerts && alerts && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:300, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
            onClick={() => setShowAlerts(false)}>
            <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type:'spring',damping:25}}
              onClick={e => e.stopPropagation()}
              style={{ width:'100%', maxHeight:'80vh', background:'var(--bg-card)', borderRadius:'24px 24px 0 0', overflow:'auto', padding:'20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                <h2 style={{ font:'var(--text-h2)' }}>Health Alerts</h2>
                <button onClick={() => setShowAlerts(false)} style={{ width:'32px',height:'32px',borderRadius:'50%',background:'var(--primary-bg)',display:'flex',alignItems:'center',justifyContent:'center' }}><X size={18} color="var(--primary)" /></button>
              </div>

              <div style={{ display:'flex', gap:'10px', marginBottom:'16px' }}>
                <div className="card-flat" style={{ flex:1, textAlign:'center', background:'var(--critical-bg)' }}>
                  <div style={{ font:'var(--text-stat)', fontSize:'24px', color:'var(--critical)' }}>{alerts.redCount}</div>
                  <div style={{ font:'var(--text-caption)', color:'var(--critical)' }}>Red Alerts</div>
                </div>
                <div className="card-flat" style={{ flex:1, textAlign:'center', background:'var(--moderate-bg)' }}>
                  <div style={{ font:'var(--text-stat)', fontSize:'24px', color:'#B8860B' }}>{alerts.yellowCount}</div>
                  <div style={{ font:'var(--text-caption)', color:'#B8860B' }}>Warnings</div>
                </div>
              </div>

              {alerts.alerts?.map((a,i) => (
                <div key={i} className="card" style={{ marginBottom:'10px', borderLeft:`4px solid ${a.level==='RED'?'var(--critical)':'var(--moderate)'}` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
                    <AlertTriangle size={16} color={a.level==='RED'?'var(--critical)':'#B8860B'} />
                    <span className={`badge ${a.level==='RED'?'badge-danger':'badge-warning'}`}>{a.type}</span>
                    <span style={{ font:'var(--text-caption)', color:'var(--text-tertiary)', marginLeft:'auto' }}>{a.symptom}</span>
                  </div>
                  <div style={{ font:'var(--text-body-sm)', color:'var(--text-primary)' }}>{a.message}</div>
                  <div style={{ font:'var(--text-caption)', color:'var(--text-secondary)', marginTop:'4px' }}>{a.village}, {a.district}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
