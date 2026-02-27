import app from "../src/app";
import request from "supertest";
import { User } from "../src/models/User";
import { BonusTransaction } from "../src/models/BonusTransaction";

describe("POST /users/:id/spend — конкурентность", () => {
  let userId: string;

  beforeEach(async () => {
    // Создаем тестового пользователя
    const user = await User.create({
      name: "ConcurrencyUser",
    });
    userId = user.id;

    // Создаем начисления на сумму 1000
    await BonusTransaction.bulkCreate([
      {
        user_id: userId,
        type: "accrual",
        amount: 500,
        expires_at: new Date(Date.now() + 100000),
      },
      {
        user_id: userId,
        type: "accrual",
        amount: 500,
        expires_at: new Date(Date.now() + 100000),
      },
    ]);
  });

  it("Конкурентные списания не приводят к отрицательному балансу", async () => {
    const requestCount = 10;
    const spendAmountPerRequest = 200;
    const initialBalance = 1000;

    const promises = Array.from({ length: requestCount }).map((_, index) => {
      return request(app)
        .post(`/users/${userId}/spend`)
        .set("Idempotency-Key", `concurrent-req-${index}`)
        .send({
          amount: spendAmountPerRequest,
          requestId: `concurrent-req-${index}`,
        });
    });

    const responses = await Promise.all(promises);

    const failedResponses = responses.filter((r) => r.status === 400);
    expect(failedResponses.length).toBeGreaterThan(0);

    const totalSpentInDb = await BonusTransaction.sum("amount", {
      where: { user_id: userId, type: "spend" },
    });

    // Сумма списаний в БД не должна превышать исходный баланс (1000)
    expect(totalSpentInDb).toBeLessThanOrEqual(initialBalance);
  });
});
