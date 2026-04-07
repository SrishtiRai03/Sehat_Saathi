import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API_BASE } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Users, RefreshCw } from 'lucide-react';

export default function QueueStatus() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = () => {
    if (!user?.refId) return;
    fetch(`${API_BASE}/api/queue/patient/${user.refId}`).then(r => r.json()).then(d => { setStatus(d); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchStatus(); const i = setInterval(fetchStatus, 10000); return () => clearInterval(i); }, [user]);

  const sevColors = { CRITICAL:'var(--critical)', URGENT:'var(--urgent)', MODERATE:'var(--moderate)', ROUTINE:'var(--teal)' };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', padding:'20px' }}>
      <button onClick={() => navigate('/patient')} style={{ display:'flex', alignItems:'center', gap:'8px', color:'var(--text-secondary)', marginBottom:'20px' }}><ArrowLeft size={20} /> Back</button>
      <h1 style={{ font:'var(--text-h1)', marginBottom:'4px' }}>Queue Status</h1>
      <p style={{ font:'var(--text-body-sm)', color:'var(--text-secondary)', marginBottom:'24px' }}>Real-time updates every 10 seconds</p>

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px 0' }}><div className="animate-pulse" style={{ font:'var(--text-h3)', color:'var(--primary)' }}>Loading...</div></div>
      ) : !status?.inQueue ? (
        <div style={{ textAlign:'center', padding:'60px 0' }}>
          <div style={{ width:'80px',height:'80px',borderRadius:'50%',background:'var(--primary-bg)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px' }}>
            <Users size={36} color="var(--primary)" />
          </div>
          <h2 style={{ font:'var(--text-h2)', marginBottom:'8px' }}>Not in Queue</h2>
          <p style={{ font:'var(--text-body)', color:'var(--text-secondary)', marginBottom:'24px' }}>Start a triage assessment to join the queue</p>
          <button onClick={() => navigate('/patient/triage')} style={{ padding:'14px 32px', background:'var(--primary)', color:'white', borderRadius:'var(--radius-pill)', font:'var(--text-button)' }}>Start Triage</button>
        </div>
      ) : (
        <motion.div initial={{ opacity:0,y:15 }} animate={{ opacity:1,y:0 }}>
          {/* Position Card */}
          <div className="card" style={{ textAlign:'center', marginBottom:'16px', background:`linear-gradient(135deg, ${sevColors[status.entry.severity]}15 0%, var(--bg-card) 100%)`, border:`2px solid ${sevColors[status.entry.severity]}30` }}>
            <div className={`badge badge-${status.entry.severity.toLowerCase()}`} style={{ marginBottom:'12px' }}>
              {status.entry.severity}
            </div>
            <div style={{ font:'var(--text-stat)', fontSize:'56px', color:'var(--primary)', marginBottom:'4px' }}>#{status.position}</div>
            <div style={{ font:'var(--text-body)', color:'var(--text-secondary)' }}>Your Position</div>
          </div>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
            <div className="card" style={{ textAlign:'center' }}>
              <Clock size={24} color="var(--teal)" style={{ margin:'0 auto 8px' }} />
              <div style={{ font:'var(--text-stat)', fontSize:'28px', color:'var(--teal)' }}>~{status.estimatedWait}</div>
              <div style={{ font:'var(--text-caption)', color:'var(--text-secondary)' }}>Minutes Wait</div>
            </div>
            <div className="card" style={{ textAlign:'center' }}>
              <Users size={24} color="var(--primary)" style={{ margin:'0 auto 8px' }} />
              <div style={{ font:'var(--text-stat)', fontSize:'28px', color:'var(--primary)' }}>{status.peopleAhead}</div>
              <div style={{ font:'var(--text-caption)', color:'var(--text-secondary)' }}>People Ahead</div>
            </div>
          </div>

          {/* Doctor Info */}
          <div className="card" style={{ marginBottom:'16px' }}>
            <div style={{ font:'var(--text-caption)', color:'var(--text-tertiary)', marginBottom:'4px' }}>YOUR DOCTOR</div>
            <div style={{ font:'var(--text-body-medium)' }}>{status.entry.doctor_name || 'Dr. Anil Verma'}</div>
            <div style={{ font:'var(--text-body-sm)', color:'var(--text-secondary)' }}>{status.entry.specialisation || 'General Medicine'} • {status.entry.phc_name || 'PHC Rampur Kalan'}</div>
          </div>

          <button onClick={fetchStatus} style={{ width:'100%', padding:'14px', background:'var(--primary-bg)', color:'var(--primary)', borderRadius:'var(--radius-pill)', font:'var(--text-button)', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
            <RefreshCw size={18} /> Refresh Status
          </button>
        </motion.div>
      )}
    </div>
  );
}
