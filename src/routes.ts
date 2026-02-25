import { Router } from 'express';

import { enqueueExpireAccrualsJob } from './controllers/bonus.controller';
import {
  getUserBonusTransactions,
  getUserById,
} from './controllers/user.controller';

export const router = Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true });
});

router.get('/users/:id', getUserById);
router.get('/users/:id/bonus-transactions', getUserBonusTransactions);
router.post('/jobs/expire-accruals', enqueueExpireAccrualsJob);
