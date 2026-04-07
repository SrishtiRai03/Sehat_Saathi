/**
 * @fileoverview In-memory data store for Sehat Saathi.
 * Provides a lightweight, SQLite-compatible API for CRUD operations.
 * Designed for demo/prototyping — replace with a persistent database in production.
 * @module db
 */

/**
 * In-memory data store that mimics SQLite operations.
 * Uses plain JavaScript arrays and objects for zero-dependency reliability.
 *
 * @class DataStore
 * @example
 * const db = new DataStore();
 * db.createTable('users');
 * db.insert('users', { name: 'John', role: 'patient' });
 * const user = db.findOne('users', (u) => u.name === 'John');
 */
class DataStore {
  constructor() {
    /** @type {Object.<string, Array>} Tables indexed by name */
    this.tables = {};
    /** @type {Object.<string, number>} Auto-increment counters per table */
    this.autoIncrements = {};
  }

  /**
   * Creates a new table if it does not already exist.
   * @param {string} name - Table name
   */
  createTable(name) {
    if (!this.tables[name]) {
      this.tables[name] = [];
      this.autoIncrements[name] = 1;
    }
  }

  /**
   * Inserts a record into the specified table with auto-generated primary key.
   * @param {string} table - Table name
   * @param {Object} record - Data to insert
   * @returns {{ lastInsertRowid: number }} Insert result with generated ID
   */
  insert(table, record) {
    const pk = this._getPk(table);
    record[pk] = this.autoIncrements[table]++;
    if (!record.created_at) record.created_at = new Date().toISOString();
    this.tables[table].push({ ...record });
    return { lastInsertRowid: record[pk] };
  }

  /**
   * Finds all records matching an optional filter.
   * Returns deep copies to prevent mutation of internal state.
   * @param {string} table - Table name
   * @param {Function|null} [filter=null] - Predicate function
   * @returns {Array<Object>} Matching records
   */
  findAll(table, filter = null) {
    let rows = this.tables[table] || [];
    if (filter) rows = rows.filter(filter);
    return rows.map((r) => ({ ...r }));
  }

  /**
   * Finds the first record matching the filter.
   * @param {string} table - Table name
   * @param {Function} filter - Predicate function
   * @returns {Object|null} Matching record or null
   */
  findOne(table, filter) {
    const rows = this.tables[table] || [];
    const found = rows.find(filter);
    return found ? { ...found } : null;
  }

  /**
   * Updates records matching the filter with the given values.
   * @param {string} table - Table name
   * @param {Function} filter - Predicate function
   * @param {Object} updates - Key-value pairs to update
   * @returns {{ changes: number }} Number of records updated
   */
  update(table, filter, updates) {
    const rows = this.tables[table] || [];
    let count = 0;
    rows.forEach((r, i) => {
      if (filter(r)) {
        Object.assign(rows[i], updates);
        count++;
      }
    });
    return { changes: count };
  }

  /**
   * Deletes records matching the filter.
   * @param {string} table - Table name
   * @param {Function} filter - Predicate function
   * @returns {{ changes: number }} Number of records deleted
   */
  delete(table, filter) {
    const before = (this.tables[table] || []).length;
    this.tables[table] = (this.tables[table] || []).filter((r) => !filter(r));
    return { changes: before - this.tables[table].length };
  }

  /**
   * Counts records matching an optional filter.
   * @param {string} table - Table name
   * @param {Function|null} [filter=null] - Predicate function
   * @returns {number} Record count
   */
  count(table, filter = null) {
    return this.findAll(table, filter).length;
  }

  /**
   * Returns the primary key column name for a given table.
   * @param {string} table - Table name
   * @returns {string} Primary key column name
   * @private
   */
  _getPk(table) {
    const pks = {
      villages: 'village_id',
      patients: 'patient_id',
      doctors: 'doctor_id',
      pharmacies: 'pharmacy_id',
      health_records: 'record_id',
      triage_sessions: 'session_id',
      queue_entries: 'entry_id',
      consultations: 'consult_id',
      prescriptions: 'rx_id',
      pharmacy_inventory: 'item_id',
      heatmap_data: 'point_id',
      appointments: 'appointment_id',
      users: 'user_id',
    };
    return pks[table] || 'id';
  }
}

const db = new DataStore();

// ============ SEED DATA ============

// VILLAGES
const villages = [
  { name:'Rampur Kalan', district:'Bhopal', state:'Madhya Pradesh', lat:23.2599, lng:77.4126, asha_worker_name:'Sunita Devi', asha_worker_phone:'9876543001', population:2400 },
  { name:'Shahpur', district:'Bhopal', state:'Madhya Pradesh', lat:23.2800, lng:77.3900, asha_worker_name:'Meera Bai', asha_worker_phone:'9876543002', population:1800 },
  { name:'Govindpura', district:'Bhopal', state:'Madhya Pradesh', lat:23.2450, lng:77.4500, asha_worker_name:'Lakshmi Yadav', asha_worker_phone:'9876543003', population:3200 },
  { name:'Kolar Road', district:'Bhopal', state:'Madhya Pradesh', lat:23.1800, lng:77.4200, asha_worker_name:'Anita Sharma', asha_worker_phone:'9876543004', population:5600 },
  { name:'Mandideep', district:'Raisen', state:'Madhya Pradesh', lat:23.0800, lng:77.5100, asha_worker_name:'Pushpa Singh', asha_worker_phone:'9876543005', population:4200 },
  { name:'Berasia', district:'Bhopal', state:'Madhya Pradesh', lat:23.6300, lng:77.4300, asha_worker_name:'Kamla Devi', asha_worker_phone:'9876543006', population:2800 },
  { name:'Ashta', district:'Sehore', state:'Madhya Pradesh', lat:23.0200, lng:76.7200, asha_worker_name:'Radha Kumari', asha_worker_phone:'9876543007', population:3500 },
  { name:'Nasrullaganj', district:'Sehore', state:'Madhya Pradesh', lat:22.9100, lng:77.0800, asha_worker_name:'Savitri Devi', asha_worker_phone:'9876543008', population:1900 },
  { name:'Sehore', district:'Sehore', state:'Madhya Pradesh', lat:23.2000, lng:77.0800, asha_worker_name:'Geeta Bai', asha_worker_phone:'9876543009', population:6200 },
  { name:'Vidisha', district:'Vidisha', state:'Madhya Pradesh', lat:23.5300, lng:77.8100, asha_worker_name:'Parvati Yadav', asha_worker_phone:'9876543010', population:7800 },
  { name:'Obedullaganj', district:'Raisen', state:'Madhya Pradesh', lat:23.4000, lng:77.5800, asha_worker_name:'Durga Devi', asha_worker_phone:'9876543011', population:3100 },
  { name:'Gairatganj', district:'Raisen', state:'Madhya Pradesh', lat:23.8200, lng:77.7400, asha_worker_name:'Indira Singh', asha_worker_phone:'9876543012', population:1500 },
];
db.createTable('villages');
villages.forEach(v => db.insert('villages', v));

// PATIENTS
db.createTable('patients');
const patientData = [
  { abha_id:'14-1234-5678-9012', name:'Rajesh Kumar', phone:'9876500001', dob:'1985-03-15', gender:'Male', blood_group:'B+', language_pref:'hi', village_id:1, risk_score:35 },
  { abha_id:'14-2345-6789-0123', name:'Priya Sharma', phone:'9876500002', dob:'1990-07-22', gender:'Female', blood_group:'O+', language_pref:'hi', village_id:1, risk_score:22 },
  { abha_id:'14-3456-7890-1234', name:'Mohan Lal', phone:'9876500003', dob:'1958-11-03', gender:'Male', blood_group:'A+', language_pref:'hi', village_id:2, risk_score:72 },
  { abha_id:'14-4567-8901-2345', name:'Sunita Devi', phone:'9876500004', dob:'1975-01-18', gender:'Female', blood_group:'AB+', language_pref:'hi', village_id:3, risk_score:48 },
  { abha_id:'14-5678-9012-3456', name:'Amit Patel', phone:'9876500005', dob:'2001-09-30', gender:'Male', blood_group:'O-', language_pref:'hi', village_id:4, risk_score:15 },
  { abha_id:'14-6789-0123-4567', name:'Kavita Singh', phone:'9876500006', dob:'1968-05-12', gender:'Female', blood_group:'B-', language_pref:'hi', village_id:5, risk_score:65 },
  { abha_id:'14-7890-1234-5678', name:'Ramesh Yadav', phone:'9876500007', dob:'1982-12-25', gender:'Male', blood_group:'A-', language_pref:'hi', village_id:2, risk_score:40 },
  { abha_id:'14-8901-2345-6789', name:'Geeta Bai', phone:'9876500008', dob:'1955-08-07', gender:'Female', blood_group:'O+', language_pref:'hi', village_id:6, risk_score:78 },
  { abha_id:'14-9012-3456-7890', name:'Vikram Malhotra', phone:'9876500009', dob:'1995-04-20', gender:'Male', blood_group:'B+', language_pref:'hi', village_id:3, risk_score:18 },
  { abha_id:'14-0123-4567-8901', name:'Asha Kumari', phone:'9876500010', dob:'1988-06-14', gender:'Female', blood_group:'A+', language_pref:'hi', village_id:7, risk_score:30 },
];
patientData.forEach(p => db.insert('patients', p));

// DOCTORS
db.createTable('doctors');
[
  { name:'Dr. Anil Verma', phone:'9876500101', specialisation:'General Medicine', languages:'["Hindi","English"]', phc_name:'PHC Rampur Kalan' },
  { name:'Dr. Shalini Gupta', phone:'9876500102', specialisation:'Obstetrics & Gynaecology', languages:'["Hindi","English","Marathi"]', phc_name:'PHC Shahpur' },
  { name:'Dr. Rakesh Joshi', phone:'9876500103', specialisation:'Paediatrics', languages:'["Hindi","English"]', phc_name:'PHC Govindpura' },
].forEach(d => db.insert('doctors', d));

// PHARMACIES
db.createTable('pharmacies');
[
  { name:'Jan Aushadhi Kendra - Rampur', village_id:1, lat:23.2605, lng:77.4130, owner_name:'Suresh Gupta', owner_phone:'9876500201', verified:1 },
  { name:'PHC Pharmacy - Shahpur', village_id:2, lat:23.2810, lng:77.3910, owner_name:'Rakesh Verma', owner_phone:'9876500202', verified:1 },
  { name:'Govindpura Medical Store', village_id:3, lat:23.2460, lng:77.4510, owner_name:'Manoj Kumar', owner_phone:'9876500203', verified:1 },
].forEach(p => db.insert('pharmacies', p));

// HEALTH RECORDS
db.createTable('health_records');
[
  { patient_id:1, vitals:JSON.stringify({bp:'130/85',spo2:97,weight:72,bmi:24.5,temp:98.4}), allergies:JSON.stringify(['Penicillin']), chronic_conditions:JSON.stringify(['Hypertension']), medications:JSON.stringify([{name:'Amlodipine',dose:'5mg',freq:'Once daily'}]), vaccinations:JSON.stringify([{name:'COVID-19',date:'2024-01-15',batch:'COVX1234'},{name:'Tetanus',date:'2023-06-10',batch:'TET5678'}]), lab_results:JSON.stringify([{test:'HbA1c',value:'5.8%',date:'2025-12-01'},{test:'Blood Sugar (Fasting)',value:'110 mg/dL',date:'2025-12-01'}]) },
  { patient_id:2, vitals:JSON.stringify({bp:'118/76',spo2:99,weight:58,bmi:22.1,temp:98.6}), allergies:JSON.stringify([]), chronic_conditions:JSON.stringify([]), medications:JSON.stringify([]), vaccinations:JSON.stringify([{name:'COVID-19',date:'2024-02-20',batch:'COVX5678'}]), lab_results:JSON.stringify([{test:'Hemoglobin',value:'12.5 g/dL',date:'2025-11-15'}]) },
  { patient_id:3, vitals:JSON.stringify({bp:'155/95',spo2:94,weight:80,bmi:28.3,temp:99.1}), allergies:JSON.stringify(['Sulfa drugs','Aspirin']), chronic_conditions:JSON.stringify(['Diabetes Type 2','Hypertension','COPD']), medications:JSON.stringify([{name:'Metformin',dose:'500mg',freq:'Twice daily'},{name:'Losartan',dose:'50mg',freq:'Once daily'},{name:'Salbutamol Inhaler',dose:'2 puffs',freq:'As needed'}]), vaccinations:JSON.stringify([{name:'COVID-19',date:'2024-01-10',batch:'COVX9012'},{name:'Influenza',date:'2024-10-05',batch:'FLU3456'}]), lab_results:JSON.stringify([{test:'HbA1c',value:'7.8%',date:'2025-12-10'},{test:'Blood Sugar (Fasting)',value:'165 mg/dL',date:'2025-12-10'},{test:'Creatinine',value:'1.4 mg/dL',date:'2025-11-20'}]) },
  { patient_id:4, vitals:JSON.stringify({bp:'140/90',spo2:96,weight:65,bmi:26.0,temp:98.8}), allergies:JSON.stringify(['Ibuprofen']), chronic_conditions:JSON.stringify(['Hypertension']), medications:JSON.stringify([{name:'Enalapril',dose:'10mg',freq:'Once daily'}]), vaccinations:JSON.stringify([{name:'COVID-19',date:'2024-03-01',batch:'COVX3456'}]), lab_results:JSON.stringify([{test:'Hemoglobin',value:'11.2 g/dL',date:'2025-10-20'}]) },
  { patient_id:5, vitals:JSON.stringify({bp:'120/78',spo2:99,weight:68,bmi:22.8,temp:98.4}), allergies:JSON.stringify([]), chronic_conditions:JSON.stringify([]), medications:JSON.stringify([]), vaccinations:JSON.stringify([{name:'COVID-19',date:'2024-04-15',batch:'COVX7890'}]), lab_results:JSON.stringify([{test:'Hemoglobin',value:'14.8 g/dL',date:'2025-09-10'}]) },
].forEach(r => db.insert('health_records', r));

// USERS
db.createTable('users');
[
  { phone:'9876500001', role:'patient', ref_id:1 },
  { phone:'9876500002', role:'patient', ref_id:2 },
  { phone:'9876500003', role:'patient', ref_id:3 },
  { phone:'9876500101', role:'doctor', ref_id:1 },
  { phone:'9876500102', role:'doctor', ref_id:2 },
  { phone:'9876500201', role:'pharmacist', ref_id:1 },
].forEach(u => db.insert('users', u));

// PHARMACY INVENTORY
db.createTable('pharmacy_inventory');
[
  {pharmacy_id:1,medicine_name:'Paracetamol 500mg',medicine_code:'PAR500',generic_name:'Paracetamol',quantity:500,reorder_level:50,unit_price:2.5,expiry_date:'2027-06-30'},
  {pharmacy_id:1,medicine_name:'Amoxicillin 250mg',medicine_code:'AMX250',generic_name:'Amoxicillin',quantity:200,reorder_level:30,unit_price:8.0,expiry_date:'2027-03-15'},
  {pharmacy_id:1,medicine_name:'Metformin 500mg',medicine_code:'MET500',generic_name:'Metformin',quantity:350,reorder_level:40,unit_price:4.5,expiry_date:'2027-09-20'},
  {pharmacy_id:1,medicine_name:'Amlodipine 5mg',medicine_code:'AML005',generic_name:'Amlodipine',quantity:180,reorder_level:25,unit_price:6.0,expiry_date:'2027-12-10'},
  {pharmacy_id:1,medicine_name:'ORS Packets',medicine_code:'ORS001',generic_name:'Oral Rehydration Salts',quantity:800,reorder_level:100,unit_price:3.0,expiry_date:'2027-08-01'},
  {pharmacy_id:1,medicine_name:'Cetirizine 10mg',medicine_code:'CET010',generic_name:'Cetirizine',quantity:300,reorder_level:40,unit_price:2.0,expiry_date:'2027-05-15'},
  {pharmacy_id:1,medicine_name:'Azithromycin 500mg',medicine_code:'AZI500',generic_name:'Azithromycin',quantity:120,reorder_level:20,unit_price:15.0,expiry_date:'2027-04-20'},
  {pharmacy_id:1,medicine_name:'Omeprazole 20mg',medicine_code:'OMP020',generic_name:'Omeprazole',quantity:250,reorder_level:30,unit_price:5.0,expiry_date:'2027-07-10'},
  {pharmacy_id:1,medicine_name:'Ibuprofen 400mg',medicine_code:'IBU400',generic_name:'Ibuprofen',quantity:400,reorder_level:50,unit_price:3.5,expiry_date:'2027-11-30'},
  {pharmacy_id:1,medicine_name:'Losartan 50mg',medicine_code:'LOS050',generic_name:'Losartan',quantity:150,reorder_level:20,unit_price:7.5,expiry_date:'2027-10-25'},
  {pharmacy_id:1,medicine_name:'Salbutamol Inhaler',medicine_code:'SAL100',generic_name:'Salbutamol',quantity:45,reorder_level:10,unit_price:85.0,expiry_date:'2027-02-28'},
  {pharmacy_id:1,medicine_name:'Iron + Folic Acid',medicine_code:'IFA001',generic_name:'Ferrous Sulphate + Folic Acid',quantity:600,reorder_level:80,unit_price:1.5,expiry_date:'2027-06-15'},
  {pharmacy_id:2,medicine_name:'Paracetamol 500mg',medicine_code:'PAR500',generic_name:'Paracetamol',quantity:350,reorder_level:50,unit_price:2.5,expiry_date:'2027-06-30'},
  {pharmacy_id:2,medicine_name:'Amoxicillin 250mg',medicine_code:'AMX250',generic_name:'Amoxicillin',quantity:80,reorder_level:30,unit_price:8.0,expiry_date:'2027-03-15'},
  {pharmacy_id:2,medicine_name:'Metformin 500mg',medicine_code:'MET500',generic_name:'Metformin',quantity:5,reorder_level:40,unit_price:4.5,expiry_date:'2027-09-20'},
  {pharmacy_id:2,medicine_name:'ORS Packets',medicine_code:'ORS001',generic_name:'Oral Rehydration Salts',quantity:450,reorder_level:100,unit_price:3.0,expiry_date:'2027-08-01'},
  {pharmacy_id:3,medicine_name:'Paracetamol 500mg',medicine_code:'PAR500',generic_name:'Paracetamol',quantity:600,reorder_level:50,unit_price:2.5,expiry_date:'2027-06-30'},
  {pharmacy_id:3,medicine_name:'Azithromycin 500mg',medicine_code:'AZI500',generic_name:'Azithromycin',quantity:0,reorder_level:20,unit_price:15.0,expiry_date:'2027-04-20'},
  {pharmacy_id:3,medicine_name:'Omeprazole 20mg',medicine_code:'OMP020',generic_name:'Omeprazole',quantity:180,reorder_level:30,unit_price:5.0,expiry_date:'2027-07-10'},
].forEach(i => db.insert('pharmacy_inventory', i));

// HEATMAP DATA
db.createTable('heatmap_data');
[
  {village_id:1,symptom_type:'Fever',case_count:12,severity_level:'YELLOW',week_start:'2026-03-30'},
  {village_id:1,symptom_type:'Respiratory',case_count:5,severity_level:'GREEN',week_start:'2026-03-30'},
  {village_id:1,symptom_type:'Diarrhoea',case_count:3,severity_level:'GREEN',week_start:'2026-03-30'},
  {village_id:2,symptom_type:'Fever',case_count:25,severity_level:'RED',week_start:'2026-03-30'},
  {village_id:2,symptom_type:'Respiratory',case_count:18,severity_level:'RED',week_start:'2026-03-30'},
  {village_id:2,symptom_type:'Skin Infections',case_count:4,severity_level:'GREEN',week_start:'2026-03-30'},
  {village_id:3,symptom_type:'Fever',case_count:8,severity_level:'YELLOW',week_start:'2026-03-30'},
  {village_id:3,symptom_type:'Diarrhoea',case_count:15,severity_level:'RED',week_start:'2026-03-30'},
  {village_id:3,symptom_type:'Vector-borne',case_count:7,severity_level:'YELLOW',week_start:'2026-03-30'},
  {village_id:4,symptom_type:'Fever',case_count:3,severity_level:'GREEN',week_start:'2026-03-30'},
  {village_id:4,symptom_type:'Respiratory',case_count:2,severity_level:'GREEN',week_start:'2026-03-30'},
  {village_id:5,symptom_type:'Fever',case_count:6,severity_level:'GREEN',week_start:'2026-03-30'},
  {village_id:5,symptom_type:'Diarrhoea',case_count:9,severity_level:'YELLOW',week_start:'2026-03-30'},
  {village_id:5,symptom_type:'Skin Infections',case_count:11,severity_level:'YELLOW',week_start:'2026-03-30'},
  {village_id:6,symptom_type:'Fever',case_count:4,severity_level:'GREEN',week_start:'2026-03-30'},
  {village_id:6,symptom_type:'Respiratory',case_count:7,severity_level:'YELLOW',week_start:'2026-03-30'},
  {village_id:7,symptom_type:'Fever',case_count:20,severity_level:'RED',week_start:'2026-03-30'},
  {village_id:7,symptom_type:'Vector-borne',case_count:14,severity_level:'RED',week_start:'2026-03-30'},
  {village_id:7,symptom_type:'Diarrhoea',case_count:6,severity_level:'GREEN',week_start:'2026-03-30'},
  {village_id:8,symptom_type:'Fever',case_count:2,severity_level:'GREEN',week_start:'2026-03-30'},
  {village_id:9,symptom_type:'Fever',case_count:10,severity_level:'YELLOW',week_start:'2026-03-30'},
  {village_id:9,symptom_type:'Respiratory',case_count:8,severity_level:'YELLOW',week_start:'2026-03-30'},
  {village_id:10,symptom_type:'Fever',case_count:5,severity_level:'GREEN',week_start:'2026-03-30'},
  {village_id:10,symptom_type:'Vector-borne',case_count:3,severity_level:'GREEN',week_start:'2026-03-30'},
  {village_id:11,symptom_type:'Fever',case_count:7,severity_level:'YELLOW',week_start:'2026-03-30'},
  {village_id:11,symptom_type:'Respiratory',case_count:12,severity_level:'YELLOW',week_start:'2026-03-30'},
  {village_id:12,symptom_type:'Fever',case_count:1,severity_level:'GREEN',week_start:'2026-03-30'},
].forEach(h => db.insert('heatmap_data', h));

// QUEUE ENTRIES
db.createTable('queue_entries');
[
  {patient_id:3,doctor_id:1,triage_session_id:null,position:1,score:8.5,severity:'CRITICAL',status:'waiting',estimated_wait:5},
  {patient_id:4,doctor_id:1,triage_session_id:null,position:2,score:6.2,severity:'URGENT',status:'waiting',estimated_wait:15},
  {patient_id:1,doctor_id:1,triage_session_id:null,position:3,score:4.0,severity:'MODERATE',status:'waiting',estimated_wait:30},
  {patient_id:5,doctor_id:1,triage_session_id:null,position:4,score:2.0,severity:'ROUTINE',status:'waiting',estimated_wait:45},
].forEach(q => db.insert('queue_entries', q));

// TRIAGE SESSIONS
db.createTable('triage_sessions');

// CONSULTATIONS
db.createTable('consultations');

// PRESCRIPTIONS
db.createTable('prescriptions');
[
  {consult_id:null,patient_id:1,doctor_id:1,pharmacy_id:1,items:JSON.stringify([{name:'Paracetamol 500mg',dose:'1 tablet',freq:'Three times daily',duration:'5 days',instructions:'After food'},{name:'Cetirizine 10mg',dose:'1 tablet',freq:'Once at night',duration:'5 days',instructions:'Before sleep'}]),status:'pending',created_at:'2026-04-06T10:30:00'},
  {consult_id:null,patient_id:2,doctor_id:1,pharmacy_id:1,items:JSON.stringify([{name:'Iron + Folic Acid',dose:'1 tablet',freq:'Once daily',duration:'30 days',instructions:'With orange juice'}]),status:'dispensed',dispensed_at:'2026-04-05T15:00:00',created_at:'2026-04-05T14:00:00'},
  {consult_id:null,patient_id:3,doctor_id:1,pharmacy_id:1,items:JSON.stringify([{name:'Metformin 500mg',dose:'1 tablet',freq:'Twice daily',duration:'30 days',instructions:'With meals'},{name:'Losartan 50mg',dose:'1 tablet',freq:'Once daily',duration:'30 days',instructions:'Morning'}]),status:'pending',created_at:'2026-04-06T11:00:00'},
].forEach(rx => db.insert('prescriptions', rx));

// APPOINTMENTS
db.createTable('appointments');

console.log('✅ In-memory database initialized with seed data');

export default db;
