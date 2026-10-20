# ReminderService

RabbitMQ consumer that listens for `booking.created` events from BookingService, persists them as Notification records, and processes them via a polling mechanism that mocks sending (similar in structure to BookingService's outbox pattern).

## Run

```bash
cd ReminderService
npm install
npm start
```

## Config

- `PORT`
- `MESSAGE_BROKER_URL`
- `EXCHANGE_NAME`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_HOST`
