# Backend Test Task

Подробная формулировка тестового находится в [TASK.md](/Users/nihyaway00/Documents/Работа/TolaMed-доки/Тестовое/TASK.md).

## Быстрый запуск

```bash
docker compose up --build
```

API будет доступен на `http://localhost:3000`.

## Полезные команды

```bash
docker compose exec api npm run migrate
docker compose down -v
docker compose up --build
```

## Доступные endpoint'ы

- `GET /health`
- `GET /users/:id`
- `GET /users/:id/bonus-transactions`
- `POST /users/:id/spend`
- `POST /jobs/expire-accruals`

## Примеры запросов

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
curl -X POST http://localhost:3000/users/11111111-1111-1111-1111-111111111111/spend \
  -H 'Content-Type: application/json' \
  -d '{"amount": 50}'
```

```bash
curl -X POST http://localhost:3000/jobs/expire-accruals
```

## Анализ и рефакторинг

Этот раздел должен быть заполнен кандидатом. Ответы обязательны.

1. Какие проблемы есть в текущей реализации списания?
2. Какие race conditions возможны?
3. Какие сценарии могут привести к неконсистентным данным?
4. Что бы вы сделали как быстрый фикс?
5. Что бы вы сделали как правильное долгосрочное решение?
6. Какие места в проекте выглядят потенциально проблемными с точки зрения масштабирования?
