# Minimal Backend для тестового задания

Стек:
- Node.js
- TypeScript
- Express
- PostgreSQL
- Sequelize
- BullMQ
- Redis
- Docker Compose

## Быстрый запуск

```bash
docker compose up --build
```

После старта API доступен на `http://localhost:3000`.

## Миграции

Миграции запускаются автоматически при старте `api` контейнера (`npm run migrate`).

При необходимости можно применить вручную:

```bash
docker compose exec api npm run migrate
```

## Seed данные

Файл `db/seed.sql` автоматически выполняется Postgres при первом создании volume.

Если нужно заново прогнать seed, удалите volume и поднимите проект снова:

```bash
docker compose down -v
docker compose up --build
```

## Доступные endpoint'ы

- `GET /health`
- `GET /users/:id`
- `GET /users/:id/bonus-transactions`
- `POST /jobs/expire-accruals`

## Примеры curl

```bash
curl http://localhost:3000/health
```

```bash
curl http://localhost:3000/users/11111111-1111-1111-1111-111111111111
```

```bash
curl http://localhost:3000/users/11111111-1111-1111-1111-111111111111/bonus-transactions
```

```bash
curl -X POST http://localhost:3000/jobs/expire-accruals
```
