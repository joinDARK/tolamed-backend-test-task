import { Op, Transaction } from "sequelize";
import { BonusTransaction } from "../models/BonusTransaction";
import { sequelize } from "../db";

type AppError = Error & { status?: number };

function createAppError(message: string, status: number): AppError {
  const error = new Error(message) as AppError;
  error.status = status;
  return error;
}

export async function getUserBalance(
  userId: string,
  transaction: Transaction,
): Promise<number> {
  const now = new Date();

  const accruals = await BonusTransaction.findAll({
    where: {
      user_id: userId,
      type: "accrual",
      expires_at: { [Op.gte]: now },
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  const spends = await BonusTransaction.findAll({
    where: {
      user_id: userId,
      type: "spend",
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  const balance =
    accruals.reduce((sum, tx) => sum + tx.amount, 0) -
    spends.reduce((sum, tx) => sum + tx.amount, 0);

  // TODO: учитывать конкурентные списания
  return balance;
}

export async function spendBonus(
  userId: string,
  amount: number,
  request_id: string,
): Promise<boolean> {
  // Legacy-набросок: намеренно наивная реализация для задания.
  // Здесь специально нет транзакции, защиты от гонок и идемпотентности.
  const transaction = await sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
  });

  let isDuplicated: boolean = false;

  try {
    const existinTransaction = await BonusTransaction.findOne({
      where: {
        user_id: userId,
        request_id: request_id,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
      raw: true,
    });
    if (existinTransaction) {
      throw createAppError("duplicated transaction", 409);
    }

    const duplicatedTransaction = await BonusTransaction.findOne({
      where: {
        user_id: userId,
        amount: amount,
        request_id: {
          [Op.ne]: request_id,
        },
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
      raw: true,
    });
    if (duplicatedTransaction) {
      isDuplicated = true;
    }

    const balance = await getUserBalance(userId, transaction);

    if (balance < amount) {
      throw createAppError("Not enough bonus", 400);
    }

    await BonusTransaction.create(
      {
        user_id: userId,
        type: "spend",
        amount,
        expires_at: null,
        request_id: request_id,
      },
      { transaction },
    );

    await transaction.commit();
    return isDuplicated;
  } catch (e) {
    transaction.rollback();
    throw e;
  }
}
