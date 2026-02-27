import { NextFunction, Request, Response } from "express";

import { bonusQueue } from "../queue";
import { spendBonus } from "../services/bonus.service";

type AppError = Error & { status?: number };

function createAppError(message: string, status: number): AppError {
  const error = new Error(message) as AppError;
  error.status = status;
  return error;
}

export async function spendUserBonus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const amount = Number(req.body?.amount);

    // Получаем Idempotency-Key или requestId
    const request_id: string | undefined =
      req.header("Idempotency-Key") ?? req.body?.requestId;

    if (!request_id) {
      throw createAppError("request id not found", 400);
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      throw createAppError("amount must be a positive integer", 400);
    }

    const duplicated = await spendBonus(req.params.id, amount, request_id);

    res.json({ success: true, duplicated });
  } catch (error) {
    next(error);
  }
}

export async function enqueueExpireAccrualsJob(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await bonusQueue.add(
      "expireAccruals",
      {
        createdAt: new Date().toISOString(),
      },
      {
        jobId: "expire-accruals",
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      },
    );

    res.json({ queued: true });
  } catch (error) {
    next(error);
  }
}
