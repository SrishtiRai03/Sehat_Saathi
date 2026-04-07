import { useState, useEffect, useCallback } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Package, AlertTriangle, CheckCircle, Clock, TrendingUp,
  Pill, Search, ChevronRight, X, BarChart3, Box, ShoppingCart, ArrowUpRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';

const COLORS = ['#6B5CE7','#4ECDC4','#FF6B9D','#FFB347','#FF4757','#8B7EF0','#3DBDB4','#E55A8A'];

export default function PharmacyDashboard() {
  const { user, authFetch, logout } = useAuth();
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [tab, setTab] = useState('overview');
  const [searchQ, setSearchQ] = useState('');
  const [selectedRx, setSelectedRx] = useState(null);
  const [loading, setLoading] = useState(true);
  const pharmacyId = 1;

  const fetchData = useCallback(() => {
    fetch(`${API_BASE}/api/pharmacy/dashboard/${pharmacyId}`).then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [pharmacyId]);

  const fetchForecast = () => {
    fetch(`${API_BASE}/api/pharmacy/forecast/${pharmacyId}`).then(r => r.json()).then(setForecast).catch(() => {});
  };

  useEffect(() => { fetchData(); fetchForecast(); const i = setInterval(fetchData, 20000); return () => clearInterval(i); }, [fetchData]);

  const dispenseRx = async (rxId) => {
    try {
      await authFetch(`/api/pharmacy/dispense/${rxId}`, { method:'POST' });
      addToast('Prescription dispensed!', 'success');
      setSelectedRx(null);
      fetchData();
    } catch { addToast('Failed to dispense', 'error'); }
  };

  const filteredInventory = data?.inventory?.filter(i =>
    !searchQ || i.medicine_name.toLowerCase().includes(searchQ.toLowerCase()) || i.generic_name?.toLowerCase().includes(searchQ.toLowerCase())
  ) || [];

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div className="animate-pulse" style={{font:'var(--text-h3)',color:'var(--primary)'}}>Loading pharmacy...</div></div>;

  const tabs = [
    { id:'overview', label:'Overview', icon: BarChart3 },
    { id:'prescriptions', label:'Rx Queue', icon: Pill },
    { id:'inventory', label:'Inventory', icon: Box },
    { id:'analytics', label:'Analytics', icon: TrendingUp },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg, #FF6B9D 0%, #E55A8A 50%, #6B5CE7 100%)', padding:'24px 20px 28px', borderRadius:'0 0 32px 32px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'150px', height:'150px', borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
          <div>
            <p style={{ font:'var(--text-body-sm)', color:'rgba(255,255,255,0.8)' }}>Pharmacy Dashboard 💊</p>
            <h1 style={{ font:'var(--text-h2)', color:'white' }}>Jan Aushadhi Kendra</h1>
          </div>
          <button onClick={() => { window.location.href = '/'; setTimeout(logout, 100); }} style={{ width:'40px',height:'40px',borderRadius:'12px',background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <LogOut size={18} color="white" />
          </button>
        </div>

        {/* Stats */}
        <div style={{ display:'flex', gap:'8px' }}>
          {[
            { label:'Pending', value: data?.stats?.pendingCount || 0, color:'#FFB347' },
            { label:'Dispensed', value: data?.stats?.dispensedCount || 0, color:'#2ECC71' },
            { label:'Low Stock', value: data?.stats?.lowStockCount || 0, color:'#FF4757' },
            { label:'Rate', value: `${data?.stats?.fulfillmentRate || 0}%`, color:'#4ECDC4' },
          ].map((s,i) => (
            <div key={i} style={{ flex:1, background:'rgba(255,255,255,0.15)', backdropFilter:'blur(10px)', borderRadius:'12px', padding:'10px 8px', textAlign:'center' }}>
              <div style={{ font:'var(--text-stat)', color:'white', fontSize:'18px' }}>{s.value}</div>
              <div style={{ font:'var(--text-caption)', color:'rgba(255,255,255,0.7)', fontSize:'10px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'4px', padding:'16px 20px 0', overflowX:'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px',
              borderRadius:'var(--radius-pill)', font:'var(--text-body-sm)', fontWeight:600,
              background: tab === t.id ? 'var(--primary)' : 'var(--bg-card)',
              color: tab === t.id ? 'white' : 'var(--text-secondary)',
              border: tab === t.id ? 'none' : '1px solid var(--border)',
              transition:'all 0.2s', whiteSpace:'nowrap',
            }}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding:'16px 20px 100px' }}>
        {/* Overview */}
        {tab === 'overview' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}>
            {/* Alerts */}
            {(data?.lowStock?.length > 0 || data?.outOfStock?.length > 0) && (
              <div className="card" style={{ marginBottom:'16px', border:'1.5px solid var(--critical)', background:'var(--critical-bg)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                  <AlertTriangle size={18} color="var(--critical)" />
                  <span style={{ font:'var(--text-body-medium)', color:'var(--critical)' }}>Stock Alerts</span>
                </div>
                {data.outOfStock?.map((i,idx) => (
                  <div key={idx} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom: idx < data.outOfStock.length-1 ? '1px solid rgba(255,71,87,0.2)' : 'none' }}>
                    <span style={{ font:'var(--text-body-sm)' }}>{i.medicine_name}</span>
                    <span className="badge badge-danger">OUT OF STOCK</span>
                  </div>
                ))}
                {data.lowStock?.filter(i => i.quantity > 0).slice(0,5).map((i,idx) => (
                  <div key={idx} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0' }}>
                    <span style={{ font:'var(--text-body-sm)' }}>{i.medicine_name}</span>
                    <span className="badge badge-warning">{i.quantity} left</span>
                  </div>
                ))}
              </div>
            )}

            {/* Pending Prescriptions */}
            {data?.pending?.length > 0 && (
              <>
                <h3 style={{ font:'var(--text-h3)', marginBottom:'12px' }}>Pending Prescriptions ({data.pending.length})</h3>
                {data.pending.slice(0,5).map((rx,i) => (
                  <div key={rx.rx_id} className="card" style={{ marginBottom:'10px', cursor:'pointer', borderLeft:'4px solid var(--peach)' }}
                    onClick={() => setSelectedRx(rx)}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                        <div style={{ font:'var(--text-body-medium)' }}>{rx.patient_name}</div>
                        <div style={{ font:'var(--text-caption)', color:'var(--text-secondary)' }}>
                          {rx.doctor_name} • {rx.items?.length || 0} items
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                        <span className="badge badge-warning">PENDING</span>
                        <ChevronRight size={18} color="var(--text-tertiary)" />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Monthly Chart */}
            {data?.monthlyData && (
              <div className="card" style={{ marginTop:'16px' }}>
                <h3 style={{ font:'var(--text-body-medium)', marginBottom:'12px' }}>Monthly Prescriptions</h3>
                <div style={{ height:'200px' }}>
                  <ResponsiveContainer>
                    <BarChart data={data.monthlyData}>
                      <XAxis dataKey="month" tick={{ fontSize:12, fill:'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize:12, fill:'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'12px', boxShadow:'var(--shadow-2)' }} />
                      <Bar dataKey="prescriptions" fill="#6B5CE7" radius={[6,6,0,0]} name="Received" />
                      <Bar dataKey="fulfilled" fill="#4ECDC4" radius={[6,6,0,0]} name="Fulfilled" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Prescriptions Tab */}
        {tab === 'prescriptions' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}>
            <h3 style={{ font:'var(--text-h3)', marginBottom:'12px' }}>Pending ({data?.pending?.length || 0})</h3>
            {data?.pending?.map(rx => (
              <div key={rx.rx_id} className="card" style={{ marginBottom:'10px', cursor:'pointer', borderLeft:'4px solid var(--peach)' }} onClick={() => setSelectedRx(rx)}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                  <div style={{ font:'var(--text-body-medium)' }}>{rx.patient_name}</div>
                  <span className="badge badge-warning">PENDING</span>
                </div>
                <div style={{ font:'var(--text-caption)', color:'var(--text-secondary)', marginBottom:'6px' }}>Prescribed by {rx.doctor_name}</div>
                <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                  {rx.items?.map((item,i) => <span key={i} className="badge badge-primary" style={{ fontSize:'10px' }}>{item.name}</span>)}
                </div>
              </div>
            ))}
            {data?.pending?.length === 0 && (
              <div className="card" style={{ textAlign:'center', padding:'40px' }}>
                <CheckCircle size={36} color="var(--teal)" style={{ margin:'0 auto 12px' }} />
                <p style={{ font:'var(--text-body)', color:'var(--text-secondary)' }}>All prescriptions fulfilled!</p>
              </div>
            )}

            <h3 style={{ font:'var(--text-h3)', marginBottom:'12px', marginTop:'20px' }}>Recently Dispensed</h3>
            {data?.dispensed?.slice(0,10).map(rx => (
              <div key={rx.rx_id} className="card" style={{ marginBottom:'8px', borderLeft:'4px solid var(--teal)', opacity:0.8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ font:'var(--text-body-sm)' }}>{rx.patient_name}</div>
                    <div style={{ font:'var(--text-caption)', color:'var(--text-tertiary)' }}>{rx.items?.length || 0} items</div>
                  </div>
                  <span className="badge badge-success">DISPENSED</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Inventory Tab */}
        {tab === 'inventory' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}>
            <div style={{ position:'relative', marginBottom:'16px' }}>
              <Search size={20} style={{ position:'absolute', left:'14px', top:'12px', color:'var(--text-tertiary)' }} />
              <input className="form-input" value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search medicines..." style={{ paddingLeft:'44px', height:'48px' }} />
            </div>

            <div style={{ font:'var(--text-caption)', color:'var(--text-secondary)', marginBottom:'12px' }}>{filteredInventory.length} items</div>

            {filteredInventory.map((i,idx) => {
              const pct = i.reorder_level > 0 ? Math.min(100, (i.quantity / (i.reorder_level * 3)) * 100) : 100;
              const color = i.quantity === 0 ? 'var(--critical)' : i.quantity <= i.reorder_level ? 'var(--peach-dark)' : 'var(--teal)';
              return (
                <div key={idx} className="card" style={{ marginBottom:'8px', padding:'14px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                    <div>
                      <div style={{ font:'var(--text-body-sm)', fontWeight:600 }}>{i.medicine_name}</div>
                      {i.generic_name && <div style={{ font:'var(--text-caption)', color:'var(--text-tertiary)' }}>{i.generic_name}</div>}
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ font:'var(--text-stat)', fontSize:'18px', color }}>{i.quantity}</div>
                      <div style={{ font:'var(--text-caption)', color:'var(--text-tertiary)' }}>of {i.reorder_level * 3}</div>
                    </div>
                  </div>
                  <div style={{ height:'4px', background:'var(--border-light)', borderRadius:'2px', overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:'2px', transition:'width 0.5s' }} />
                  </div>
                  {i.quantity <= i.reorder_level && (
                    <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'6px', font:'var(--text-caption)', color: i.quantity === 0 ? 'var(--critical)' : 'var(--peach-dark)' }}>
                      <AlertTriangle size={12} /> {i.quantity === 0 ? 'Out of stock' : `Below reorder level (${i.reorder_level})`}
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Analytics Tab */}
        {tab === 'analytics' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}>
            {/* Top Medicines */}
            {data?.topMedicines && (
              <div className="card" style={{ marginBottom:'16px' }}>
                <h3 style={{ font:'var(--text-body-medium)', marginBottom:'12px' }}>Top Medicines by Volume</h3>
                <div style={{ height:'250px' }}>
                  <ResponsiveContainer>
                    <BarChart data={data.topMedicines.slice(0,6)} layout="vertical">
                      <XAxis type="number" tick={{ fontSize:11, fill:'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize:11, fill:'var(--text-secondary)' }} width={100} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'12px' }} />
                      <Bar dataKey="dispensed" fill="#6B5CE7" radius={[0,6,6,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Stock Distribution Pie */}
            <div className="card" style={{ marginBottom:'16px' }}>
              <h3 style={{ font:'var(--text-body-medium)', marginBottom:'12px' }}>Stock Status Distribution</h3>
              <div style={{ height:'220px' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={[
                        { name:'OK', value: (data?.inventory?.length || 0) - (data?.lowStock?.length || 0) },
                        { name:'Low', value: (data?.lowStock?.filter(i => i.quantity > 0)?.length || 0) },
                        { name:'Out', value: (data?.outOfStock?.length || 0) },
                      ]}
                      cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value"
                    >
                      {[0,1,2].map(i => <Cell key={i} fill={['#4ECDC4','#FFB347','#FF4757'][i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'12px' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Forecast */}
            {forecast && (
              <div className="card">
                <h3 style={{ font:'var(--text-body-medium)', marginBottom:'12px' }}>Reorder Forecast</h3>
                {forecast.forecast?.filter(f => f.status !== 'OK').slice(0,8).map((f,i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom: '1px solid var(--divider)' }}>
                    <div>
                      <div style={{ font:'var(--text-body-sm)' }}>{f.medicine}</div>
                      <div style={{ font:'var(--text-caption)', color:'var(--text-tertiary)' }}>{f.daysRemaining} days remaining • {f.dailyUsage}/day</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <span className={`badge ${f.status === 'OUT_OF_STOCK' ? 'badge-danger' : 'badge-warning'}`}>{f.status}</span>
                      {f.recommendedOrder > 0 && <div style={{ font:'var(--text-caption)', color:'var(--primary)', marginTop:'2px' }}>Order {f.recommendedOrder}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Rx Detail Panel */}
      <AnimatePresence>
        {selectedRx && (
          <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type:'spring',damping:25}}
            style={{ position:'fixed', bottom:0, left:0, right:0, maxHeight:'80vh', background:'var(--bg-card)', borderRadius:'24px 24px 0 0', boxShadow:'0 -8px 40px rgba(0,0,0,0.2)', zIndex:200, overflow:'auto' }}>
            <div style={{ padding:'20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                <h2 style={{ font:'var(--text-h2)' }}>Prescription #{selectedRx.rx_id}</h2>
                <button onClick={() => setSelectedRx(null)} style={{ width:'32px',height:'32px',borderRadius:'50%',background:'var(--primary-bg)',display:'flex',alignItems:'center',justifyContent:'center' }}><X size={18} color="var(--primary)" /></button>
              </div>

              <div className="card-flat" style={{ marginBottom:'12px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                  <span style={{ font:'var(--text-caption)', color:'var(--text-tertiary)' }}>PATIENT</span>
                  <span style={{ font:'var(--text-body-medium)' }}>{selectedRx.patient_name}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ font:'var(--text-caption)', color:'var(--text-tertiary)' }}>DOCTOR</span>
                  <span style={{ font:'var(--text-body-sm)' }}>{selectedRx.doctor_name}</span>
                </div>
              </div>

              <h3 style={{ font:'var(--text-body-medium)', marginBottom:'10px' }}>Medications</h3>
              {selectedRx.items?.map((item,i) => (
                <div key={i} className="card-flat" style={{ marginBottom:'8px', borderLeft:'4px solid var(--primary)' }}>
                  <div style={{ font:'var(--text-body-medium)' }}>{item.name}</div>
                  <div style={{ font:'var(--text-body-sm)', color:'var(--text-secondary)' }}>
                    {item.dose} • {item.freq} {item.duration ? `• ${item.duration}` : ''}
                  </div>
                </div>
              ))}
              {selectedRx.notes && (
                <div style={{ font:'var(--text-body-sm)', color:'var(--text-secondary)', marginTop:'8px', marginBottom:'16px', fontStyle:'italic' }}>
                  Note: {selectedRx.notes}
                </div>
              )}

              {selectedRx.status === 'pending' && (
                <button onClick={() => dispenseRx(selectedRx.rx_id)} id="dispense-btn"
                  style={{ width:'100%', padding:'16px', background:'var(--teal)', color:'white', borderRadius:'var(--radius-pill)', font:'var(--text-button)', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 8px 24px rgba(78,205,196,0.3)', marginBottom:'20px' }}>
                  <CheckCircle size={20} /> Dispense Prescription
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
