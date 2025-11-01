import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import admin from 'firebase-admin';

import authRoutes from './routes/auth.js';
import mocktestsRoutes from './routes/mocktests.js';
import routemapsRoutes from './routes/routemaps.js';

// Environment
const PORT = process.env.PORT || 4000;
const WEB_ORIGIN = process.env.WEB_ORIGIN || 'http://127.0.0.1:3002';

// Initialize Firebase Admin from env vars if provided
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey })
    });
  } else {
    // Attempt default credentials (e.g., GOOGLE_APPLICATION_CREDENTIALS)
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
}

const app = express();
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({ 
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    // or if origin matches allowed origins
    if (!origin || 
        origin.includes('127.0.0.1') || 
        origin.includes('localhost') || 
        origin === WEB_ORIGIN ||
        origin.startsWith('file://')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/mocktests', mocktestsRoutes);
app.use('/api/routemaps', routemapsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`API listening on http://127.0.0.1:${PORT}`);
});


