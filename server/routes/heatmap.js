/**
 * @fileoverview Heatmap API routes.
 * Provides village-level disease surveillance data and health alerts
 * for the interactive map visualisation.
 * @module routes/heatmap
 */

import { Router } from 'express';
import db from '../db.js';

const router = Router();

/** @constant {string} CURRENT_WEEK - Week start date for current data */
const CURRENT_WEEK = '2026-03-30';

/** @constant {string[]} SEVERITY_ORDER - Severity levels in ascending order */
const SEVERITY_ORDER = ['GREEN', 'YELLOW', 'RED'];

/**
 * GET /api/heatmap/data
 * Returns aggregated disease data grouped by village.
 * Supports optional query filters:
 * - `symptom` — Filter by symptom type (e.g., "Fever", "Respiratory")
 * - `weekStart` — Epidemiological week start date (default: current week)
 *
 * @returns {Object} { villages: VillageData[], raw: RawData[], symptomTypes: string[] }
 */
router.get('/data', (req, res) => {
  const { symptom, weekStart } = req.query;
  const targetWeek = weekStart || CURRENT_WEEK;

  // Fetch raw heatmap data for the target week
  let data = db.findAll('heatmap_data', (h) => h.week_start === targetWeek);
  if (symptom && symptom !== 'all') {
    data = data.filter((d) => d.symptom_type === symptom);
  }

  // Enrich with village metadata
  data.forEach((d) => {
    const village = db.findOne('villages', (v) => v.village_id === d.village_id);
    d.village_name = village?.name;
    d.lat = village?.lat;
    d.lng = village?.lng;
    d.district = village?.district;
    d.population = village?.population;
  });
  data.sort((a, b) => b.case_count - a.case_count);

  // Aggregate by village
  const byVillage = {};
  data.forEach((d) => {
    if (!byVillage[d.village_id]) {
      byVillage[d.village_id] = {
        village_id: d.village_id,
        name: d.village_name,
        lat: d.lat,
        lng: d.lng,
        district: d.district,
        population: d.population,
        symptoms: [],
        totalCases: 0,
        maxSeverity: 'GREEN',
      };
    }

    const village = byVillage[d.village_id];
    village.symptoms.push({ type: d.symptom_type, count: d.case_count, severity: d.severity_level });
    village.totalCases += d.case_count;

    // Track highest severity
    if (SEVERITY_ORDER.indexOf(d.severity_level) > SEVERITY_ORDER.indexOf(village.maxSeverity)) {
      village.maxSeverity = d.severity_level;
    }
  });

  const symptomTypes = [...new Set(data.map((d) => d.symptom_type))];

  res.json({
    villages: Object.values(byVillage),
    raw: data,
    symptomTypes,
  });
});

/**
 * GET /api/heatmap/alerts
 * Returns active health alerts sorted by severity (RED first).
 * Alerts are generated from heatmap data exceeding threshold levels.
 *
 * @returns {Object} { alerts: Alert[], redCount: number, yellowCount: number }
 */
router.get('/alerts', (_req, res) => {
  const redZones = db.findAll('heatmap_data', (h) => h.severity_level === 'RED' && h.week_start === CURRENT_WEEK);
  const yellowZones = db.findAll('heatmap_data', (h) => h.severity_level === 'YELLOW' && h.week_start === CURRENT_WEEK);

  const alerts = [];

  redZones.forEach((zone) => {
    const village = db.findOne('villages', (v) => v.village_id === zone.village_id);
    alerts.push({
      level: 'RED',
      type: 'Outbreak Alert',
      village: village?.name,
      district: village?.district,
      symptom: zone.symptom_type,
      cases: zone.case_count,
      message: `${zone.case_count} ${zone.symptom_type} cases in ${village?.name} — DHO notification triggered`,
    });
  });

  yellowZones.forEach((zone) => {
    const village = db.findOne('villages', (v) => v.village_id === zone.village_id);
    alerts.push({
      level: 'YELLOW',
      type: 'Early Warning',
      village: village?.name,
      district: village?.district,
      symptom: zone.symptom_type,
      cases: zone.case_count,
      message: `Rising ${zone.symptom_type} cases (${zone.case_count}) in ${village?.name}`,
    });
  });

  res.json({
    alerts,
    redCount: redZones.length,
    yellowCount: yellowZones.length,
  });
});

export default router;
