import { Job, Queue, Worker } from "bullmq";

import { redis } from "./redis";
import { BonusTransaction } from "./models/BonusTransaction";
import { Op, UniqueConstraintError, fn } from "sequelize";

const queueConnection = redis.duplicate();

export const bonusQueue = new Queue("bonusQueue", {
  connection: queueConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
  },
});

let expireAccrualsWorker: Worker | null = null;

export function startExpireAccrualsWorker(): Worker {
  if (expireAccrualsWorker) {
    return expireAccrualsWorker;
  }

  expireAccrualsWorker = new Worker(
    "bonusQueue",
    async (job) => {
      if (job.name === "expireAccruals") {
        await expireAccruals(job);
      }
    },
    {
      connection: redis.duplicate(),
    },
  );

  expireAccrualsWorker.on("failed", (job, err) => {
    console.error(`[worker] failed, jobId=${job?.id}`, err);
  });

  return expireAccrualsWorker;
}

async function expireAccruals(job: Job) {
  console.log(`[worker] expireAccruals started, jobId=${job.id}`);

  const expiredTransactions = await BonusTransaction.findAll({
    where: {
      type: "accrual",
      expires_at: {
        [Op.lt]: fn("NOW"),
      },
    },
  });

  for (const expiredTransaction of expiredTransactions) {
    try {
      await BonusTransaction.create({
        type: "spend",
        user_id: expiredTransaction.user_id,
        amount: expiredTransaction.amount,
        request_id: `expire:${expiredTransaction.id}`,
      });
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        console.log(
          `[worker] Duplicate transaction skipped, requestId=expire:${expiredTransaction.id}, userId=${expiredTransaction.user_id}`,
        );
        continue;
      }
      throw error;
    }
  }

  console.log(`[worker] expireAccruals finished, jobId=${job.id}`);
}
