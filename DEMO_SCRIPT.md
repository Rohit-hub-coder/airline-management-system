# 🎙️ 3-Minute Live Interview Demo Script

A step-by-step walkthrough designed to demonstrate every microservice, distributed transaction boundary, and resiliency pattern directly through the live web portal at **`http://localhost:3004/`**.

---

## ⏱️ Pre-Demo Setup (10 Seconds)

1. Open PowerShell and run:
   ```powershell
   .\start.cmd
   ```
2. Open your browser to: **[`http://localhost:3004/`](http://localhost:3004/)**
3. Turn on the **🎓 Interview Mode** toggle at the top right.

---

## 🎬 3-Minute Click-by-Click Walkthrough

### Step 1: Prove System Health & Architecture (30 Seconds)
* **What to do:** Point your mouse at the top **Telemetry Health Chips**.
* **What you see:** 6 live health chips with green pulsing indicators and real round-trip latencies:
  - `Gateway :3004 (e.g. 2ms)`
  - `Auth :3001 (e.g. 18ms)`
  - `Flights :3000 (e.g. 10ms)`
  - `Booking :3002 (e.g. 12ms)`
  - `Reminder :3003 (e.g. 9ms)`
  - `RabbitMQ :5672 (e.g. 30ms)`
* 🗣️ **What to say:**
  > *"At the top bar, the API Gateway polls our distributed services every 5 seconds. Notice we adhere strictly to the Database-per-Service pattern: each microservice owns an isolated MySQL database (`auth_db_dev`, `flight_search_db_dev`, `booking_db_dev`, `reminder_db_dev`), communicating over REST and an asynchronous RabbitMQ message broker. Each chip shows real live network latency."*

---

### Step 2: 1-Click Demo Login & JWT Inspector (40 Seconds)
* **What to do:** Click the blue **"⚡ 1-Click Demo Login"** button in the Identity & Access Management panel.
* **What you see:** 
  - The 3-step auth sequence executes in real time (Signup ➔ Verify OTP ➔ Issue JWT).
  - The Decoded JWT Inspector opens, displaying the decoded Header (`HS256`), Payload Claims (`userId`, `email`, `roles`), and an active live **Expiry Countdown**.
* 🗣️ **What to say:**
  > *"When we authenticate, the Auth Service issues a cryptographically signed JWT. Notice the Decoded JWT Inspector: the API Gateway verifies this token locally using a shared secret key. This eliminates a network hop to the Auth Service on every authenticated request, keeping auth out of the latency hot path."*

---

### Step 3: Book Seats & Demonstrate Atomic Decrement (45 Seconds)
* **What to do:** 
  1. Scroll to the **Flights & Search Service** catalog.
  2. Note the available seat badge for Flight `UK-811` (e.g., **`199 seats`**).
  3. Select **2 Seats** from the dropdown and click **"Book Seats"**.
* **What you see:**
  - The seat badge executes a scale-bounce animation and drops from **`199 seats`** to **`197 seats`**.
  - A new confirmed reservation card appears in **"My Active Bookings"** with real status `Booked`.
  - In the **Live Distributed Pipeline**, the nodes light up in order:
    `Browser ➔ Gateway ➔ Booking Service ➔ Flights Service ➔ Outbox Table ➔ RabbitMQ ➔ Reminder Service ➔ Email`
* 🗣️ **What to say:**
  > *"When I book 2 seats, three things happen:
  > 1. The Booking Service opens an ACID database transaction and dual-writes both the booking record and a `booking.created` event into the Transactional Outbox table in MySQL.
  > 2. The Flights Service executes an atomic SQL update (`UPDATE Flights SET totalSeats = totalSeats - 2 WHERE id = 1 AND totalSeats >= 2`) so concurrent requests cannot cause an overbooking race condition.
  > 3. The UI immediately re-fetches the flight record from the database to ensure the animation reflects disk truth, not a local client assumption."*

---

### Step 4: Prove RabbitMQ Decoupling & Outbox Delivery (30 Seconds)
* **What to do:** 
  1. Look at the **RabbitMQ Event Broker** card on the right.
  2. Point out **Events Published** and **Active Consumers: 1 worker**.
  3. Click **"Open RabbitMQ Dashboard (guest / guest)"** in a new tab if the interviewer wants to see the AMQP queue.
* 🗣️ **What to say:**
  > *"We decouple slow operations like sending confirmation emails using RabbitMQ. The Booking Service outbox poller reliably publishes events to the `BOOKING_SERVICE` exchange. The Reminder Service consumes messages from `REMINDER_QUEUE` asynchronously. Even if RabbitMQ were temporarily offline, bookings would not fail; events queue safely in MySQL until broker recovery."*

---

### Step 5: Cancel Booking & Demonstrate Inventory Restoration (20 Seconds)
* **What to do:** In the **My Active Bookings** panel, click **"✕ Cancel Ticket"** on the reservation you just made.
* **What you see:**
  - Booking status flips to `Cancelled`.
  - The flight seat counter bounces and **restores back to `199 seats`** live on screen.
* 🗣️ **What to say:**
  > *"Upon cancellation, the Booking Service updates the state machine to `Cancelled` and triggers a compensating transaction on the Flights Service to restore inventory back to disk."*

---

### Step 6: Grand Finale — Run the 22-Check Automated Self-Test (15 Seconds)
* **What to do:** Click the green **"🧪 Run Full E2E Self-Test (22 Checks)"** button in the top navigation.
* **What you see:** 
  - A test suite modal opens and executes 22 automated end-to-end integration assertions item-by-item with live checkmarks.
  - Finishes with a bright green banner: **`🎉 ALL 22/22 ASSERTIONS PASSED! System is fully verified.`**
* 🗣️ **What to say:**
  > *"To guarantee complete system integrity, our browser test runner executes the exact same 22 acceptance assertions as our CI/CD pipeline—verifying health endpoints, catalog querying, OTP hashing, JWT authorization guards, atomic decrement, and seat restoration."*

---

## 🏆 Key Interview Takeaways to Emphasize

| Concept | Why it matters |
|---|---|
| **Database-per-Service** | 4 separate MySQL databases (`auth_db_dev`, `flight_search_db_dev`, `booking_db_dev`, `reminder_db_dev`); zero cross-database joins. |
| **Fail-Closed Seat Reservation** | Prevents overselling flight capacity under high concurrency. |
| **Transactional Outbox** | Prevents message loss between database writes and message broker dispatch. |
| **Stateless Gateway Auth** | JWT signature verified at the perimeter via `JWT_KEY`, eliminating auth bottlenecks. |
| **Asynchronous Notifications** | RabbitMQ buffer protects user response times from third-party email latency. |
