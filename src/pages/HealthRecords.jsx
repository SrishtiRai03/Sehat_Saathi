import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API_BASE } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Droplets, Thermometer, Activity, Shield, Syringe, FlaskConical, Pill, Sparkles } from 'lucide-react';

export default function HealthRecords() {
  const { user, authFetch } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [wellness, setWellness] = useState(null);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.refId) {
      fetch(`${API_BASE}/api/records/patient/${user.refId}`).then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
    }
  }, [user]);

  const loadWellness = async () => {
    try {
      const d = await authFetch('/api/records/wellness', { method:'POST', body: JSON.stringify({ patientId: user.refId }) });
      setWellness(d);
      setTab('wellness');
    } catch { addToast('Failed to load recommendations', 'error'); }
  };

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div className="animate-pulse" style={{font:'var(--text-h3)',color:'var(--primary)'}}>Loading records...</div></div>;

  const record = data?.record;
  const patient = data?.patient;

  const tabs = [
    { id:'overview', label:'Overview' },
    { id:'vitals', label:'Vitals' },
    { id:'medications', label:'Meds' },
    { id:'wellness', label:'AI Tips' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <div style={{ padding:'20px 20px 0' }}>
        <button onClick={() => navigate('/patient')} style={{ display:'flex', alignItems:'center', gap:'8px', color:'var(--text-secondary)', marginBottom:'16px' }}><ArrowLeft size={20} /> Back</button>
        <h1 style={{ font:'var(--text-h1)', marginBottom:'4px' }}>Health Records</h1>
        <p style={{ font:'var(--text-body-sm)', color:'var(--text-secondary)', marginBottom:'16px' }}>ABHA: {patient?.abha_id}</p>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'6px', marginBottom:'20px', overflowX:'auto', paddingBottom:'4px' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => t.id==='wellness'?loadWellness():setTab(t.id)}
              style={{ padding:'8px 16px', borderRadius:'var(--radius-pill)', font:'var(--text-body-sm)', fontWeight:600, background:tab===t.id?'var(--primary)':'var(--bg-card)', color:tab===t.id?'white':'var(--text-secondary)', border: tab===t.id?'none':'1px solid var(--border)', transition:'all 0.2s', whiteSpace:'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:'0 20px 100px' }}>
        {tab === 'overview' && record && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}>
            {/* Allergies */}
            {record.allergies?.length > 0 && (
              <div className="card" style={{ marginBottom:'12px', border:'1.5px solid var(--rose)', background:'var(--rose-bg)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}><Shield size={18} color="var(--rose)" /><span style={{ font:'var(--text-body-medium)', color:'var(--rose)' }}>Drug Allergies</span></div>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                  {record.allergies.map(a => <span key={a} className="badge badge-danger">{a}</span>)}
                </div>
              </div>
            )}
            {/* Chronic conditions */}
            {record.chronic_conditions?.length > 0 && (
              <div className="card" style={{ marginBottom:'12px' }}>
                <div style={{ font:'var(--text-body-medium)', marginBottom:'8px' }}>Chronic Conditions</div>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                  {record.chronic_conditions.map(c => <span key={c} className="badge badge-warning">{c}</span>)}
                </div>
              </div>
            )}
            {/* Vaccinations */}
            {record.vaccinations?.length > 0 && (
              <div className="card" style={{ marginBottom:'12px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}><Syringe size={18} color="var(--teal)" /><span style={{ font:'var(--text-body-medium)' }}>Vaccinations</span></div>
                {record.vaccinations.map((v,i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom: i<record.vaccinations.length-1?'1px solid var(--divider)':'none' }}>
                    <span style={{ font:'var(--text-body-sm)' }}>{v.name}</span>
                    <span style={{ font:'var(--text-caption)', color:'var(--text-tertiary)' }}>{v.date}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Lab Results */}
            {record.lab_results?.length > 0 && (
              <div className="card" style={{ marginBottom:'12px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}><FlaskConical size={18} color="var(--primary)" /><span style={{ font:'var(--text-body-medium)' }}>Lab Results</span></div>
                {record.lab_results.map((l,i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom: i<record.lab_results.length-1?'1px solid var(--divider)':'none' }}>
                    <span style={{ font:'var(--text-body-sm)' }}>{l.test}</span>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ font:'var(--text-body-medium)', color:'var(--primary)' }}>{l.value}</div>
                      <div style={{ font:'var(--text-caption)', color:'var(--text-tertiary)' }}>{l.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === 'vitals' && record?.vitals && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            {[
              { icon:Heart, label:'Blood Pressure', value:record.vitals.bp, unit:'mmHg', color:'var(--rose)' },
              { icon:Droplets, label:'SpO2', value:record.vitals.spo2, unit:'%', color:'var(--teal)' },
              { icon:Thermometer, label:'Temperature', value:record.vitals.temp, unit:'°F', color:'var(--peach)' },
              { icon:Activity, label:'BMI', value:record.vitals.bmi, unit:'kg/m²', color:'var(--primary)' },
            ].map(v => (
              <div key={v.label} className="card" style={{ textAlign:'center' }}>
                <v.icon size={24} color={v.color} style={{ margin:'0 auto 8px' }} />
                <div style={{ font:'var(--text-stat)', fontSize:'24px', color:v.color }}>{v.value || '—'}</div>
                <div style={{ font:'var(--text-caption)', color:'var(--text-tertiary)' }}>{v.unit}</div>
                <div style={{ font:'var(--text-body-sm)', color:'var(--text-secondary)', marginTop:'4px' }}>{v.label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {tab === 'medications' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}>
            {record?.medications?.length > 0 ? record.medications.map((m,i) => (
              <div key={i} className="card" style={{ marginBottom:'12px', borderLeft:'4px solid var(--teal)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}><Pill size={18} color="var(--teal)" /><span style={{ font:'var(--text-body-medium)' }}>{m.name}</span></div>
                <div style={{ font:'var(--text-body-sm)', color:'var(--text-secondary)' }}>{m.dose} • {m.freq}</div>
              </div>
            )) : <p style={{ font:'var(--text-body)', color:'var(--text-secondary)', textAlign:'center', padding:'40px 0' }}>No current medications</p>}
          </motion.div>
        )}

        {tab === 'wellness' && wellness && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}>
            <div className="card" style={{ marginBottom:'16px', textAlign:'center', background:'linear-gradient(135deg, var(--primary-bg) 0%, var(--teal-bg) 100%)' }}>
              <Sparkles size={28} color="var(--primary)" style={{ margin:'0 auto 8px' }} />
              <div style={{ font:'var(--text-caption)', color:'var(--text-secondary)' }}>Lifestyle Risk Score</div>
              <div style={{ font:'var(--text-stat)', fontSize:'48px', color: wellness.riskLevel==='High'?'var(--critical)':wellness.riskLevel==='Medium'?'var(--peach-dark)':'var(--teal)' }}>{wellness.riskScore}</div>
              <span className={`badge ${wellness.riskLevel==='High'?'badge-danger':wellness.riskLevel==='Medium'?'badge-warning':'badge-success'}`}>{wellness.riskLevel} Risk</span>
            </div>
            {wellness.recommendations?.map((r,i) => (
              <div key={i} className="card" style={{ marginBottom:'10px', borderLeft:`4px solid ${r.severity==='Urgent'?'var(--rose)':'var(--teal)'}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
                  <span style={{ fontSize:'20px' }}>{r.icon}</span>
                  <span style={{ font:'var(--text-body-medium)' }}>{r.title}</span>
                  <span className={`badge ${r.severity==='Urgent'?'badge-danger':'badge-primary'}`} style={{ marginLeft:'auto' }}>{r.severity}</span>
                </div>
                <p style={{ font:'var(--text-body-sm)', color:'var(--text-secondary)' }}>{r.text}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
