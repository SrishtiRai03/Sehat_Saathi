import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Phone, MapPin, AlertTriangle, Shield, Clock, CheckCircle, Ambulance, Heart } from 'lucide-react';

export default function SOS() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stage, setStage] = useState('ready'); // ready | confirming | dispatching | dispatched
  const [countdown, setCountdown] = useState(5);
  const [location, setLocation] = useState(null);
  const intervalRef = useRef(null);
  const profile = user?.profile;

  // Get location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocation({ lat: 26.9124, lng: 75.7873 }) // Default: Jaipur
      );
    } else {
      setLocation({ lat: 26.9124, lng: 75.7873 });
    }
  }, []);

  const startSOS = () => {
    setStage('confirming');
    setCountdown(5);
    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setStage('dispatching');
          setTimeout(() => setStage('dispatched'), 2500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelSOS = () => {
    clearInterval(intervalRef.current);
    setStage('ready');
    setCountdown(5);
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const emergencyContacts = [
    { name: '108 Ambulance', phone: '108', desc: 'State Emergency Ambulance', icon: '🚑' },
    { name: '112 Emergency', phone: '112', desc: 'National Emergency Number', icon: '☎️' },
    { name: 'PHC Rampur Kalan', phone: '01234-567890', desc: 'Primary Health Center', icon: '🏥' },
    { name: 'Dr. Anil Verma', phone: '9876500101', desc: 'Assigned Doctor', icon: '🩺' },
  ];

  return (
    <div style={{ minHeight:'100vh', background: stage === 'ready' ? 'var(--bg)' : 'linear-gradient(180deg, #1a0000 0%, #3d0000 100%)', transition:'background 0.5s' }}>
      {/* Header */}
      <div style={{ padding:'20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <button onClick={() => navigate('/patient')} style={{ display:'flex', alignItems:'center', gap:'8px', color: stage === 'ready' ? 'var(--text-secondary)' : 'rgba(255,255,255,0.6)' }}>
          <ArrowLeft size={20} /> Back
        </button>
        {location && (
          <div style={{ display:'flex', alignItems:'center', gap:'4px', font:'var(--text-caption)', color: stage === 'ready' ? 'var(--text-tertiary)' : 'rgba(255,255,255,0.4)' }}>
            <MapPin size={12} /> GPS Active
          </div>
        )}
      </div>

      <div style={{ padding:'0 20px 100px', textAlign:'center' }}>
        <AnimatePresence mode="wait">
          {stage === 'ready' && (
            <motion.div key="ready" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
              <div style={{ marginBottom:'32px' }}>
                <h1 style={{ font:'var(--text-h1)', color:'var(--critical)', marginBottom:'8px' }}>Emergency SOS</h1>
                <p style={{ font:'var(--text-body)', color:'var(--text-secondary)' }}>Press the button below to dispatch an ambulance to your location</p>
              </div>

              {/* SOS Button */}
              <button id="sos-btn" onClick={startSOS}
                style={{
                  width:'180px', height:'180px', borderRadius:'50%', margin:'0 auto 32px',
                  background:'linear-gradient(135deg, #FF4757 0%, #FF2040 100%)',
                  color:'white', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 0 0 16px rgba(255,71,87,0.15), 0 0 0 32px rgba(255,71,87,0.08), 0 8px 32px rgba(255,71,87,0.4)',
                  animation:'sosPulse 2s ease-in-out infinite', cursor:'pointer', transition:'transform 0.2s',
                  border:'none',
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <AlertTriangle size={48} strokeWidth={2.5} />
                <span style={{ font:'var(--text-button)', fontSize:'20px', marginTop:'8px' }}>SOS</span>
              </button>

              {/* Patient Info Card */}
              <div className="card" style={{ textAlign:'left', marginBottom:'20px', border:'1.5px solid var(--critical)', background:'var(--critical-bg)' }}>
                <div style={{ font:'var(--text-caption)', color:'var(--critical)', fontWeight:600, marginBottom:'8px' }}>YOUR INFORMATION WILL BE SHARED</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                  <div><div style={{ font:'var(--text-caption)', color:'var(--text-tertiary)' }}>Name</div><div style={{ font:'var(--text-body-sm)' }}>{profile?.name || 'Patient'}</div></div>
                  <div><div style={{ font:'var(--text-caption)', color:'var(--text-tertiary)' }}>Blood Group</div><div style={{ font:'var(--text-body-sm)' }}>{profile?.blood_group || 'N/A'}</div></div>
                  <div><div style={{ font:'var(--text-caption)', color:'var(--text-tertiary)' }}>ABHA ID</div><div style={{ font:'var(--text-body-sm)' }}>{profile?.abha_id || 'N/A'}</div></div>
                  <div><div style={{ font:'var(--text-caption)', color:'var(--text-tertiary)' }}>Location</div><div style={{ font:'var(--text-body-sm)' }}>{location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Detecting...'}</div></div>
                </div>
              </div>

              {/* Emergency Contacts */}
              <h3 style={{ font:'var(--text-h3)', marginBottom:'12px', textAlign:'left' }}>Emergency Contacts</h3>
              {emergencyContacts.map((c, i) => (
                <a href={`tel:${c.phone}`} key={i} className="card" style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'10px', textDecoration:'none', color:'inherit' }}>
                  <div style={{ fontSize:'28px' }}>{c.icon}</div>
                  <div style={{ flex:1, textAlign:'left' }}>
                    <div style={{ font:'var(--text-body-medium)' }}>{c.name}</div>
                    <div style={{ font:'var(--text-caption)', color:'var(--text-secondary)' }}>{c.desc}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'4px', color:'var(--primary)', font:'var(--text-body-sm)', fontWeight:600 }}>
                    <Phone size={16} /> {c.phone}
                  </div>
                </a>
              ))}
            </motion.div>
          )}

          {stage === 'confirming' && (
            <motion.div key="confirming" initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} exit={{opacity:0}}>
              <div style={{ paddingTop:'60px' }}>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  style={{ width:'140px', height:'140px', borderRadius:'50%', background:'rgba(255,71,87,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', border:'3px solid rgba(255,71,87,0.5)' }}
                >
                  <div style={{ font:'700 64px/1 var(--font-mono)', color:'white' }}>{countdown}</div>
                </motion.div>
                <h2 style={{ font:'var(--text-h1)', color:'white', marginBottom:'8px' }}>Dispatching Ambulance...</h2>
                <p style={{ font:'var(--text-body)', color:'rgba(255,255,255,0.7)', marginBottom:'32px' }}>Tap cancel to abort emergency dispatch</p>
                <button onClick={cancelSOS} style={{
                  padding:'16px 48px', background:'rgba(255,255,255,0.15)', color:'white',
                  borderRadius:'var(--radius-pill)', font:'var(--text-button)', border:'1.5px solid rgba(255,255,255,0.3)',
                  backdropFilter:'blur(10px)',
                }}>Cancel</button>
              </div>
            </motion.div>
          )}

          {stage === 'dispatching' && (
            <motion.div key="dispatching" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <div style={{ paddingTop:'80px' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  style={{ width:'60px', height:'60px', borderRadius:'50%', border:'4px solid rgba(255,255,255,0.2)', borderTopColor:'white', margin:'0 auto 24px' }}
                />
                <h2 style={{ font:'var(--text-h2)', color:'white', marginBottom:'8px' }}>Connecting to Emergency Services...</h2>
                <p style={{ font:'var(--text-body)', color:'rgba(255,255,255,0.5)' }}>Sharing your location & medical details</p>
              </div>
            </motion.div>
          )}

          {stage === 'dispatched' && (
            <motion.div key="dispatched" initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} exit={{opacity:0}}>
              <div style={{ paddingTop:'60px' }}>
                <motion.div initial={{scale:0}} animate={{scale:1}} transition={{ type:'spring', stiffness:200 }}
                  style={{ width:'80px',height:'80px',borderRadius:'50%',background:'rgba(46,204,113,0.2)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',border:'3px solid #2ECC71' }}>
                  <CheckCircle size={40} color="#2ECC71" />
                </motion.div>
                <h2 style={{ font:'var(--text-h1)', color:'white', marginBottom:'8px' }}>Ambulance Dispatched!</h2>
                <p style={{ font:'var(--text-body)', color:'rgba(255,255,255,0.7)', marginBottom:'24px' }}>Stay calm. Help is on the way.</p>

                <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:'var(--radius-xl)', padding:'24px', marginBottom:'20px', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', textAlign:'left' }}>
                    <div><div style={{ font:'var(--text-caption)', color:'rgba(255,255,255,0.5)' }}>Ambulance</div><div style={{ font:'var(--text-body-medium)', color:'white' }}>RJ-14-EMRG-108</div></div>
                    <div><div style={{ font:'var(--text-caption)', color:'rgba(255,255,255,0.5)' }}>ETA</div><div style={{ font:'var(--text-stat)', fontSize:'24px', color:'#2ECC71' }}>~12 min</div></div>
                    <div><div style={{ font:'var(--text-caption)', color:'rgba(255,255,255,0.5)' }}>Driver</div><div style={{ font:'var(--text-body-medium)', color:'white' }}>Ramesh Kumar</div></div>
                    <div><div style={{ font:'var(--text-caption)', color:'rgba(255,255,255,0.5)' }}>Contact</div><div style={{ font:'var(--text-body-medium)', color:'white' }}>+91 98765 43210</div></div>
                  </div>
                </div>

                <div style={{ display:'flex', gap:'10px', marginBottom:'20px' }}>
                  <button style={{ flex:1, padding:'14px', background:'#2ECC71', color:'white', borderRadius:'var(--radius-pill)', font:'var(--text-button)', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                    <Phone size={18} /> Call Driver
                  </button>
                  <button onClick={() => { setStage('ready'); }} style={{ flex:1, padding:'14px', background:'rgba(255,255,255,0.1)', color:'white', borderRadius:'var(--radius-pill)', font:'var(--text-button)', border:'1px solid rgba(255,255,255,0.2)' }}>
                    Go Back
                  </button>
                </div>

                {/* First Aid Tips */}
                <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:'var(--radius-lg)', padding:'16px', textAlign:'left', border:'1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ font:'var(--text-body-medium)', color:'white', marginBottom:'10px', display:'flex', alignItems:'center', gap:'8px' }}><Heart size={18} color="var(--rose)" /> First Aid Tips</div>
                  {['Stay calm and lie down if feeling dizzy', 'Keep the patient warm with a blanket', 'Do not give food or water if unconscious', 'Note any medications taken recently'].map((t,i) => (
                    <div key={i} style={{ display:'flex', gap:'8px', marginBottom:'6px', alignItems:'flex-start' }}>
                      <div style={{ width:'6px',height:'6px',borderRadius:'50%',background:'rgba(255,255,255,0.4)',marginTop:'7px',flexShrink:0 }} />
                      <span style={{ font:'var(--text-body-sm)', color:'rgba(255,255,255,0.6)' }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
