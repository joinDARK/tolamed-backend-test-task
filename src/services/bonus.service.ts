import { BonusTransaction } from '../models/BonusTransaction';

export async function getUserBalance(userId: string): Promise<number> {
  const accruals = await BonusTransaction.findAll({
    where: {
      user_id: userId,
      type: 'accrual',
    },
  });

  const balance = accruals.reduce((sum, tx) => sum + tx.amount, 0);

  // TODO: учитывать expires_at
  // TODO: учитывать spend
  // TODO: учитывать конкурентные списания
  return balance;
}

export async function spendBonus(
  userId: string,
  amount: number,
  requestId: string,
): Promise<void> {
  // TODO: выполнить списание в рамках транзакции
  // TODO: защититься от двойного списания по requestId (идемпотентность)
  // TODO: проверить текущий доступный баланс перед списанием
  void userId;
  void amount;
  void requestId;

  const error = new Error('Not implemented') as Error & { status: number };
  error.status = 501;
  throw error;
}
