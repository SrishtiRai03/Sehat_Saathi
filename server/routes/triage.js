/**
 * @fileoverview Triage API routes.
 * Implements 3-stage symptom assessment with weighted scoring algorithm.
 * Stage 1: Emergency screening (critical yes/no questions)
 * Stage 2: Severity assessment (pain scale, symptom type, progression)
 * Stage 3: Context & history (travel, medications, demographics)
 * @module routes/triage
 */

import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/utils.js';

const router = Router();

/** @constant {number} TOTAL_STAGES - Number of triage stages */
const TOTAL_STAGES = 3;

/** @constant {number} MAX_SCORE - Maximum severity score */
const MAX_SCORE = 10;

/** @constant {Object} SEVERITY_MAP - Score-to-severity mapping thresholds */
const SEVERITY_MAP = {
  CRITICAL: 8,
  URGENT: 5,
  MODERATE: 3,
};

const triageQuestions = {
  1: [
    { id:'q1_1', text:'Are you experiencing difficulty breathing or chest pain?', type:'boolean', critical:true },
    { id:'q1_2', text:'Have you lost consciousness or are you unable to move any limb?', type:'boolean', critical:true },
    { id:'q1_3', text:'Is there uncontrolled bleeding or a severe injury?', type:'boolean', critical:true },
  ],
  2: [
    { id:'q2_1', text:'How would you rate your pain level?', type:'scale', min:0, max:10, weight:0.25, labels:{0:'No pain',5:'Moderate',10:'Worst pain'} },
    { id:'q2_2', text:'How long have you been experiencing symptoms?', type:'select', weight:0.15, options:[{value:'hours',label:'A few hours',score:2},{value:'1-2days',label:'1-2 days',score:4},{value:'3-7days',label:'3-7 days',score:6},{value:'over_week',label:'More than a week',score:8}] },
    { id:'q2_3', text:'Are your symptoms getting worse?', type:'select', weight:0.20, options:[{value:'improving',label:'Getting better',score:1},{value:'stable',label:'Same',score:4},{value:'worsening',label:'Getting worse',score:7},{value:'rapid',label:'Rapidly worse',score:10}] },
    { id:'q2_4', text:'What is your primary symptom?', type:'select', weight:0.15, options:[{value:'fever',label:'Fever',score:4},{value:'cough',label:'Cough/Cold',score:3},{value:'stomach',label:'Stomach pain/Diarrhoea',score:5},{value:'headache',label:'Headache/Dizziness',score:4},{value:'skin',label:'Skin rash',score:3},{value:'body_pain',label:'Body/Joint pain',score:3},{value:'weakness',label:'Weakness/Fatigue',score:5},{value:'other',label:'Other',score:4}] },
    { id:'q2_5', text:'Do you have any accompanying symptoms?', type:'multiselect', weight:0.15, options:[{value:'nausea',label:'Nausea/Vomiting',score:2},{value:'fever',label:'High Fever (>102°F)',score:3},{value:'dizziness',label:'Dizziness/Fainting',score:3},{value:'swelling',label:'Swelling',score:2},{value:'breathing',label:'Mild breathing difficulty',score:4},{value:'none',label:'No other symptoms',score:0}] },
    { id:'q2_6', text:'Do you have any of these conditions?', type:'multiselect', weight:0.10, options:[{value:'diabetes',label:'Diabetes',score:2},{value:'heart',label:'Heart disease',score:3},{value:'bp',label:'High BP',score:2},{value:'lung',label:'Lung disease',score:2},{value:'pregnant',label:'Pregnant',score:2},{value:'none',label:'None',score:0}] },
  ],
  3: [
    { id:'q3_1', text:'Have you traveled recently or been in contact with a sick person?', type:'select', options:[{value:'no',label:'No',score:0},{value:'travel',label:'Traveled recently',score:2},{value:'contact',label:'Contact with sick person',score:3},{value:'both',label:'Both',score:5}] },
    { id:'q3_2', text:'Are you currently taking any medications?', type:'boolean' },
    { id:'q3_3', text:'Do you have any known drug allergies?', type:'boolean' },
    { id:'q3_4', text:'Main reason for this visit?', type:'select', options:[{value:'new',label:'New complaint',score:0},{value:'followup',label:'Follow-up',score:0},{value:'medication',label:'Medication query',score:0},{value:'emergency',label:'Emergency',score:5}] },
    { id:'q3_5', text:'Your age group:', type:'select', options:[{value:'child',label:'Under 5',score:3},{value:'young',label:'5-17',score:1},{value:'adult',label:'18-59',score:0},{value:'senior',label:'60+',score:2}] },
  ],
};

router.get('/questions/:stage', (req, res) => {
  const stage = parseInt(req.params.stage);
  if (!triageQuestions[stage]) return res.status(400).json({ error: 'Invalid stage' });
  res.json({ stage, questions: triageQuestions[stage], totalStages: 3 });
});

router.post('/start', authMiddleware, (req, res) => {
  const patientId = req.user.refId;
  const result = db.insert('triage_sessions', { patient_id: patientId, stage: 1, answers: '{}', score: 0, severity: 'ROUTINE', status: 'in_progress' });
  res.json({ sessionId: result.lastInsertRowid, stage: 1, questions: triageQuestions[1], totalStages: 3 });
});

router.post('/submit', authMiddleware, (req, res) => {
  const { sessionId, stage, answers } = req.body;
  const session = db.findOne('triage_sessions', s => s.session_id === sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const existing = JSON.parse(session.answers || '{}');
  const merged = { ...existing, ...answers };

  if (stage === 1) {
    const isCritical = Object.values(answers).some(a => a === true || a === 'true');
    if (isCritical) {
      db.update('triage_sessions', s => s.session_id === sessionId, { answers: JSON.stringify(merged), score: 10, severity: 'CRITICAL', status: 'completed', completed_at: new Date().toISOString() });
      addToQueue(session.patient_id, 1, sessionId, 10, 'CRITICAL', req.app.get('io'));
      return res.json({ sessionId, stage: 1, completed: true, score: 10, severity: 'CRITICAL', message: '🚨 Emergency detected! You have been prioritized.' });
    }
    db.update('triage_sessions', s => s.session_id === sessionId, { stage: 2, answers: JSON.stringify(merged) });
    return res.json({ sessionId, stage: 2, questions: triageQuestions[2], totalStages: 3 });
  }

  if (stage === 2) {
    db.update('triage_sessions', s => s.session_id === sessionId, { stage: 3, answers: JSON.stringify(merged) });
    return res.json({ sessionId, stage: 3, questions: triageQuestions[3], totalStages: 3 });
  }

  if (stage === 3) {
    const score = calcScore(merged, session.patient_id);
    const severity = score >= 8 ? 'CRITICAL' : score >= 5 ? 'URGENT' : score >= 3 ? 'MODERATE' : 'ROUTINE';
    db.update('triage_sessions', s => s.session_id === sessionId, { answers: JSON.stringify(merged), score, severity, status: 'completed', completed_at: new Date().toISOString() });
    const qe = addToQueue(session.patient_id, 1, sessionId, score, severity, req.app.get('io'));
    const msgs = { CRITICAL:'🚨 Immediate attention needed.', URGENT:'⚠️ Prompt care needed.', MODERATE:'📋 You are in the queue.', ROUTINE:'✅ Visit scheduled.' };
    return res.json({ sessionId, completed: true, score: Math.round(score*10)/10, severity, queuePosition: qe.position, estimatedWait: qe.estimated_wait, message: msgs[severity] });
  }
});

/**
 * Calculates a severity score (0-10) based on triage answers.
 * Uses weighted scoring across multiple symptom dimensions:
 * - Pain level (25%), Duration (15%), Progression (20%)
 * - Primary symptom (15%), Accompanying symptoms (15%)
 * - Pre-existing conditions & demographics (bonus modifiers)
 *
 * @param {Object} answers - Merged answers from all stages
 * @param {number} patientId - Patient ID for risk factor lookup
 * @returns {number} Severity score clamped to [0, 10]
 */
function calcScore(answers, patientId) {
  let score = 0;

  // Pain level (0-10 scale, weight 25%)
  if (answers.q2_1 !== undefined) {
    score += (parseInt(answers.q2_1) / MAX_SCORE) * MAX_SCORE * 0.25;
  }

  // Duration scoring (weight 15%)
  const durationScores = { hours: 2, '1-2days': 4, '3-7days': 6, over_week: 8 };
  if (answers.q2_2 && durationScores[answers.q2_2]) {
    score += (durationScores[answers.q2_2] / MAX_SCORE) * MAX_SCORE * 0.15;
  }

  // Progression scoring (weight 20%)
  const progressionScores = { improving: 1, stable: 4, worsening: 7, rapid: 10 };
  if (answers.q2_3 && progressionScores[answers.q2_3]) {
    score += (progressionScores[answers.q2_3] / MAX_SCORE) * MAX_SCORE * 0.20;
  }

  // Primary symptom scoring (weight 15%)
  const symptomScores = { fever: 4, cough: 3, stomach: 5, headache: 4, skin: 3, body_pain: 3, weakness: 5, other: 4 };
  if (answers.q2_4 && symptomScores[answers.q2_4]) {
    score += (symptomScores[answers.q2_4] / MAX_SCORE) * MAX_SCORE * 0.15;
  }

  // Accompanying symptoms (weight 15%, takes max severity)
  if (Array.isArray(answers.q2_5)) {
    const accompanyingScores = { nausea: 2, fever: 3, dizziness: 3, swelling: 2, breathing: 4, none: 0 };
    let maxAccompanying = 0;
    answers.q2_5.forEach((v) => { maxAccompanying = Math.max(maxAccompanying, accompanyingScores[v] || 0); });
    score += (maxAccompanying / 4) * MAX_SCORE * 0.15;
  }

  // Pre-existing conditions (bonus modifiers)
  if (Array.isArray(answers.q2_6)) {
    if (answers.q2_6.includes('diabetes')) score += 0.5;
    if (answers.q2_6.includes('heart')) score += 1;
    if (answers.q2_6.includes('pregnant')) score *= 1.2;
  }

  // Context modifiers (Stage 3)
  if (answers.q2_3 === 'rapid') score += 1;
  if (answers.q3_1 === 'contact' || answers.q3_1 === 'both') score += 0.5;
  if (answers.q3_4 === 'emergency') score += 2;
  if (answers.q3_5 === 'child') score += 1.5;
  if (answers.q3_5 === 'senior') score += 1;

  return Math.min(MAX_SCORE, Math.max(0, score));
}

/**
 * Converts a numeric score to a severity label.
 * @param {number} score - Severity score (0-10)
 * @returns {string} Severity label: CRITICAL | URGENT | MODERATE | ROUTINE
 */
function getSeverity(score) {
  if (score >= SEVERITY_MAP.CRITICAL) return 'CRITICAL';
  if (score >= SEVERITY_MAP.URGENT) return 'URGENT';
  if (score >= SEVERITY_MAP.MODERATE) return 'MODERATE';
  return 'ROUTINE';
}

/**
 * Adds a patient to the doctor's priority queue.
 * Removes any existing waiting entry for the same patient to prevent duplicates.
 * Emits real-time queue update via Socket.IO.
 *
 * @param {number} patientId - Patient ID
 * @param {number} doctorId - Assigned doctor ID
 * @param {number} sessionId - Triage session ID
 * @param {number} score - Severity score
 * @param {string} severity - Severity label
 * @param {import('socket.io').Server} io - Socket.IO server instance
 * @returns {{ position: number, estimated_wait: number }} Queue position and ETA
 */
function addToQueue(patientId, doctorId, sessionId, score, severity, io) {
  // Remove existing entry to prevent duplicate queue positions
  db.delete('queue_entries', (e) => e.patient_id === patientId && e.status === 'waiting');

  const queue = db.findAll('queue_entries', (e) => e.doctor_id === doctorId && e.status === 'waiting')
    .sort((a, b) => b.score - a.score);

  // Find insertion position based on score (higher score = higher priority)
  let position = 1;
  for (const entry of queue) {
    if (score > entry.score) break;
    position++;
  }

  const estimatedWait = Math.max(5, position * 8);
  db.insert('queue_entries', {
    patient_id: patientId,
    doctor_id: doctorId,
    triage_session_id: sessionId,
    position,
    score,
    severity,
    status: 'waiting',
    estimated_wait: estimatedWait,
  });

  recalcPositions(doctorId);

  // Emit real-time update to connected clients
  if (io) {
    const updatedQueue = db.findAll('queue_entries', (e) => e.doctor_id === doctorId && e.status === 'waiting')
      .sort((a, b) => b.score - a.score);
    updatedQueue.forEach((e) => {
      const patient = db.findOne('patients', (p) => p.patient_id === e.patient_id);
      e.patient_name = patient?.name;
      e.abha_id = patient?.abha_id;
    });
    io.to(`queue-${doctorId}`).emit('queue-updated', updatedQueue);
  }

  return { position, estimated_wait: estimatedWait };
}

/**
 * Recalculates queue positions and estimated wait times after any queue change.
 * Sorts by severity score (descending) with FIFO tiebreaker.
 *
 * @param {number} doctorId - Doctor ID whose queue to recalculate
 */
function recalcPositions(doctorId) {
  const entries = db.findAll('queue_entries', (e) => e.doctor_id === doctorId && e.status === 'waiting')
    .sort((a, b) => b.score - a.score || new Date(a.created_at) - new Date(b.created_at));

  entries.forEach((entry, index) => {
    db.update('queue_entries', (x) => x.entry_id === entry.entry_id, {
      position: index + 1,
      estimated_wait: Math.max(5, (index + 1) * 8),
    });
  });
}

export default router;
