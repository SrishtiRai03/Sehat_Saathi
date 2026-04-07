/**
 * @fileoverview Health records API routes.
 * Provides ABHA-linked digital health records including vitals, allergies,
 * chronic conditions, medications, vaccinations, and lab results.
 * Also generates AI-powered wellness recommendations.
 * @module routes/records
 */

import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();


router.get('/:abhaId', (req, res) => {
  const patient = db.findOne('patients', p => p.abha_id === req.params.abhaId);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  const record = db.findOne('health_records', r => r.patient_id === patient.patient_id);
  const parsed = record ? { ...record, vitals: JSON.parse(record.vitals||'{}'), allergies: JSON.parse(record.allergies||'[]'), chronic_conditions: JSON.parse(record.chronic_conditions||'[]'), medications: JSON.parse(record.medications||'[]'), vaccinations: JSON.parse(record.vaccinations||'[]'), lab_results: JSON.parse(record.lab_results||'[]') } : null;
  res.json({ patient, record: parsed });
});

router.get('/patient/:patientId', (req, res) => {
  const pid = parseInt(req.params.patientId);
  const patient = db.findOne('patients', p => p.patient_id === pid);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  const record = db.findOne('health_records', r => r.patient_id === pid);
  const parsed = record ? { ...record, vitals: JSON.parse(record.vitals||'{}'), allergies: JSON.parse(record.allergies||'[]'), chronic_conditions: JSON.parse(record.chronic_conditions||'[]'), medications: JSON.parse(record.medications||'[]'), vaccinations: JSON.parse(record.vaccinations||'[]'), lab_results: JSON.parse(record.lab_results||'[]') } : null;
  res.json({ patient, record: parsed });
});

router.get('/history/:patientId', (req, res) => {
  const pid = parseInt(req.params.patientId);
  const consults = db.findAll('consultations', c => c.patient_id === pid).sort((a,b) => new Date(b.created_at)-new Date(a.created_at));
  consults.forEach(c => { const d = db.findOne('doctors', d => d.doctor_id === c.doctor_id); c.doctor_name = d?.name; c.specialisation = d?.specialisation; });
  res.json({ consultations: consults });
});

router.post('/wellness', authMiddleware, (req, res) => {
  const { patientId } = req.body;
  const patient = db.findOne('patients', p => p.patient_id === parseInt(patientId));
  const record = db.findOne('health_records', r => r.patient_id === parseInt(patientId));
  if (!patient) return res.status(404).json({ error: 'Not found' });
  const conditions = record ? JSON.parse(record.chronic_conditions||'[]') : [];
  const vitals = record ? JSON.parse(record.vitals||'{}') : {};
  const recs = [];
  if (conditions.includes('Diabetes Type 2')||conditions.includes('Diabetes')) {
    recs.push({ category:'diet', severity:'Advisory', title:'Blood Sugar Management', text:'Monitor blood sugar twice daily. Prefer whole grains over white rice.', icon:'🍎' });
    recs.push({ category:'medication', severity:'Urgent', title:'Medication Adherence', text:'Take Metformin with meals as prescribed. Do not skip doses.', icon:'💊' });
  }
  if (conditions.includes('Hypertension')) {
    recs.push({ category:'diet', severity:'Advisory', title:'Blood Pressure Control', text:'Reduce salt to <5g/day. Include potassium-rich foods like bananas.', icon:'🫀' });
    recs.push({ category:'activity', severity:'Informational', title:'Daily Walk', text:'Walk 30 min daily. Practice deep breathing for stress.', icon:'🚶' });
  }
  recs.push({ category:'hydration', severity:'Informational', title:'Stay Hydrated', text:'Drink 8+ glasses of clean water daily.', icon:'💧' });
  recs.push({ category:'sleep', severity:'Informational', title:'Sleep Schedule', text:'Aim for 7-8 hours. Consistent bed/wake times.', icon:'😴' });
  if (vitals.bp && parseInt(vitals.bp.split('/')[0]) > 140) {
    recs.push({ category:'monitoring', severity:'Urgent', title:'BP Alert', text:`Last BP: ${vitals.bp}. Check daily, visit PHC if >160/100.`, icon:'⚠️' });
  }
  const rs = patient.risk_score || 30;
  res.json({ patientName: patient.name, riskScore: rs, riskLevel: rs>70?'High':rs>40?'Medium':'Low', recommendations: recs, generatedAt: new Date().toISOString() });
});

export default router;
