import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, User, CheckCircle, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
}

export default function BookAppointment() {
  const { user, authFetch } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [doctorId] = useState(1);
  const [myAppts, setMyAppts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    authFetch('/api/appointments/my').then(d => setMyAppts(d.appointments || [])).catch(() => {});
  }, [booked]);

  useEffect(() => {
    if (!selectedDate) return;
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(selectedDate).padStart(2,'0')}`;
    fetch(`/api/appointments/slots/${doctorId}?date=${dateStr}`).then(r => r.json()).then(d => { setSlots(d); setSelectedSlot(null); }).catch(() => {});
  }, [selectedDate, year, month]);

  const handleBook = async () => {
    if (!selectedSlot) return;
    setLoading(true);
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(selectedDate).padStart(2,'0')}`;
    try {
      const res = await authFetch('/api/appointments/book', { method:'POST', body: JSON.stringify({ doctorId, date: dateStr, timeSlot: selectedSlot, notes }) });
      setBooked(res);
      addToast('Appointment booked successfully!', 'success');
    } catch { addToast('Failed to book', 'error'); }
    setLoading(false);
  };

  const calDays = getCalendarDays(year, month);
  const today = now.getDate();
  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();

  if (booked) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg)', padding:'20px' }}>
        <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} style={{ textAlign:'center', paddingTop:'60px' }}>
          <div style={{ width:'80px',height:'80px',borderRadius:'50%',background:'var(--teal-bg)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',border:'3px solid var(--teal)' }}>
            <CheckCircle size={40} color="var(--teal)" />
          </div>
          <h1 style={{ font:'var(--text-h1)', marginBottom:'8px' }}>Appointment Booked!</h1>
          <p style={{ font:'var(--text-body)', color:'var(--text-secondary)', marginBottom:'24px' }}>
            You're confirmed for {selectedSlot} on {selectedDate}/{month+1}/{year}
          </p>
          <div className="card" style={{ textAlign:'left', marginBottom:'16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}><User size={18} color="var(--primary)" /><span style={{ font:'var(--text-body-medium)' }}>{slots?.doctor?.name}</span></div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}><MapPin size={16} color="var(--text-tertiary)" /><span style={{ font:'var(--text-body-sm)', color:'var(--text-secondary)' }}>{slots?.doctor?.phc}</span></div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}><Clock size={16} color="var(--text-tertiary)" /><span style={{ font:'var(--text-body-sm)', color:'var(--text-secondary)' }}>{selectedSlot} • {slots?.doctor?.specialisation}</span></div>
          </div>
          <div style={{ display:'flex', gap:'12px' }}>
            <button onClick={() => navigate('/patient')} style={{ flex:1, padding:'14px', background:'var(--primary)', color:'white', borderRadius:'var(--radius-pill)', font:'var(--text-button)' }}>Dashboard</button>
            <button onClick={() => { setBooked(null); setSelectedDate(null); setSlots(null); }} style={{ flex:1, padding:'14px', background:'var(--primary-bg)', color:'var(--primary)', borderRadius:'var(--radius-pill)', font:'var(--text-button)' }}>Book Another</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg, var(--peach) 0%, var(--peach-dark) 100%)', padding:'20px 20px 32px', borderRadius:'0 0 32px 32px' }}>
        <button onClick={() => navigate('/patient')} style={{ display:'flex', alignItems:'center', gap:'8px', color:'rgba(255,255,255,0.8)', marginBottom:'16px' }}><ArrowLeft size={20} /> Back</button>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'48px', height:'48px', borderRadius:'14px', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Calendar size={24} color="white" />
          </div>
          <div>
            <h1 style={{ font:'var(--text-h2)', color:'white' }}>Book Appointment</h1>
            <p style={{ font:'var(--text-body-sm)', color:'rgba(255,255,255,0.8)' }}>Schedule your next visit</p>
          </div>
        </div>
      </div>

      <div style={{ padding:'20px', paddingBottom:'100px' }}>
        {/* Doctor Info */}
        <div className="card" style={{ marginBottom:'20px', display:'flex', alignItems:'center', gap:'14px' }}>
          <div style={{ width:'50px', height:'50px', borderRadius:'50%', background:'var(--teal-bg)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <User size={24} color="var(--teal)" />
          </div>
          <div>
            <div style={{ font:'var(--text-body-medium)' }}>Dr. Anil Verma</div>
            <div style={{ font:'var(--text-body-sm)', color:'var(--text-secondary)' }}>General Medicine • PHC Rampur Kalan</div>
          </div>
        </div>

        {/* Calendar */}
        <div className="card" style={{ marginBottom:'20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
            <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); }} style={{ width:'36px',height:'36px',borderRadius:'50%',background:'var(--primary-bg)',display:'flex',alignItems:'center',justifyContent:'center' }}><ChevronLeft size={20} color="var(--primary)" /></button>
            <span style={{ font:'var(--text-body-medium)' }}>{MONTHS[month]} {year}</span>
            <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); }} style={{ width:'36px',height:'36px',borderRadius:'50%',background:'var(--primary-bg)',display:'flex',alignItems:'center',justifyContent:'center' }}><ChevronRight size={20} color="var(--primary)" /></button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'4px', textAlign:'center', marginBottom:'8px' }}>
            {DAYS.map(d => <div key={d} style={{ font:'var(--text-caption)', fontWeight:600, color:'var(--text-tertiary)', padding:'4px' }}>{d}</div>)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'4px', textAlign:'center' }}>
            {calDays.map((d, i) => {
              if (!d) return <div key={`e${i}`} />;
              const isPast = isCurrentMonth && d < today;
              const isSunday = new Date(year, month, d).getDay() === 0;
              const disabled = isPast || isSunday;
              const selected = d === selectedDate;
              return (
                <button key={d} disabled={disabled} onClick={() => setSelectedDate(d)}
                  style={{
                    width:'38px', height:'38px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto',
                    font:'var(--text-body-sm)', fontWeight: selected ? 700 : 500,
                    background: selected ? 'var(--primary)' : d === today && isCurrentMonth ? 'var(--primary-bg)' : 'transparent',
                    color: selected ? 'white' : disabled ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    cursor: disabled ? 'not-allowed' : 'pointer', transition:'all 0.2s',
                    border: d === today && isCurrentMonth && !selected ? '2px solid var(--primary)' : '2px solid transparent',
                  }}>
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Slots */}
        <AnimatePresence mode="wait">
          {slots && (
            <motion.div key="slots" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} style={{ marginBottom:'20px' }}>
              <h3 style={{ font:'var(--text-h3)', marginBottom:'12px' }}>Available Slots</h3>
              {slots.available?.length === 0 ? (
                <div className="card" style={{ textAlign:'center', padding:'32px' }}>
                  <p style={{ font:'var(--text-body)', color:'var(--text-secondary)' }}>No slots available on this date</p>
                </div>
              ) : (
                <>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'16px' }}>
                    {slots.available?.map(s => (
                      <button key={s} onClick={() => setSelectedSlot(s)}
                        style={{
                          padding:'12px 8px', borderRadius:'var(--radius-md)', font:'var(--text-body-sm)', fontWeight:600,
                          background: selectedSlot === s ? 'var(--primary)' : 'var(--bg-card)',
                          color: selectedSlot === s ? 'white' : 'var(--text-primary)',
                          border: `2px solid ${selectedSlot === s ? 'var(--primary)' : 'var(--border)'}`,
                          transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px',
                        }}>
                        <Clock size={14} /> {s}
                      </button>
                    ))}
                  </div>
                  {selectedSlot && (
                    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
                      <div className="form-group">
                        <label className="form-label">Notes (optional)</label>
                        <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any symptoms or concerns..." style={{ minHeight:'80px' }} />
                      </div>
                      <button onClick={handleBook} disabled={loading} id="book-btn"
                        style={{ width:'100%', padding:'16px', background:'var(--primary)', color:'white', borderRadius:'var(--radius-pill)', font:'var(--text-button)', boxShadow:'0 8px 24px rgba(107,92,231,0.3)', opacity:loading?0.7:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                        {loading ? 'Booking...' : 'Confirm Appointment'}
                      </button>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* My Appointments */}
        {myAppts.length > 0 && (
          <div>
            <h3 style={{ font:'var(--text-h3)', marginBottom:'12px' }}>My Appointments</h3>
            {myAppts.map((a,i) => (
              <div key={i} className="card" style={{ marginBottom:'10px', borderLeft:`4px solid ${a.status==='booked'?'var(--teal)':'var(--text-tertiary)'}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ font:'var(--text-body-medium)' }}>{a.doctor_name}</div>
                  <div style={{ font:'var(--text-body-sm)', color:'var(--text-secondary)' }}>{a.date} at {a.time_slot}</div>
                  <div style={{ font:'var(--text-caption)', color:'var(--text-tertiary)' }}>{a.phc_name}</div>
                </div>
                <span className={`badge ${a.status==='booked'?'badge-success':'badge-warning'}`}>{a.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
