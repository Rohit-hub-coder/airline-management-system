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
    // 1. Health Checks
    console.log('1. Verifying Gateway & Downstream Health...');
    const gwHealthRes = await fetch(`${BASE_URL}/api/v1/health`);
    assert(gwHealthRes.status === 200, 'Gateway /api/v1/health returns 200');

    const aggHealthRes = await fetch(`${BASE_URL}/api/v1/health/aggregate`);
    const aggHealth = await aggHealthRes.json();
    assert(aggHealthRes.status === 200, 'Aggregate health returns 200');
    assert(aggHealth.data?.auth === 'up', 'AuthService is UP');
    assert(aggHealth.data?.bookings === 'up', 'BookingService is UP');
    assert(aggHealth.data?.flights === 'up', 'FlightService is UP');

    // 2. Flight Search
    console.log('\n2. Testing Flight Search...');
    const flightsRes = await fetch(`${BASE_URL}/api/v1/flights/flight`);
    assert(flightsRes.status === 200, 'GET /api/v1/flights/flight returns 200');
    const flightsData = await flightsRes.json();
    assert(Array.isArray(flightsData.data) && flightsData.data.length > 0, `Returned ${flightsData.data?.length} real flight records`);
    const targetFlight = flightsData.data[0];
    const initialSeats = targetFlight.totalSeats;
    console.log(`     Target Flight: ID ${targetFlight.id} (${targetFlight.flightNumber}), Seats: ${initialSeats}`);

    // 3. User Authentication Flow (Signup, OTP, Signin)
    console.log('\n3. Testing User Authentication (Signup, OTP, Signin)...');
    const testEmail = `e2e_pilot_${Date.now()}@example.com`;
    const signupRes = await fetch(`${BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'E2E Pilot', email: testEmail, password: 'password123' })
    });
    assert(signupRes.status === 201, 'Signup returns 201 Created');
    const signupData = await signupRes.json();
    const otp = signupData.data?.otp;
    assert(!!otp, `OTP generated successfully: ${otp}`);

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
    assert(!!token, 'Received valid JWT bearer token');

    // Profile check with JWT
    const profileRes = await fetch(`${BASE_URL}/api/v1/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(profileRes.status === 200, 'Profile accessible with Bearer token');

    // 4. Authenticated Booking Creation & Atomic Inventory Decrement
    console.log('\n4. Testing Booking Creation & Atomic Seat Decrement...');
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
    assert(!!bookingId, `Created Booking ID: ${bookingId}, Total Cost: ${bookData.data?.totalCost}`);

    // Verify seat decrement
    const flightAfterRes = await fetch(`${BASE_URL}/api/v1/flights/flight/${targetFlight.id}`);
    const flightAfter = await flightAfterRes.json();
    assert(flightAfter.data?.totalSeats === initialSeats - 2, `Flight seats accurately decremented from ${initialSeats} to ${flightAfter.data?.totalSeats}`);

    // 5. Booking Retrieval
    console.log('\n5. Testing Booking Retrieval...');
    const userBookingsRes = await fetch(`${BASE_URL}/api/v1/bookings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(userBookingsRes.status === 200, 'GET /api/v1/bookings returns 200');
    const userBookings = await userBookingsRes.json();
    assert(userBookings.data?.count >= 1, `Retrieved ${userBookings.data?.count} user booking records`);

    // 6. Booking Cancellation & Inventory Restoration
    console.log('\n6. Testing Booking Cancellation & Seat Restoration...');
    const cancelRes = await fetch(`${BASE_URL}/api/v1/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(cancelRes.status === 200, 'PATCH /api/v1/bookings/:id/cancel returns 200 OK');

    const flightRestoredRes = await fetch(`${BASE_URL}/api/v1/flights/flight/${targetFlight.id}`);
    const flightRestored = await flightRestoredRes.json();
    assert(flightRestored.data?.totalSeats === initialSeats, `Flight seats restored accurately to ${flightRestored.data?.totalSeats}`);

    // 7. Security & Error Handling Tests
    console.log('\n7. Testing Security & Edge Cases...');
    const unauthRes = await fetch(`${BASE_URL}/api/v1/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flightId: targetFlight.id, noOfSeats: 1 })
    });
    assert(unauthRes.status === 401, 'Unauthorized request rejected with 401');

    const invalidFlightRes = await fetch(`${BASE_URL}/api/v1/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ flightId: 999999, noOfSeats: 1 })
    });
    assert(invalidFlightRes.status >= 400, 'Booking for non-existent flight rejected');

  } catch (err) {
    console.error('Unexpected test runner error:', err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
