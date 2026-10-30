# 🎙️ 3-Minute Live Interview Demo Script & Architecture Guide

A concise walkthrough demonstrating every microservice, transaction boundary, and architectural tradeoff directly through the live web portal at **`http://localhost:3004/`**.

---

## ⏱️ Pre-Demo Setup (10 Seconds)

1. Ensure the stack is running:
   ```powershell
   .\start.cmd
   ```
2. Open your browser to: **[`http://localhost:3004/`](http://localhost:3004/)**
3. Turn on the **🎓 Interview Mode** toggle at the top right.

---

## 🎬 3-Minute Click-by-Click Walkthrough

### Step 1: Prove System Topology & Health Monitoring (30 Seconds)
* **What to do:** Point to the top **Telemetry Health Chips**.
* **What you see:** 6 live health chips with green status indicators and real round-trip latencies:
  - `Gateway :3004` (gateway `/api/v1/health`)
  - `Auth :3001` (AuthService `/api/v1/health`)
  - `Flights :3000` (FLIGHTSANDSEARCH `/api/v1/health`)
  - `Booking :3002` (BookingService `/api/v1/health`)
  - `Reminder :3003` (ReminderService `/api/v1/health`)
  - `RabbitMQ :15672` (Management API `/api/queues`)
* 🗣️ **What to say (2-3 sentences):**
  > *"The browser polls our distributed health endpoints through the API Gateway every 5 seconds. Each microservice connects exclusively to its own dedicated MySQL database schema with zero cross-database foreign keys. Inter-service coordination uses synchronous REST for critical-path operations and RabbitMQ for asynchronous event notifications."*

---

### Step 2: 1-Click Demo Login & Stateless JWT Verification (30 Seconds)
* **What to do:** Click the blue **"⚡ 1-Click Demo Login"** button in the Identity & Access Management panel.
* **What you see:** 
  - The 3-step auth sequence executes in real time (Signup ➔ Verify OTP ➔ Issue JWT).
  - The Decoded JWT Inspector opens, displaying the decoded Header (`HS256`), Payload Claims (`id`, `email`, `roles`), and an active live **Expiry Countdown**.
* 🗣️ **What to say (2-3 sentences):**
  > *"When authenticating, the Auth Service issues a symmetric `HS256` signed JWT containing identity and role claims. The API Gateway intercepts requests to protected routes and verifies the token signature locally using the shared secret. This keeps authorization checks entirely off the network latency path."*

---

### Step 3: Book Seats, Atomic Decrement & Failure Compensation (40 Seconds)
* **What to do:** 
  1. Scroll to the **Flights Catalog**.
  2. Note the available seat badge for Flight `1` (**`200 seats`**).
  3. Select **2 Seats** from the dropdown and click **"Book Seats"**.
* **What you see:**
  - The seat badge executes a scale-bounce animation and drops from **`200 seats`** to **`198 seats`**.
  - A new confirmed reservation card appears in **"My Active Bookings"** with real status `Booked`.
  - In the **Live Distributed Pipeline**, the nodes light up in order:
    `Browser ➔ Gateway ➔ Booking Svc ➔ Flight Svc ➔ Outbox Table ➔ RabbitMQ ➔ Reminder Svc ➔ Email (Ethereal sandbox)`
* 🗣️ **What to say (2-3 sentences):**
  > *"Booking coordinates an atomic conditional decrement on the Flights Service to prevent overselling, followed by payment processing and dual-writing the booking and an outbox event inside a single MySQL ACID transaction. If payment or the local transaction fails after the decrement, an automated compensating rollback immediately restores flight seats. The UI then fetches the updated flight record directly from the database to prove real persistence."*

---

### Step 4: Prove RabbitMQ Decoupling & Outbox Poller (30 Seconds)
* **What to do:** 
  1. Look at the **RabbitMQ Event Broker** card on the right.
  2. Point out **Queue Name: `REMINDER_QUEUE`**, **Active Consumers: 1 worker**, and real-time message counters.
  3. Click **"Open RabbitMQ UI"** (credentials `guest` / `guest`) if the interviewer wants to inspect the broker directly.
* **What you see:**
  - Published/Delivered/Acknowledged metrics reflect processed booking events.
* 🗣️ **What to say (2-3 sentences):**
  > *"The Booking Service runs an outbox poller every 5 seconds that dispatches pending events to RabbitMQ. The Reminder Service consumes these messages from `REMINDER_QUEUE` and queues notifications for asynchronous delivery. If the message broker is temporarily unreachable, booking transactions still commit cleanly and events queue safely in the Outbox table with status Pending until recovery."*

---

### Step 5: Cancel Booking & Inventory Restoration (20 Seconds)
* **What to do:** In the **My Active Bookings** panel, click **"✕ Cancel Ticket (Restore Seats)"** on the reservation you just created.
* **What you see:**
  - Booking status updates to `Cancelled`.
  - The flight seat counter bounces and **restores back from `198 seats` to `200 seats`** live on screen.
* 🗣️ **What to say (2-3 sentences):**
  > *"When a reservation is cancelled, the Booking Service marks the record as `Cancelled` and immediately fires a compensating `PATCH` to the Flight Service with `incrementSeats`. The flight's available seat inventory restores from 198 back to 200 live on screen."*

---

### Step 6: Grand Finale — Run the 33-Check Integration Suite (10 Seconds)
* **What to do:** Click the green **"🧪 Run Full E2E Self-Test (33 Checks)"** button in the top navigation.
* **What you see:** 
  - A modal opens and executes 33 automated end-to-end integration checks with live green checkmarks.
  - Finishes with a bright green banner: **`🎉 ALL 33/33 ASSERTIONS PASSED! System is fully verified.`**
* 🗣️ **What to say (2-3 sentences):**
  > *"This in-browser runner mirrors our automated Node integration suite and executes 33 distributed end-to-end assertions in under 10 seconds. It verifies perimeter security, atomic inventory decrements, Transactional Outbox persistence, multi-user access control, and compensating rollbacks."*

---

## 🏆 System Architecture Summary

| Architectural Decision | Implementation in Code | Verified Test Evidence / Remaining Limitation |
|---|---|---|
| **Atomic Inventory Decrement** | `UPDATE Flights SET totalSeats = totalSeats - N WHERE id = ? AND totalSeats >= N` | **Verified:** 10 concurrent requests contending for a 3-seat flight resulted in exactly 3 successes (201), 7 conflicts (409), exactly 3 MySQL rows added, and `totalSeats === 0` (never negative). |
| **Failure-Safe Compensation** | `PATCH incrementSeats` (`reason: booking-failed-rollback`) in `catch (error)` | **Verified:** Simulated payment failure confirmed seats before failed payment: 5, after: 5 (restored). Gated behind `ALLOW_TEST_HOOKS='true'`. |
| **Database-per-Service** | 4 isolated schemas (`auth_db_dev`, `flight_search_db_dev`, `booking_db_dev`, `reminder_db_dev`) | Logically separate on a single MySQL 8.0 container. Zero cross-schema foreign keys. |
| **Stateless Perimeter Auth** | Gateway validates JWT locally via symmetric `HS256` secret (`JWT_KEY`) | Requires identical `JWT_KEY` across services; cannot revoke individual tokens before expiry without a blacklist/Redis. |
| **Transactional Outbox** | Dual-writes booking + outbox event in single ACID transaction (`sequelize.transaction`) | Basic 5-second `setInterval` poller. No DLQ or exponential backoff on repeated broker failures. |
| **Asynchronous Notifications** | RabbitMQ exchange `BOOKING_SERVICE` ➔ `REMINDER_QUEUE` ➔ Reminder worker | Reminder consumer acks upon saving notification to DB. Mail delivery runs on an internal 15s poller using Ethereal sandbox SMTP without retry on failure. |

---

## 💡 Likely Interviewer Questions and Honest Answers

### 1. "How does the API Gateway verify JWTs? Does it make an HTTP call to Auth Service?"
* **Honest Answer:**
  > *"No, it does not call Auth Service on every request. In `API_Gateway/src/middlewares/auth-middleware.js`, the Gateway executes `jwt.verify(token, JWT_KEY)` locally using a shared symmetric secret (`HS256`). This keeps authentication out of the latency hot path. The tradeoff is that both services must share the secret key, and instantaneous token revocation (e.g. forced logout) isn't supported without adding a shared distributed cache like Redis."*

### 2. "How are OTPs generated and stored? Are they hashed?"
* **Honest Answer:**
  > *"Passwords are securely hashed with `bcrypt`, but OTPs are stored as plain text 6-digit strings in the `Users` table (`user.otp`) with an expiration timestamp (`user.otpExpiry`) in `AuthService/src/services/user-service.js`. In production, OTPs should be hashed (e.g., SHA-256 or bcrypt) or stored in Redis with an auto-expiring TTL. Also, for this demo environment, the signup endpoint returns the OTP in the JSON response to enable 1-click testing without requiring an active Gmail SMTP credential."*

### 3. "Is your seat decrement logic atomic? Can concurrent requests cause overbooking?"
* **Honest Answer:**
  > *"Yes, it is strictly atomic at the database level. In `FLIGHTSANDSEARCH/src/repository/flight-repo.js`, seat decrement executes a conditional SQL update: `UPDATE Flights SET totalSeats = totalSeats - N WHERE id = ? AND totalSeats >= N`. In MySQL InnoDB, this query acquires an exclusive row lock and conditionally evaluates capacity. If `affectedRows === 0`, it rejects the request with an insufficient seats error. We proved this in `scripts/test-concurrency.js` by firing 10 concurrent requests simultaneously at a flight configured with only 3 seats: exactly 3 succeeded, 7 failed with 409 Conflict, and final seats stopped at exactly 0 without overselling or negative counts."*

### 4. "What happens if payment or the database transaction fails after the Flight Service seat decrement?"
* **Honest Answer:**
  > *"In `BookingService/src/services/booking-service.js`, the seat decrement occurs via HTTP `PATCH` before payment and the booking database transaction. If payment or `sequelize.transaction` throws, the catch block intercepts the failure, verifies `seatsDecremented === true`, and sends a failure-safe compensating REST request (`PATCH incrementSeats`, reason `booking-failed-rollback`) to the Flight Service to restore inventory. We verified this by triggering a simulated payment failure, confirming the booking failed with 402 and the flight seats before failed payment: 5, after: 5 (restored).
  > 
  > **Remaining distributed systems gap:** If the initial Flight Service HTTP PATCH decrement request times out after being applied on the flight server (i.e. the network packet drops on the way back to Booking Service), the Booking Service cannot know whether seats were actually decremented or if the request never reached the server. Calling compensation blindly could double-increment seats, while doing nothing leaks seats. In a production enterprise system, this requires an **idempotency key** per reservation request and an asynchronous **reconciliation worker** (or a Saga orchestrator) to audit and resolve distributed discrepancies."*

### 5. "How does the Transactional Outbox pattern work if RabbitMQ goes down?"
* **Honest Answer:**
  > *"In `BookingService/src/services/booking-service.js`, the booking row and the outbox event are inserted together inside a single MySQL ACID transaction. The background poller (`outboxPoller.js`) runs every 5 seconds. If RabbitMQ is down, `publishMessage()` throws an error, the poller catches it, and the outbox record remains in `status: 'Pending'`. The user's booking is still confirmed. Once RabbitMQ recovers, the poller picks up the pending events on the next tick and publishes them. Known limitations: the poller uses a simple fixed interval without exponential backoff, dead-letter state, or `SELECT ... FOR UPDATE SKIP LOCKED` for multi-instance horizontal scaling."*

### 6. "How does message consumption and email delivery work in Reminder Service? Does it retry on email failure?"
* **Honest Answer:**
  > *"In `ReminderService/src/utils/rabbitConsumer.js`, the AMQP consumer executes `channel.ack(msg)` immediately after saving the notification record into `reminder_db_dev.notifications` with `notificationStatus: 'Pending'`. It does NOT wait for the email transmission to complete before acknowledging. Email delivery is handled separately by `notificationPoller.js`, which polls pending notifications every 15 seconds and invokes Nodemailer with an Ethereal sandbox SMTP account (`smtp.ethereal.email`). If email sending fails, the record status updates to `Failed`, and the code currently has no automatic retry or dead-letter queue mechanism."*

### 7. "Do you have a CI/CD pipeline or load testing suite configured?"
* **Honest Answer:**
  > *"There is currently no cloud CI/CD pipeline (such as GitHub Actions) configured in the repository. Instead, we have an end-to-end integration test suite in `scripts/test-e2e.js` (33 checks) which is also ported to our browser test runner. For concurrency, `scripts/test-concurrency.js` verifies that 10 simultaneous booking requests correctly enforce inventory bounds and that payment failures trigger compensating rollbacks, but formal high-load stress testing (e.g., using k6 or Artillery) has not yet been executed."*
