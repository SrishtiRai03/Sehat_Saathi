/**
 * @fileoverview Queue management API routes.
 * Handles severity-based priority queue with real-time WebSocket updates.
 * Supports doctor queue view, patient position tracking, call-next, and reprioritisation.
 * @module routes/queue
 */

import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();


router.get('/doctor/:doctorId', (req, res) => {
  const did = parseInt(req.params.doctorId);
  let entries = db.findAll('queue_entries', e => e.doctor_id === did && (e.status === 'waiting' || e.status === 'in_consultation'));
  entries.sort((a,b) => b.score - a.score);
  entries.forEach(e => {
    const p = db.findOne('patients', p => p.patient_id === e.patient_id);
    const ts = e.triage_session_id ? db.findOne('triage_sessions', t => t.session_id === e.triage_session_id) : null;
    e.patient_name = p?.name; e.abha_id = p?.abha_id; e.phone = p?.phone; e.gender = p?.gender; e.dob = p?.dob; e.blood_group = p?.blood_group;
    if (ts) { e.triage_severity = ts.severity; e.triage_score = ts.score; e.triage_answers = ts.answers; }
  });
  res.json({ entries, count: entries.length });
});

router.get('/patient/:patientId', (req, res) => {
  const pid = parseInt(req.params.patientId);
  const entry = db.findOne('queue_entries', e => e.patient_id === pid && e.status === 'waiting');
  if (!entry) return res.json({ inQueue: false });
  const d = db.findOne('doctors', d => d.doctor_id === entry.doctor_id);
  entry.doctor_name = d?.name; entry.specialisation = d?.specialisation; entry.phc_name = d?.phc_name;
  const ahead = db.count('queue_entries', e => e.doctor_id === entry.doctor_id && e.status === 'waiting' && (e.score > entry.score || (e.score === entry.score && e.created_at < entry.created_at)));
  res.json({ inQueue: true, entry, position: ahead + 1, estimatedWait: entry.estimated_wait, peopleAhead: ahead });
});

router.get('/eta/:entryId', (req, res) => {
  const entry = db.findOne('queue_entries', e => e.entry_id === parseInt(req.params.entryId));
  if (!entry) return res.status(404).json({ error: 'Not found' });
  const ahead = db.count('queue_entries', e => e.doctor_id === entry.doctor_id && e.status === 'waiting' && e.position < entry.position);
  const wait = Math.max(3, (ahead+1)*8);
  res.json({ entryId: entry.entry_id, waitMinutes: wait, confidenceInterval: Math.round(wait*0.15), position: entry.position });
});

router.post('/call-next', authMiddleware, (req, res) => {
  const { doctorId } = req.body;
  const io = req.app.get('io');
  db.update('queue_entries', e => e.doctor_id === doctorId && e.status === 'in_consultation', { status: 'completed', completed_at: new Date().toISOString() });
  const waiting = db.findAll('queue_entries', e => e.doctor_id === doctorId && e.status === 'waiting').sort((a,b) => b.score - a.score);
  if (!waiting.length) return res.json({ message: 'No more patients', entry: null });
  const next = waiting[0];
  db.update('queue_entries', e => e.entry_id === next.entry_id, { status: 'in_consultation', called_at: new Date().toISOString() });
  const p = db.findOne('patients', p => p.patient_id === next.patient_id);
  next.patient_name = p?.name;
  recalcPositions(doctorId);
  if (io) {
    io.to(`queue-${doctorId}`).emit('patient-called', next);
    io.to(`patient-${next.patient_id}`).emit('your-turn', {});
    emitQueueUpdate(doctorId, io);
  }
  res.json({ entry: next, message: `Calling ${next.patient_name}` });
});

router.post('/reprioritise', authMiddleware, (req, res) => {
  const { entryId, newScore } = req.body;
  const entry = db.findOne('queue_entries', e => e.entry_id === parseInt(entryId));
  if (!entry) return res.status(404).json({ error: 'Not found' });
  const severity = newScore >= 8 ? 'CRITICAL' : newScore >= 5 ? 'URGENT' : newScore >= 3 ? 'MODERATE' : 'ROUTINE';
  db.update('queue_entries', e => e.entry_id === parseInt(entryId), { score: newScore, severity });
  recalcPositions(entry.doctor_id);
  const io = req.app.get('io');
  if (io) emitQueueUpdate(entry.doctor_id, io);
  res.json({ success: true, severity });
});

function recalcPositions(doctorId) {
  const entries = db.findAll('queue_entries', e => e.doctor_id === doctorId && e.status === 'waiting').sort((a,b) => b.score - a.score);
  entries.forEach((e,i) => db.update('queue_entries', x => x.entry_id === e.entry_id, { position: i+1, estimated_wait: Math.max(5,(i+1)*8) }));
}

function emitQueueUpdate(doctorId, io) {
  const q = db.findAll('queue_entries', e => e.doctor_id === doctorId && (e.status === 'waiting' || e.status === 'in_consultation')).sort((a,b) => b.score - a.score);
  q.forEach(e => { const p = db.findOne('patients', p => p.patient_id === e.patient_id); e.patient_name = p?.name; e.abha_id = p?.abha_id; });
  io.to(`queue-${doctorId}`).emit('queue-updated', q);
}

export default router;
