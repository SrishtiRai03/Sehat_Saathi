import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Users, Clock, UserCheck, AlertTriangle, ChevronRight,
  Stethoscope, Phone, Shield, Heart, Droplets, Thermometer,
  Activity, Pill, Send, FileText, X, CheckCircle, RefreshCw
} from 'lucide-react';

const sevColors = { CRITICAL:'#FF4757', URGENT:'#FF8C42', MODERATE:'#FFD93D', ROUTINE:'#4ECDC4' };
const sevBg = { CRITICAL:'#FFE8EA', URGENT:'#FFF0E5', MODERATE:'#FFF9E0', ROUTINE:'#E0F7F5' };

export default function DoctorDashboard() {
  const { user, authFetch, logout } = useAuth();
  const { addToast } = useToast();
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState(null);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [brief, setBrief] = useState(null);
  const [consultPanel, setConsultPanel] = useState(false);
  const [consultId, setConsultId] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [diagnosisNotes, setDiagnosisNotes] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [rxItems, setRxItems] = useState([{ name:'', dose:'', freq:'', duration:'' }]);
  const [rxNotes, setRxNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const doctorId = user?.refId || 1;

  const fetchQueue = useCallback(() => {
    fetch(`/api/queue/doctor/${doctorId}`).then(r => r.json()).then(d => {
      setQueue(d.entries || []);
    }).catch(() => {});
    fetch('/api/stats').then(r => r.json()).then(setStats).catch(() => {});
  }, [doctorId]);

  useEffect(() => { fetchQueue(); const i = setInterval(fetchQueue, 15000); return () => clearInterval(i); }, [fetchQueue]);

  const callNext = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/queue/call-next', { method:'POST', body: JSON.stringify({ doctorId }) });
      if (res.entry) {
        addToast(`Calling ${res.entry.patient_name}`, 'success');
        fetchQueue();
      } else addToast('No more patients waiting', 'info');
    } catch { addToast('Failed to call next', 'error'); }
    setLoading(false);
  };

  const openPatient = async (entry) => {
    setCurrentPatient(entry);
    try {
      const b = await authFetch(`/api/consultation/brief/${entry.patient_id}`);
      setBrief(b);
    } catch { setBrief(null); }
  };

  const startConsultation = async () => {
    if (!currentPatient) return;
    setLoading(true);
    try {
      const res = await authFetch('/api/consultation/start', { method:'POST', body: JSON.stringify({ patientId: currentPatient.patient_id, doctorId, queueEntryId: currentPatient.entry_id }) });
      setConsultId(res.consultId);
      setConsultPanel(true);
      addToast('Consultation started', 'success');
      fetchQueue();
    } catch { addToast('Failed to start', 'error'); }
    setLoading(false);
  };

  const submitDiagnosis = async () => {
    if (!diagnosis.trim()) { addToast('Enter diagnosis', 'warning'); return; }
    setLoading(true);
    try {
      const prescription = rxItems.filter(r => r.name.trim()).length > 0 ? { items: rxItems.filter(r => r.name.trim()), notes: rxNotes } : null;
      await authFetch('/api/consultation/diagnose', { method:'POST', body: JSON.stringify({ consultId, diagnosis, notes: diagnosisNotes, followUpDate: followUp, prescription }) });
      addToast('Consultation completed!', 'success');
      setConsultPanel(false); setCurrentPatient(null); setBrief(null);
      setDiagnosis(''); setDiagnosisNotes(''); setFollowUp(''); setRxItems([{name:'',dose:'',freq:'',duration:''}]); setRxNotes(''); setConsultId(null);
      fetchQueue();
    } catch { addToast('Failed to submit', 'error'); }
    setLoading(false);
  };

  const inConsultation = queue.find(e => e.status === 'in_consultation');
  const waiting = queue.filter(e => e.status === 'waiting');

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg, #4ECDC4 0%, #3DBDB4 50%, #6B5CE7 100%)', padding:'24px 20px 28px', borderRadius:'0 0 32px 32px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'150px', height:'150px', borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
          <div>
            <p style={{ font:'var(--text-body-sm)', color:'rgba(255,255,255,0.8)' }}>Doctor Dashboard 🩺</p>
            <h1 style={{ font:'var(--text-h2)', color:'white' }}>{user?.profile?.name || 'Dr. Anil Verma'}</h1>
          </div>
          <button onClick={() => { logout(); window.location.href = '/'; }} style={{ width:'40px',height:'40px',borderRadius:'12px',background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <LogOut size={18} color="white" />
          </button>
        </div>
        <div style={{ display:'flex', gap:'10px' }}>
          {[
            { label:'Queue', value: waiting.length, icon: Users, color:'#FFB347' },
            { label:'In Consult', value: inConsultation ? 1 : 0, icon: Stethoscope, color:'#FF6B9D' },
            { label:'Done Today', value: stats?.consultationsToday || 0, icon: CheckCircle, color:'#2ECC71' },
          ].map((s,i) => (
            <div key={i} style={{ flex:1, background:'rgba(255,255,255,0.15)', backdropFilter:'blur(10px)', borderRadius:'14px', padding:'12px', textAlign:'center' }}>
              <s.icon size={20} color="white" style={{ margin:'0 auto 4px' }} />
              <div style={{ font:'var(--text-stat)', color:'white', fontSize:'22px' }}>{s.value}</div>
              <div style={{ font:'var(--text-caption)', color:'rgba(255,255,255,0.7)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:'20px', paddingBottom:'100px' }}>
        {/* Call Next Button */}
        <button onClick={callNext} disabled={loading} id="call-next-btn"
          style={{ width:'100%', padding:'16px', background:'var(--primary)', color:'white', borderRadius:'var(--radius-pill)', font:'var(--text-button)', boxShadow:'0 8px 24px rgba(107,92,231,0.3)', marginBottom:'20px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', opacity:loading?0.7:1 }}>
          <UserCheck size={20} /> Call Next Patient
        </button>

        {/* Current In-Consultation */}
        {inConsultation && (
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="card" style={{ marginBottom:'16px', border:'2px solid var(--teal)', background:'var(--teal-bg)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
              <span className="badge badge-success">IN CONSULTATION</span>
              <Clock size={16} color="var(--teal)" />
            </div>
            <div style={{ font:'var(--text-body-medium)' }}>{inConsultation.patient_name}</div>
            <div style={{ font:'var(--text-caption)', color:'var(--text-secondary)' }}>
              ABHA: {inConsultation.abha_id} • Score: {inConsultation.triage_score || inConsultation.score}/10
            </div>
            <div style={{ display:'flex', gap:'8px', marginTop:'10px' }}>
              <button onClick={() => openPatient(inConsultation)} style={{ flex:1, padding:'10px', background:'var(--teal)', color:'white', borderRadius:'var(--radius-md)', font:'var(--text-button)', fontSize:'13px' }}>View Brief</button>
              <button onClick={() => { openPatient(inConsultation); startConsultation(); }} style={{ flex:1, padding:'10px', background:'var(--primary)', color:'white', borderRadius:'var(--radius-md)', font:'var(--text-button)', fontSize:'13px' }}>Diagnose</button>
            </div>
          </motion.div>
        )}

        {/* Queue */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
          <h2 style={{ font:'var(--text-h3)' }}>Patient Queue ({waiting.length})</h2>
          <button onClick={fetchQueue} style={{ padding:'6px 12px', borderRadius:'var(--radius-pill)', background:'var(--primary-bg)', color:'var(--primary)', font:'var(--text-caption)', fontWeight:600, display:'flex', alignItems:'center', gap:'4px' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {waiting.length === 0 ? (
          <div className="card" style={{ textAlign:'center', padding:'40px' }}>
            <Users size={36} color="var(--text-tertiary)" style={{ margin:'0 auto 12px' }} />
            <p style={{ font:'var(--text-body)', color:'var(--text-secondary)' }}>No patients in queue</p>
          </div>
        ) : (
          waiting.map((entry, i) => (
            <motion.div key={entry.entry_id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
              className="card" style={{ marginBottom:'10px', cursor:'pointer', borderLeft:`4px solid ${sevColors[entry.severity] || 'var(--border)'}` }}
              onClick={() => openPatient(entry)}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'40px',height:'40px',borderRadius:'12px',background:sevBg[entry.severity] || 'var(--primary-bg)',display:'flex',alignItems:'center',justifyContent:'center',font:'var(--text-button)',color:sevColors[entry.severity] || 'var(--primary)' }}>
                    #{entry.position || i+1}
                  </div>
                  <div>
                    <div style={{ font:'var(--text-body-medium)' }}>{entry.patient_name}</div>
                    <div style={{ font:'var(--text-caption)', color:'var(--text-secondary)' }}>
                      {entry.gender} • Score: {entry.triage_score || entry.score}/10
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span className={`badge badge-${(entry.severity||'routine').toLowerCase()}`}>{entry.severity}</span>
                  <ChevronRight size={18} color="var(--text-tertiary)" />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Patient Brief Panel */}
      <AnimatePresence>
        {currentPatient && brief && !consultPanel && (
          <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type:'spring',damping:25}} style={{
            position:'fixed', bottom:0, left:0, right:0, maxHeight:'85vh', background:'var(--bg-card)',
            borderRadius:'24px 24px 0 0', boxShadow:'0 -8px 40px rgba(0,0,0,0.2)', zIndex:200, overflow:'auto',
          }}>
            <div style={{ padding:'20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                <h2 style={{ font:'var(--text-h2)' }}>Patient Brief</h2>
                <button onClick={() => { setCurrentPatient(null); setBrief(null); }} style={{ width:'32px',height:'32px',borderRadius:'50%',background:'var(--primary-bg)',display:'flex',alignItems:'center',justifyContent:'center' }}><X size={18} color="var(--primary)" /></button>
              </div>

              {/* Patient Info */}
              <div className="card-flat" style={{ marginBottom:'12px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                  <h3 style={{ font:'var(--text-body-medium)' }}>{brief.patient?.name}</h3>
                  {brief.triageSummary && <span className={`badge badge-${brief.triageSummary.severity?.toLowerCase()}`}>{brief.triageSummary.severity} ({brief.triageSummary.score}/10)</span>}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', font:'var(--text-caption)', color:'var(--text-secondary)' }}>
                  <div>Age: {brief.patient?.age || '—'}</div>
                  <div>Blood: {brief.patient?.bloodGroup}</div>
                  <div>Visits: {brief.pastVisits}</div>
                </div>
              </div>

              {/* Allergies Alert */}
              {brief.allergies?.length > 0 && (
                <div style={{ background:'var(--rose-bg)', borderRadius:'var(--radius-md)', padding:'12px', marginBottom:'12px', border:'1.5px solid var(--rose)' }}>
                  <div style={{ font:'var(--text-caption)', fontWeight:600, color:'var(--rose)', marginBottom:'4px' }}>⚠️ DRUG ALLERGIES</div>
                  <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>{brief.allergies.map(a => <span key={a} className="badge badge-danger">{a}</span>)}</div>
                </div>
              )}

              {/* Vitals */}
              {brief.vitals && Object.keys(brief.vitals).length > 0 && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'8px', marginBottom:'12px' }}>
                  {[
                    { icon: Heart, label:'BP', value:brief.vitals.bp, unit:'mmHg', color:'var(--rose)' },
                    { icon: Droplets, label:'SpO2', value:brief.vitals.spo2, unit:'%', color:'var(--teal)' },
                    { icon: Thermometer, label:'Temp', value:brief.vitals.temp, unit:'°F', color:'var(--peach)' },
                    { icon: Activity, label:'BMI', value:brief.vitals.bmi, unit:'', color:'var(--primary)' },
                  ].map(v => (
                    <div key={v.label} className="card-flat" style={{ textAlign:'center', padding:'10px' }}>
                      <v.icon size={18} color={v.color} style={{ margin:'0 auto 4px' }} />
                      <div style={{ font:'var(--text-stat)', fontSize:'18px', color:v.color }}>{v.value || '—'}</div>
                      <div style={{ font:'var(--text-caption)', color:'var(--text-tertiary)' }}>{v.label} {v.unit}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Chronic Conditions */}
              {brief.chronicConditions?.length > 0 && (
                <div className="card-flat" style={{ marginBottom:'12px' }}>
                  <div style={{ font:'var(--text-caption)', fontWeight:600, color:'var(--text-secondary)', marginBottom:'6px' }}>CHRONIC CONDITIONS</div>
                  <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>{brief.chronicConditions.map(c => <span key={c} className="badge badge-warning">{c}</span>)}</div>
                </div>
              )}

              {/* Medications */}
              {brief.currentMedications?.length > 0 && (
                <div className="card-flat" style={{ marginBottom:'16px' }}>
                  <div style={{ font:'var(--text-caption)', fontWeight:600, color:'var(--text-secondary)', marginBottom:'6px' }}>CURRENT MEDS</div>
                  {brief.currentMedications.map((m,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                      <Pill size={14} color="var(--teal)" />
                      <span style={{ font:'var(--text-body-sm)' }}>{m.name} {m.dose} ({m.freq})</span>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={startConsultation} disabled={loading} style={{ width:'100%', padding:'14px', background:'var(--primary)', color:'white', borderRadius:'var(--radius-pill)', font:'var(--text-button)', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 8px 24px rgba(107,92,231,0.3)', opacity: loading?0.7:1, marginBottom:'20px' }}>
                <Stethoscope size={20} /> Start Consultation
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Consultation / Diagnosis Panel */}
      <AnimatePresence>
        {consultPanel && (
          <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type:'spring',damping:25}} style={{
            position:'fixed', bottom:0, left:0, right:0, maxHeight:'90vh', background:'var(--bg-card)',
            borderRadius:'24px 24px 0 0', boxShadow:'0 -8px 40px rgba(0,0,0,0.2)', zIndex:200, overflow:'auto',
          }}>
            <div style={{ padding:'20px', paddingBottom:'40px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                <h2 style={{ font:'var(--text-h2)' }}>Consultation</h2>
                <button onClick={() => setConsultPanel(false)} style={{ width:'32px',height:'32px',borderRadius:'50%',background:'var(--primary-bg)',display:'flex',alignItems:'center',justifyContent:'center' }}><X size={18} color="var(--primary)" /></button>
              </div>

              {currentPatient && (
                <div style={{ background:'var(--primary-bg)', borderRadius:'var(--radius-md)', padding:'12px', marginBottom:'16px' }}>
                  <span style={{ font:'var(--text-body-medium)', color:'var(--primary)' }}>{currentPatient.patient_name}</span>
                  <span style={{ font:'var(--text-caption)', color:'var(--text-secondary)', marginLeft:'8px' }}>ABHA: {currentPatient.abha_id}</span>
                </div>
              )}

              {/* Diagnosis */}
              <div className="form-group">
                <label className="form-label">Diagnosis *</label>
                <input className="form-input" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="e.g. Acute Viral Fever" />
              </div>

              <div className="form-group">
                <label className="form-label">Clinical Notes</label>
                <textarea className="form-textarea" value={diagnosisNotes} onChange={e => setDiagnosisNotes(e.target.value)} placeholder="Additional observations..." />
              </div>

              <div className="form-group">
                <label className="form-label">Follow-Up Date</label>
                <input className="form-input" type="date" value={followUp} onChange={e => setFollowUp(e.target.value)} />
              </div>

              {/* Prescription */}
              <div style={{ marginBottom:'16px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
                  <label className="form-label" style={{ marginBottom:0 }}>Prescription</label>
                  <button onClick={() => setRxItems([...rxItems, {name:'',dose:'',freq:'',duration:''}])} style={{ font:'var(--text-caption)', color:'var(--primary)', fontWeight:600 }}>+ Add Medicine</button>
                </div>
                {rxItems.map((item, i) => (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:'8px', marginBottom:'8px' }}>
                    <input className="form-input" style={{ height:'44px', fontSize:'14px' }} placeholder="Medicine" value={item.name} onChange={e => { const n = [...rxItems]; n[i].name = e.target.value; setRxItems(n); }} />
                    <input className="form-input" style={{ height:'44px', fontSize:'14px' }} placeholder="Dose" value={item.dose} onChange={e => { const n = [...rxItems]; n[i].dose = e.target.value; setRxItems(n); }} />
                    <input className="form-input" style={{ height:'44px', fontSize:'14px' }} placeholder="Freq" value={item.freq} onChange={e => { const n = [...rxItems]; n[i].freq = e.target.value; setRxItems(n); }} />
                    <input className="form-input" style={{ height:'44px', fontSize:'14px' }} placeholder="Days" value={item.duration} onChange={e => { const n = [...rxItems]; n[i].duration = e.target.value; setRxItems(n); }} />
                  </div>
                ))}
                <input className="form-input" style={{ height:'44px', fontSize:'14px' }} placeholder="Rx notes (optional)" value={rxNotes} onChange={e => setRxNotes(e.target.value)} />
              </div>

              <button onClick={submitDiagnosis} disabled={loading} id="submit-diagnosis-btn"
                style={{ width:'100%', padding:'16px', background:'var(--teal)', color:'white', borderRadius:'var(--radius-pill)', font:'var(--text-button)', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 8px 24px rgba(78,205,196,0.3)', opacity:loading?0.7:1 }}>
                <Send size={20} /> {loading ? 'Submitting...' : 'Complete & Send Rx'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
