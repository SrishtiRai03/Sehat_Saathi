/**
 * @fileoverview Dashboard statistics API.
 * Returns aggregate counts for the dashboard summary widgets.
 * @module routes/stats
 */

import { Router } from 'express';
import db from '../db.js';

const router = Router();

/** @constant {string} CURRENT_WEEK - Current week for heatmap alerts lookup */
const CURRENT_WEEK = '2026-03-30';

/**
 * GET /api/stats
 * Returns aggregate statistics for dashboard display.
 * Includes patient count, doctor count, queue status, and alert counts.
 */
router.get('/', (_req, res) => {
  res.json({
    patients: db.count('patients'),
    doctors: db.count('doctors'),
    queueWaiting: db.count('queue_entries', (e) => e.status === 'waiting'),
    consultationsToday: db.count('consultations'),
    rxPending: db.count('prescriptions', (rx) => rx.status === 'pending'),
    rxDispensed: db.count('prescriptions', (rx) => rx.status === 'dispensed'),
    redAlerts: db.count('heatmap_data', (h) => h.severity_level === 'RED' && h.week_start === CURRENT_WEEK),
  });
});

export default router;
