import admin from 'firebase-admin';

export async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) {
      return res.status(401).json({ error: 'Missing Bearer token' });
    }
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = decoded; // contains uid, email, name, picture, etc.
    next();
  } catch (err) {
    console.error('verifyFirebaseToken error', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}


