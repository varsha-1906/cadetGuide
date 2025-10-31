import { Router } from 'express';
import admin from 'firebase-admin';
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken.js';

const router = Router();

// POST /api/auth/session - verify token and return user profile
router.post('/session', verifyFirebaseToken, async (req, res) => {
  const { uid } = req.user;
  const userRecord = await admin.auth().getUser(uid).catch(() => null);
  res.json({ ok: true, user: { uid, email: req.user.email, name: req.user.name, picture: req.user.picture, disabled: userRecord?.disabled ?? false } });
});

// GET /api/auth/me - protected current user
router.get('/me', verifyFirebaseToken, (req, res) => {
  res.json({ uid: req.user.uid, email: req.user.email, name: req.user.name, picture: req.user.picture });
});

// POST /api/auth/logout - client should just drop token; provided for symmetry
router.post('/logout', (_req, res) => {
  // With Firebase client auth, logout is handled on the client. This is a no-op.
  res.json({ ok: true });
});

export default router;


