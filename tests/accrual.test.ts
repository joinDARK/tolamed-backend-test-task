import { sequelize } from "../src/db";
import { User } from "../src/models/User";
import { BonusTransaction } from "../src/models/BonusTransaction";
import app from "../src/app";
import request from "supertest";
import { Transaction } from "sequelize";
import { getUserBalance } from "../src/services/bonus.service";

describe("Бонусы пользователя", () => {
  let userId: string;
  let tsx: Transaction;
  let commited: boolean = false;

  beforeEach(async () => {
    // Создаем тестового пользователя
    const user = await User.create({
      name: "AccrualUser",
    });
    userId = user.id;

    // Создаем начисления на сумму 1000 и один expired accrual на 1000
    await BonusTransaction.bulkCreate([
      {
        user_id: userId,
        type: "accrual",
        amount: 1000,
        expires_at: new Date(Date.now() + 100000),
      },
      {
        user_id: userId,
        type: "accrual",
        amount: 1000,
        expires_at: new Date(Date.now() - 100000),
      },
    ]);
  });

  it("Истекшие бонусы не участвуют в расчете бонусов пользователя", async () => {
    tsx = await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });
    try {
      const balance = await getUserBalance(userId, tsx);

      await tsx.commit();
      commited = true;

      // Проверяем, что баланс пользователя равен 1000
      expect(balance).toBe(1000);
    } catch (e) {
      if (tsx && !commited) {
        tsx.rollback();
      }
      throw e;
    }
  });
});
