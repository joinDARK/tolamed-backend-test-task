import app from "../src/app";
import request from "supertest";
import { User } from "../src/models/User";
import { BonusTransaction } from "../src/models/BonusTransaction";

describe("POST /users/:id/spend — идемпотентность", () => {
  let userId: string;

  beforeEach(async () => {
    // Создаем тестового пользователя
    const user = await User.create({
      name: "IdempotencyUser",
    });
    userId = user.id;

    await BonusTransaction.create({
      user_id: userId,
      type: "accrual",
      amount: 2000,
      expires_at: new Date(Date.now() + 100000),
    });
  });

  it("не создаёт дубль списания при повторном запросе с тем же requestId", async () => {
    const requestId = "unique-request-123";
    const spendAmount = 100;

    const response1 = await request(app)
      .post(`/users/${userId}/spend`)
      .set("Idempotency-Key", requestId)
      .send({ amount: spendAmount, requestId: requestId })
      .expect(200);

    expect(response1.body).toEqual({ success: true, duplicated: false });

    const newRequestId = "12345";

    const response2 = await request(app)
      .post(`/users/${userId}/spend`)
      .set("Idempotency-Key", newRequestId)
      .send({ amount: spendAmount, requestId: newRequestId })
      .expect(200);

    expect(response2.body).toEqual({ success: true, duplicated: true });
  });

  it("возвращает 409, если тот же requestId использован с другими данными", async () => {
    const requestId = "conflict-request-456";

    await request(app)
      .post(`/users/${userId}/spend`)
      .set("Idempotency-Key", requestId)
      .send({ amount: 100 })
      .expect(200);

    await request(app)
      .post(`/users/${userId}/spend`)
      .set("Idempotency-Key", requestId)
      .send({ amount: 40 })
      .expect(409);
  });
});
