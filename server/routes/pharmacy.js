/**
 * @fileoverview Pharmacy management API routes.
 * Manages prescription queues, inventory tracking, dispensing workflow,
 * and pharmacy analytics.
 * @module routes/pharmacy
 */

import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();


router.get('/dashboard/:pharmacyId', (req, res) => {
  const pid = parseInt(req.params.pharmacyId);
  const pending = db.findAll('prescriptions', rx => rx.pharmacy_id === pid && rx.status === 'pending').sort((a,b) => new Date(b.created_at)-new Date(a.created_at));
  pending.forEach(rx => { rx.items = JSON.parse(rx.items||'[]'); const p = db.findOne('patients', p => p.patient_id === rx.patient_id); const d = db.findOne('doctors', d => d.doctor_id === rx.doctor_id); rx.patient_name = p?.name; rx.doctor_name = d?.name; });
  const dispensed = db.findAll('prescriptions', rx => rx.pharmacy_id === pid && rx.status === 'dispensed').sort((a,b) => new Date(b.created_at)-new Date(a.created_at)).slice(0,20);
  dispensed.forEach(rx => { rx.items = JSON.parse(rx.items||'[]'); const p = db.findOne('patients', p => p.patient_id === rx.patient_id); rx.patient_name = p?.name; });
  const inventory = db.findAll('pharmacy_inventory', i => i.pharmacy_id === pid).sort((a,b) => a.quantity - b.quantity);
  const lowStock = inventory.filter(i => i.quantity <= i.reorder_level);
  const outOfStock = inventory.filter(i => i.quantity === 0);
  const totalRx = db.count('prescriptions', rx => rx.pharmacy_id === pid);
  const dispensedCount = db.count('prescriptions', rx => rx.pharmacy_id === pid && rx.status === 'dispensed');
  const monthlyData = [{month:'Nov',prescriptions:145,fulfilled:138},{month:'Dec',prescriptions:162,fulfilled:155},{month:'Jan',prescriptions:178,fulfilled:170},{month:'Feb',prescriptions:155,fulfilled:149},{month:'Mar',prescriptions:190,fulfilled:182},{month:'Apr',prescriptions:48,fulfilled:dispensedCount}];
  const topMedicines = inventory.slice(0,10).map(i => ({name:i.medicine_name, dispensed:Math.floor(Math.random()*100+50), stock:i.quantity}));
  res.json({ stats: { totalPrescriptions:totalRx, pendingCount:pending.length, dispensedCount, fulfillmentRate:totalRx>0?Math.round((dispensedCount/totalRx)*100):0, lowStockCount:lowStock.length, outOfStockCount:outOfStock.length, inventoryItems:inventory.length }, pending, dispensed, inventory, lowStock, outOfStock, monthlyData, topMedicines });
});

router.post('/prescription', authMiddleware, (req, res) => {
  const { consultId, patientId, doctorId, pharmacyId, items, notes } = req.body;
  const r = db.insert('prescriptions', { consult_id:consultId, patient_id:patientId, doctor_id:doctorId, pharmacy_id:pharmacyId||1, items:JSON.stringify(items), notes, status:'pending' });
  const io = req.app.get('io');
  if (io) io.emit('new-prescription', { rxId: r.lastInsertRowid });
  res.json({ rxId: r.lastInsertRowid, status: 'pending', pharmacyId: pharmacyId||1 });
});

router.post('/dispense/:rxId', authMiddleware, (req, res) => {
  const rxId = parseInt(req.params.rxId);
  const rx = db.findOne('prescriptions', r => r.rx_id === rxId);
  if (!rx) return res.status(404).json({ error: 'Not found' });
  db.update('prescriptions', r => r.rx_id === rxId, { status: 'dispensed', dispensed_at: new Date().toISOString() });
  const items = JSON.parse(rx.items||'[]');
  items.forEach(item => {
    const inv = db.findOne('pharmacy_inventory', i => i.pharmacy_id === rx.pharmacy_id && i.medicine_name.includes(item.name?.split(' ')[0]));
    if (inv) db.update('pharmacy_inventory', i => i.item_id === inv.item_id, { quantity: Math.max(0, inv.quantity-1) });
  });
  const io = req.app.get('io'); if (io) io.emit('prescription-dispensed', { rxId });
  res.json({ success: true });
});

router.get('/stock/:medicine', (req, res) => {
  const m = req.params.medicine.toLowerCase();
  const results = db.findAll('pharmacy_inventory', i => i.medicine_name.toLowerCase().includes(m)||i.generic_name?.toLowerCase().includes(m));
  results.forEach(r => { const ph = db.findOne('pharmacies', p => p.pharmacy_id === r.pharmacy_id); const v = ph ? db.findOne('villages', v => v.village_id === ph.village_id) : null; r.pharmacy_name = ph?.name; r.lat = ph?.lat; r.lng = ph?.lng; r.village_name = v?.name; });
  res.json({ results });
});

router.get('/forecast/:pharmacyId', (req, res) => {
  const inv = db.findAll('pharmacy_inventory', i => i.pharmacy_id === parseInt(req.params.pharmacyId));
  const forecast = inv.map(i => { const du = Math.max(1, Math.floor(i.reorder_level/7)); const dr = Math.floor(i.quantity/du); const rd = new Date(); rd.setDate(rd.getDate()+Math.max(0,dr-7)); return { medicine:i.medicine_name, currentStock:i.quantity, dailyUsage:du, daysRemaining:dr, reorderLevel:i.reorder_level, recommendedOrder:Math.max(0,i.reorder_level*4-i.quantity), reorderDate:rd.toISOString().split('T')[0], status:i.quantity===0?'OUT_OF_STOCK':i.quantity<=i.reorder_level?'LOW':'OK' }; });
  res.json({ forecast, generatedAt: new Date().toISOString() });
});

export default router;
