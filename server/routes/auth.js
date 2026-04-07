/**
 * @fileoverview Authentication API routes.
 * Handles OTP-based login, demo login, and session management.
 * @module routes/auth
 */

import { Router } from 'express';
import db from '../db.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';
import { validateBody, sanitize, asyncHandler } from '../middleware/utils.js';

const router = Router();

/** @constant {string} DEMO_OTP - Static OTP for demo/testing purposes */
const DEMO_OTP = '123456';

/** @constant {number} OTP_EXPIRY_MS - OTP validity duration in milliseconds (5 minutes) */
const OTP_EXPIRY_MS = 5 * 60 * 1000;

/**
 * Resolves the user profile based on their role.
 * @param {Object} user - User record from the database
 * @returns {Object|null} Profile data for the user's role
 */
function resolveProfile(user) {
  if (!user) return null;
  switch (user.role) {
    case 'patient':
      return db.findOne('patients', (p) => p.patient_id === user.ref_id);
    case 'doctor':
      return db.findOne('doctors', (d) => d.doctor_id === user.ref_id);
    case 'pharmacist':
      return db.findOne('pharmacies', (p) => p.pharmacy_id === user.ref_id);
    default:
      return null;
  }
}

/**
 * Builds a standardised auth response payload.
 * @param {Object} user - User record
 * @param {string} token - JWT token
 * @returns {Object} Response payload
 */
function buildAuthResponse(user, token) {
  return {
    success: true,
    token,
    user: {
      userId: user.user_id,
      phone: user.phone,
      role: user.role,
      refId: user.ref_id,
      profile: resolveProfile(user),
    },
  };
}

/**
 * POST /api/auth/send-otp
 * Sends an OTP to the given phone number.
 * In production, this would integrate with an SMS gateway (e.g., Twilio).
 */
router.post(
  '/send-otp',
  validateBody({ phone: { type: 'string', required: true, minLength: 10 } }),
  asyncHandler(async (req, res) => {
    const phone = sanitize(req.body.phone);

    const user = db.findOne('users', (u) => u.phone === phone);
    if (!user) {
      return res.status(404).json({ error: 'User not found. Please register first.' });
    }

    // Store OTP with expiry (demo: always 123456)
    db.update('users', (u) => u.phone === phone, {
      otp: DEMO_OTP,
      otp_expires: new Date(Date.now() + OTP_EXPIRY_MS).toISOString(),
    });

    res.json({ success: true, message: 'OTP sent successfully', demo_otp: DEMO_OTP });
  }),
);

/**
 * POST /api/auth/verify-otp
 * Verifies OTP and returns a JWT token on success.
 */
router.post(
  '/verify-otp',
  validateBody({
    phone: { type: 'string', required: true, minLength: 10 },
    otp: { type: 'string', required: true, minLength: 6 },
  }),
  asyncHandler(async (req, res) => {
    const phone = sanitize(req.body.phone);
    const otp = sanitize(req.body.otp);

    const user = db.findOne('users', (u) => u.phone === phone);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate OTP
    if (otp !== DEMO_OTP && otp !== user.otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    const token = generateToken({
      userId: user.user_id,
      phone: user.phone,
      role: user.role,
      refId: user.ref_id,
    });

    // Clear OTP after successful verification
    db.update('users', (u) => u.user_id === user.user_id, { token, otp: null });

    res.json(buildAuthResponse(user, token));
  }),
);

/**
 * POST /api/auth/demo-login
 * Instant login with a demo account for the given role.
 * Available roles: patient, doctor, pharmacist.
 */
router.post(
  '/demo-login',
  validateBody({ role: { type: 'string', required: true } }),
  asyncHandler(async (req, res) => {
    const role = sanitize(req.body.role);
    const validRoles = ['patient', 'doctor', 'pharmacist'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    const user = db.findOne('users', (u) => u.role === role);
    if (!user) {
      return res.status(404).json({ error: `No demo user found for role: ${role}` });
    }

    const token = generateToken({
      userId: user.user_id,
      phone: user.phone,
      role: user.role,
      refId: user.ref_id,
    });

    db.update('users', (u) => u.user_id === user.user_id, { token });

    res.json(buildAuthResponse(user, token));
  }),
);

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile.
 * Requires valid JWT in Authorization header.
 */
router.get(
  '/me',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = db.findOne('users', (u) => u.user_id === req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      userId: user.user_id,
      phone: user.phone,
      role: user.role,
      refId: user.ref_id,
      profile: resolveProfile(user),
    });
  }),
);

export default router;
