/**
 * @fileoverview Consultation API routes.
 * Handles doctor-patient consultations including diagnosis submission,
 * prescription creation, and consultation history.
 * @module routes/consultation
 */

import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();


router.post('/start', authMiddleware, (req, res) => {
  const { patientId, doctorId, queueEntryId } = req.body;
  const qe = queueEntryId ? db.findOne('queue_entries', e => e.entry_id === queueEntryId) : null;
  const r = db.insert('consultations', { patient_id:patientId, doctor_id:doctorId, queue_entry_id:queueEntryId, triage_score:qe?.score||0, status:'in_progress' });
  if (queueEntryId) db.update('queue_entries', e => e.entry_id === queueEntryId, { status:'in_consultation', called_at:new Date().toISOString() });
  res.json({ consultId: r.lastInsertRowid, status: 'in_progress' });
});

router.post('/diagnose', authMiddleware, (req, res) => {
  const { consultId, diagnosis, diagnosisIcd10, notes, followUpDate, prescription } = req.body;
  const io = req.app.get('io');
  db.update('consultations', c => c.consult_id === consultId, { diagnosis, diagnosis_icd10:diagnosisIcd10||'', notes:notes||'', follow_up_date:followUpDate||'', status:'completed', completed_at:new Date().toISOString() });
  const c = db.findOne('consultations', c => c.consult_id === consultId);
  if (prescription?.items?.length) {
    const r = db.insert('prescriptions', { consult_id:consultId, patient_id:c.patient_id, doctor_id:c.doctor_id, pharmacy_id:1, items:JSON.stringify(prescription.items), notes:prescription.notes||'', status:'pending' });
    if (io) io.emit('new-prescription', { rxId: r.lastInsertRowid });
  }
  if (c.queue_entry_id) {
    db.update('queue_entries', e => e.entry_id === c.queue_entry_id, { status:'completed', completed_at:new Date().toISOString() });
    const entries = db.findAll('queue_entries', e => e.doctor_id === c.doctor_id && e.status === 'waiting').sort((a,b) => b.score-a.score);
    entries.forEach((e,i) => db.update('queue_entries', x => x.entry_id === e.entry_id, { position:i+1, estimated_wait:Math.max(5,(i+1)*8) }));
    if (io) {
      const q = db.findAll('queue_entries', e => e.doctor_id === c.doctor_id && (e.status === 'waiting'||e.status === 'in_consultation')).sort((a,b) => b.score-a.score);
      q.forEach(e => { const p = db.findOne('patients', p => p.patient_id === e.patient_id); e.patient_name = p?.name; e.abha_id = p?.abha_id; });
      io.to(`queue-${c.doctor_id}`).emit('queue-updated', q);
    }
  }
  res.json({ success: true, consultId });
});

router.get('/:consultId', (req, res) => {
  const c = db.findOne('consultations', c => c.consult_id === parseInt(req.params.consultId));
  if (!c) return res.status(404).json({ error: 'Not found' });
  const p = db.findOne('patients', p => p.patient_id === c.patient_id);
  const d = db.findOne('doctors', d => d.doctor_id === c.doctor_id);
  c.patient_name = p?.name; c.abha_id = p?.abha_id; c.doctor_name = d?.name; c.specialisation = d?.specialisation;
  const rx = db.findOne('prescriptions', r => r.consult_id === c.consult_id);
  if (rx) rx.items = JSON.parse(rx.items||'[]');
  res.json({ consultation: c, prescription: rx });
});

router.get('/brief/:patientId', (req, res) => {
  const pid = parseInt(req.params.patientId);
  const p = db.findOne('patients', pp => pp.patient_id === pid);
  if (!p) return res.status(404).json({ error: 'Not found' });
  const r = db.findOne('health_records', r => r.patient_id === pid);
  const t = db.findAll('triage_sessions', t => t.patient_id === pid).sort((a,b) => new Date(b.created_at)-new Date(a.created_at))[0];
  const pc = db.findAll('consultations', c => c.patient_id === pid).sort((a,b) => new Date(b.created_at)-new Date(a.created_at));
  const vitals = r ? JSON.parse(r.vitals||'{}') : {};
  const allergies = r ? JSON.parse(r.allergies||'[]') : [];
  const conditions = r ? JSON.parse(r.chronic_conditions||'[]') : [];
  const medications = r ? JSON.parse(r.medications||'[]') : [];
  const age = p.dob ? new Date().getFullYear()-new Date(p.dob).getFullYear() : null;
  res.json({ patient:{ name:p.name, age, gender:p.gender, bloodGroup:p.blood_group, abhaId:p.abha_id, phone:p.phone, riskScore:p.risk_score }, vitals, allergies, chronicConditions:conditions, currentMedications:medications, triageSummary:t?{score:t.score,severity:t.severity}:null, pastVisits:pc.length, lastVisit:pc[0]?.created_at||'First visit' });
});

export default router;
