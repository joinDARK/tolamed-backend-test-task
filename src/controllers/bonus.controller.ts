import { NextFunction, Request, Response } from 'express';

import { bonusQueue } from '../queue';

export async function enqueueExpireAccrualsJob(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await bonusQueue.add('expireAccruals', {
      createdAt: new Date().toISOString(),
    });

    res.json({ queued: true });
  } catch (error) {
    next(error);
  }
}
