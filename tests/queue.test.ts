import { BonusTransaction } from "../src/models/BonusTransaction";
import { User } from "../src/models/User";
import app from "../src/app";
import request from "supertest";

describe("проверка работа очериди BullMQ", () => {
  it("повторная обработка/повторная постановка задачи не создает дубли бизнес-эффектов.", async () => {
    const amount = 1000;
    const now = new Date();

    const testUser = await User.create({
      name: "QueueUser",
    });

    const expiredTransaction1 = await BonusTransaction.create({
      type: "accrual",
      amount: amount,
      user_id: testUser.id,
      expires_at: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    });

    const expiredTransaction2 = await BonusTransaction.create({
      type: "accrual",
      amount: amount,
      user_id: testUser.id,
      expires_at: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    });

    const expiredTransaction3 = await BonusTransaction.create({
      type: "accrual",
      amount: amount,
      user_id: testUser.id,
      expires_at: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    });

    const response1 = await request(app)
      .post("/jobs/expire-accruals")
      .expect(200);

    expect(response1.body).toEqual({
      queued: true,
    });

    // Ждем когда очередь отработает задачи
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Выполняем повторную постановку и обработку задачи
    const response2 = await request(app)
      .post("/jobs/expire-accruals")
      .expect(200);

    expect(response2.body).toEqual({
      queued: true,
    });

    // Проверяем, что всего в бд храниться 1 списание, но не более
    const allExpiredTransaction1 = await BonusTransaction.findAll({
      where: {
        type: "spend",
        request_id: `expire:${expiredTransaction1.id}`,
      },
    });
    expect(allExpiredTransaction1.length).toBe(1);

    // Проверяем, что всего в бд храниться 1 списание, но не более
    const allExpiredTransaction2 = await BonusTransaction.findAll({
      where: {
        type: "spend",
        request_id: `expire:${expiredTransaction2.id}`,
      },
    });
    expect(allExpiredTransaction2.length).toBe(1);

    // Проверяем, что всего в бд храниться 1 списание, но не более
    const allExpiredTransaction3 = await BonusTransaction.findAll({
      where: {
        type: "spend",
        request_id: `expire:${expiredTransaction3.id}`,
      },
    });
    expect(allExpiredTransaction3.length).toBe(1);
  });
});
