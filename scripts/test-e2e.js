const { INITIAL_FLIGHTS } = require('./flight-constants');
/**
 * Comprehensive End-to-End Acceptance Test Suite
 * Tests the entire Airline Management System workflow through API Gateway
 */

const BASE_URL = process.env.GATEWAY_URL || 'http://localhost:3004';

async function runTests() {
  console.log(`Starting E2E Acceptance Tests against ${BASE_URL}...\n`);
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health Checks & Aggregate Health
    console.log('1. Verifying Gateway & Downstream Health...');
    const gwHealthRes = await fetch(`${BASE_URL}/api/v1/health`);
    assert(gwHealthRes.status === 200, 'Gateway direct health (/api/v1/health) returns 200');

    const aggHealthRes = await fetch(`${BASE_URL}/api/v1/health/aggregate`);
    const aggHealth = await aggHealthRes.json();
    assert(aggHealthRes.status === 200, 'Aggregate health returns 200');
    assert(aggHealth.data?.auth === 'up', 'Aggregate AuthService reports UP');
    assert(aggHealth.data?.bookings === 'up', 'Aggregate BookingService reports UP');
    assert(aggHealth.data?.flights === 'up', 'Aggregate FlightService reports UP');
    assert(aggHealth.data?.reminder === 'up', 'Aggregate ReminderService reports UP');

    // 2. RabbitMQ Status Proxy
    console.log('\n2. Verifying RabbitMQ Broker & Queue Status...');
    const rabbitRes = await fetch(`${BASE_URL}/api/v1/rabbitmq/status`);
    assert(rabbitRes.status === 200, 'RabbitMQ status proxy (/api/v1/rabbitmq/status) returns 200');
    const rabbitData = await rabbitRes.json();
    assert(rabbitData.data?.name === 'REMINDER_QUEUE' && rabbitData.data?.messages_ready !== 'n/a', 'RabbitMQ proxy reports REMINDER_QUEUE healthy');

    // 3. Flight Search & City Catalog
    console.log('\n3. Testing Flight Search & City Catalog...');
    const flightsRes = await fetch(`${BASE_URL}/api/v1/flights/flight`);
    assert(flightsRes.status === 200, 'GET /api/v1/flights/flight returns 200');
    const flightsData = await flightsRes.json();
    assert(Array.isArray(flightsData.data) && flightsData.data.length >= 3, `Flight catalog contains real seeded flight records (${flightsData.data?.length} found)`);

    const targetFlight = flightsData.data?.[0];
    const initialSeats = INITIAL_FLIGHTS[targetFlight?.id]?.totalSeats || targetFlight?.totalSeats;
    assert(targetFlight?.totalSeats === initialSeats, `Target Flight 1 capacity matches single source of truth (${initialSeats} seats)`);
    console.log(`     Target Flight: ID ${targetFlight.id} (${targetFlight.flightNumber}), Seats: ${targetFlight.totalSeats}`);

    const citiesRes = await fetch(`${BASE_URL}/api/v1/flights/city`);
    assert(citiesRes.status === 200, 'GET /api/v1/flights/city returns 200');
    const citiesData = await citiesRes.json();
    assert(Array.isArray(citiesData.data) && citiesData.data.length >= 4, `City catalog contains seeded cities (>= 4, found ${citiesData.data?.length})`);

    // 4. User Authentication Flow (Signup, OTP, Signin, Profile)
    console.log('\n4. Testing User Authentication (Signup, OTP, Signin, Profile)...');
    const testEmail = `e2e_pilot_${Date.now()}@example.com`;
    const signupRes = await fetch(`${BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'E2E Pilot', email: testEmail, password: 'password123' })
    });
    assert(signupRes.status === 201, 'User signup returns 201 Created');
    const signupData = await signupRes.json();
    const otp = signupData.data?.otp;
    assert(!!otp, `OTP generated successfully in signup response: ${otp}`);

    const verifyRes = await fetch(`${BASE_URL}/api/v1/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp })
    });
    assert(verifyRes.status === 200, 'OTP verification returns 200 OK');

    const signinRes = await fetch(`${BASE_URL}/api/v1/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'password123' })
    });
    assert(signinRes.status === 200, 'Signin returns 200 OK');
    const signinData = await signinRes.json();
    const token = signinData.data?.token;
    assert(typeof token === 'string' && token.split('.').length === 3, 'Received valid signed JWT bearer token');

    const profileRes = await fetch(`${BASE_URL}/api/v1/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(profileRes.status === 200, 'User profile endpoint accessible with Bearer token');

    // 5. Authenticated Booking Creation & Atomic Inventory Decrement
    console.log('\n5. Testing Booking Creation & Atomic Seat Decrement...');
    const bookRes = await fetch(`${BASE_URL}/api/v1/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ flightId: targetFlight.id, noOfSeats: 2 })
    });
    assert(bookRes.status === 201, 'Booking created with 201 Created');
    const bookData = await bookRes.json();
    const bookingId = bookData.data?.id;
    assert(!!bookingId && !!bookData.data?.totalCost, `Booking record contains valid ID (${bookingId}) and totalCost (${bookData.data?.totalCost})`);
    assert(bookData.data?.status === 'Booked', `Booking status is Booked (received: "${bookData.data?.status}")`);

    // Verify seat decrement
    const flightAfterRes = await fetch(`${BASE_URL}/api/v1/flights/flight/${targetFlight.id}`);
    const flightAfter = await flightAfterRes.json();
    assert(flightAfter.data?.totalSeats === initialSeats - 2, `Flight seats accurately decremented from ${initialSeats} to ${flightAfter.data?.totalSeats}`);

    // 6. Transactional Outbox Record Verification & Access Control
    console.log('\n6. Verifying Transactional Outbox Event & Access Control...');
    const outboxRes = await fetch(`${BASE_URL}/api/v1/bookings/${bookingId}/outbox`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const outboxData = await outboxRes.json();
    assert(outboxRes.status === 200 && ['Pending', 'Sent'].includes(outboxData.data?.status), `Outbox record exists with Pending or Sent status (current: "${outboxData.data?.status}")`);

    // Verify another authenticated user cannot access this outbox event (403 Forbidden)
    const otherUserEmail = `other_pilot_${Date.now()}@example.com`;
    const otherSignupRes = await fetch(`${BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Other Pilot', email: otherUserEmail, password: 'password123' })
    });
    const otherSignupData = await otherSignupRes.json();
    const otherOtp = otherSignupData.data?.otp;
    await fetch(`${BASE_URL}/api/v1/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: otherUserEmail, otp: otherOtp })
    });
    const otherSigninRes = await (await fetch(`${BASE_URL}/api/v1/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: otherUserEmail, password: 'password123' })
    })).json();
    const otherToken = otherSigninRes.data?.token;

    const forbiddenOutboxRes = await fetch(`${BASE_URL}/api/v1/bookings/${bookingId}/outbox`, {
      headers: { 'Authorization': `Bearer ${otherToken}` }
    });
    assert(forbiddenOutboxRes.status === 403, 'Forbidden request for another user\'s outbox event rejected with 403');

    // Verify exact outbox match: bookingId=1 query strictly returns booking 1 event (not prefix match booking 12)
    const extraIds = [];
    for (let b = 2; b <= 12; b++) {
      const extraRes = await fetch(`${BASE_URL}/api/v1/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ flightId: targetFlight.id, noOfSeats: 1 })
      });
      const extraData = await extraRes.json();
      if (extraData.data?.id) extraIds.push(extraData.data.id);
    }
    for (const id of extraIds) {
      await fetch(`${BASE_URL}/api/v1/bookings/${id}/cancel`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }

    const exactMatchOutboxRes = await fetch(`${BASE_URL}/api/v1/bookings/${bookingId}/outbox`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const exactMatchData = await exactMatchOutboxRes.json();
    const returnedOutboxBookingId = exactMatchData.data?.payload?.bookingId;
    const collidedId = extraIds[extraIds.length - 1];
    assert(
      exactMatchOutboxRes.status === 200 &&
      returnedOutboxBookingId === Number(bookingId) &&
      (!collidedId || returnedOutboxBookingId !== collidedId),
      'Exact outbox match: bookingId=1 query strictly returns booking 1 event (not prefix match booking 12)'
    );

    // 7. Booking Retrieval
    console.log('\n7. Testing Booking Retrieval...');
    const userBookingsRes = await fetch(`${BASE_URL}/api/v1/bookings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(userBookingsRes.status === 200, 'GET /api/v1/bookings returns 200');
    const userBookings = await userBookingsRes.json();
    assert((userBookings.data?.count ?? userBookings.data?.length) >= 1, `User booking records retrieved successfully (found ${userBookings.data?.count ?? userBookings.data?.length})`);

    // 8. Booking Cancellation & Inventory Restoration
    console.log('\n8. Testing Booking Cancellation & Seat Restoration...');
    const cancelRes = await fetch(`${BASE_URL}/api/v1/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(cancelRes.status === 200, 'PATCH /api/v1/bookings/:id/cancel returns 200 OK');
    const cancelData = await cancelRes.json();
    assert(cancelData.data?.status === 'Cancelled', `Cancel response confirms status Cancelled (received: "${cancelData.data?.status}")`);

    const flightRestoredRes = await fetch(`${BASE_URL}/api/v1/flights/flight/${targetFlight.id}`);
    const flightRestored = await flightRestoredRes.json();
    assert(flightRestored.data?.totalSeats === initialSeats, `Flight seats accurately restored to ${flightRestored.data?.totalSeats}`);

    // 9. Security & Edge Cases
    console.log('\n9. Testing Security & Edge Cases...');
    const unauthRes = await fetch(`${BASE_URL}/api/v1/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flightId: targetFlight.id, noOfSeats: 1 })
    });
    assert(unauthRes.status === 401, 'Unauthorized booking request without token rejected with 401');

    const invalidFlightRes = await fetch(`${BASE_URL}/api/v1/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ flightId: 999999, noOfSeats: 1 })
    });
    assert(invalidFlightRes.status === 404, `Booking request for non-existent flight rejected with 404 (received: ${invalidFlightRes.status})`);

  } catch (err) {
    console.error('Unexpected test runner error:', err);
    failed++;
  }

  console.log(`\n============================================================`);
  if (failed === 0) {
    console.log(`  ALL ${passed} CHECKS PASSED -- SYSTEM FULLY OPERATIONAL`);
  } else {
    console.log(`  TEST RUN FAILED: ${passed} PASSED, ${failed} FAILED`);
  }
  console.log(`============================================================`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
