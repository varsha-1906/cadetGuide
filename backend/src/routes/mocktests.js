import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken.js';

const router = Router();

// All routes below are protected
router.use(verifyFirebaseToken);

// GET /api/mocktests - sample list
router.get('/', (_req, res) => {
  res.json({
    items: [
      { id: 'nda-1', title: 'NDA General Ability Test - Full Length', durationMin: 150 },
      { id: 'cds-1', title: 'CDS English - Full Length', durationMin: 120 },
      { id: 'afcat-1', title: 'AFCAT Mock Test - Mixed', durationMin: 120 }
    ]
  });
});

export default router;

