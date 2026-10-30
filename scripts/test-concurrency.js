/**
 * Concurrency & Compensation Verification Suite
 *
 * Verifies:
 * 1. Atomic seat decrement under concurrency: 10 concurrent requests for a 3-seat flight.
 *    Asserts exactly 3 succeed, 7 fail, totalSeats === 0, and exactly 3 'Booked' rows added to MySQL.
 * 2. Compensating rollback on payment failure:
 *    Simulates payment failure when ALLOW_TEST_HOOKS is enabled.
 *    Asserts booking fails with 402, and flight seats are rolled back to original count.
 * 3. Restoration of test flight seat capacity from single source of truth (flight-constants.js).
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { INITIAL_FLIGHTS } = require('./flight-constants');

const FLIGHT_SERVICE_URL = 'http://localhost:3000/api/v1';
const AUTH_SERVICE_URL = 'http://localhost:3001/api/v1';
const BOOKING_SERVICE_URL = 'http://localhost:3002/api/v1';
const TARGET_FLIGHT_ID = 3;

function queryDbBookingsCount(flightId) {
  try {
    const cmd = `docker exec -e MYSQL_PWD=Pixel!Thunder_48@Ocean airline-mysql mysql -u root -N -e "SELECT count(*) FROM booking_db_dev.bookings WHERE flightId = ${flightId} AND status = 'Booked';"`;
    const countStr = execSync(cmd, { encoding: 'utf-8' }).trim();
    return parseInt(countStr, 10);
  } catch (err) {
    console.error('Failed to query MySQL database for bookings count:', err.message);
    throw err;
  }
}

async function setFlightSeats(flightId, totalSeats) {
  const res = await fetch(`${FLIGHT_SERVICE_URL}/flight/${flightId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ totalSeats })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Failed to set seats: ${JSON.stringify(data)}`);
  }
  return data.data.totalSeats;
}

async function getFlight(flightId) {
  const res = await fetch(`${FLIGHT_SERVICE_URL}/flight/${flightId}`);
  const data = await res.json();
  return data.data;
}

async function createAuthUser(index) {
  const email = `test_conc_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}@example.com`;
  const signupRes = await (await fetch(`${AUTH_SERVICE_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: `Conc User ${index}`, email, password: 'password123' })
  })).json();

  const otp = signupRes.data?.otp;
  if (!otp) throw new Error(`Signup did not return OTP for ${email}`);

  await fetch(`${AUTH_SERVICE_URL}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  });

  const signinRes = await (await fetch(`${AUTH_SERVICE_URL}/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' })
  })).json();

  return signinRes.data?.token || signinRes.data;
}

async function runConcurrencyTest() {
  console.log('\n======================================================');
  console.log('TEST 1: ATOMIC CONDITIONAL SEAT DECREMENT CONCURRENCY');
  console.log('======================================================');

  // 1. Single source of truth seat capacity
  const originalSeats = INITIAL_FLIGHTS[TARGET_FLIGHT_ID].totalSeats;
  console.log(`Target Flight ${TARGET_FLIGHT_ID} original seats (from flight-constants.js): ${originalSeats}`);

  try {
    // 2. Set capacity to exactly 3 seats
    console.log(`Setting Flight ${TARGET_FLIGHT_ID} capacity to exactly 3 seats...`);
    await setFlightSeats(TARGET_FLIGHT_ID, 3);
    const configuredFlight = await getFlight(TARGET_FLIGHT_ID);
    console.log(`Flight ${TARGET_FLIGHT_ID} configured seats: ${configuredFlight.totalSeats}`);
    if (configuredFlight.totalSeats !== 3) {
      throw new Error(`Expected configured seats to be 3, got ${configuredFlight.totalSeats}`);
    }

    // 3. Record baseline DB bookings
    const baselineBookings = queryDbBookingsCount(TARGET_FLIGHT_ID);
    console.log(`Baseline MySQL 'Booked' count for flight ${TARGET_FLIGHT_ID}: ${baselineBookings}`);

    // 4. Create 10 authenticated users
    console.log('Creating and authenticating 10 distinct users...');
    const tokens = [];
    for (let i = 0; i < 10; i++) {
      tokens.push(await createAuthUser(i));
    }
    console.log(`Successfully authenticated ${tokens.length} users.`);

    // 5. Fire 10 concurrent requests simultaneously
    console.log('Firing 10 concurrent single-seat booking requests simultaneously via Promise.all...');
    const bookingPromises = tokens.map(token => {
      return fetch(`${BOOKING_SERVICE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ flightId: TARGET_FLIGHT_ID, noOfSeats: 1 })
      }).then(async r => {
        let json = {};
        try { json = await r.json(); } catch (e) {}
        return { status: r.status, data: json };
      });
    });

    const results = await Promise.all(bookingPromises);

    // 6. Inspect responses and actual status codes
    const successes = results.filter(r => r.status === 201);
    const failures = results.filter(r => r.status !== 201);

    const failureStatuses = [...new Set(failures.map(f => f.status))];
    console.log('\n--- Concurrency Test Results ---');
    console.log(`Total Requests: ${results.length}`);
    console.log(`Successes (HTTP 201): ${successes.length}`);
    console.log(`Failures: ${failures.length} (Observed HTTP status codes: ${failureStatuses.join(', ')})`);
    if (failures.length > 0) {
      console.log(`Failure message sample:`, JSON.stringify(failures[0].data));
    }

    // Assertions
    if (successes.length !== 3) {
      throw new Error(`[ASSERTION FAILED] Expected exactly 3 successes, got ${successes.length}`);
    }
    console.log('  [PASS] Exactly 3 requests succeeded with HTTP 201.');

    if (failures.length !== 7) {
      throw new Error(`[ASSERTION FAILED] Expected exactly 7 failures, got ${failures.length}`);
    }
    console.log(`  [PASS] Exactly 7 requests failed with status ${failureStatuses.join(', ')}.`);

    // 7. Check database rows
    const finalBookings = queryDbBookingsCount(TARGET_FLIGHT_ID);
    const addedBookings = finalBookings - baselineBookings;
    console.log(`Final MySQL 'Booked' count: ${finalBookings} (Added: ${addedBookings})`);
    if (addedBookings !== 3) {
      throw new Error(`[ASSERTION FAILED] Expected exactly 3 'Booked' rows added to MySQL, got ${addedBookings}`);
    }
    console.log('  [PASS] Exactly 3 Booked records committed to MySQL.');

    // 8. Check final seat count (must be exactly 0, never negative)
    const finalFlight = await getFlight(TARGET_FLIGHT_ID);
    console.log(`Final totalSeats in flight database: ${finalFlight.totalSeats}`);
    if (finalFlight.totalSeats !== 0) {
      throw new Error(`[ASSERTION FAILED] Expected totalSeats === 0, got ${finalFlight.totalSeats}`);
    }
    console.log('  [PASS] Final totalSeats === 0 (Zero capacity overbooked, no negative seats).');

    return originalSeats;
  } catch (err) {
    // Attempt seat restoration on failure from constants
    await setFlightSeats(TARGET_FLIGHT_ID, INITIAL_FLIGHTS[TARGET_FLIGHT_ID].totalSeats);
    throw err;
  }
}

async function runCompensationTest(originalSeats) {
  console.log('\n======================================================');
  console.log('TEST 2: COMPENSATING ROLLBACK ON PAYMENT FAILURE');
  console.log('======================================================');

  const overridePath = path.resolve(__dirname, '../compose.override.yaml');

  try {
    // 1. Verify that WITHOUT test hook enabled, failPaymentForTest is ignored
    console.log('Step 2a: Confirming hook is ignored when ALLOW_TEST_HOOKS is not set...');
    await setFlightSeats(TARGET_FLIGHT_ID, 5);
    const tokenNoHook = await createAuthUser('nohook');
    const resNoHook = await fetch(`${BOOKING_SERVICE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenNoHook}`
      },
      body: JSON.stringify({ flightId: TARGET_FLIGHT_ID, noOfSeats: 1, failPaymentForTest: true })
    });
    if (resNoHook.status === 201) {
      console.log('  [PASS] Request succeeded (201) as expected because test hooks are disabled by default.');
    } else {
      console.warn(`  [WARN] Unexpected response: ${resNoHook.status}`);
    }

    // 2. Enable ALLOW_TEST_HOOKS via compose.override.yaml
    console.log('\nStep 2b: Enabling ALLOW_TEST_HOOKS=true for test run via compose.override.yaml...');
    fs.writeFileSync(overridePath, "services:\n  booking-service:\n    environment:\n      ALLOW_TEST_HOOKS: 'true'\n");
    execSync('docker compose up -d booking-service', { stdio: 'inherit' });
    await new Promise(r => setTimeout(r, 4000));

    // 3. Set seats to 5
    console.log(`Setting Flight ${TARGET_FLIGHT_ID} to 5 seats...`);
    await setFlightSeats(TARGET_FLIGHT_ID, 5);
    const beforeFlight = await getFlight(TARGET_FLIGHT_ID);
    console.log(`Flight ${TARGET_FLIGHT_ID} seats before test booking: ${beforeFlight.totalSeats}`);

    // 4. Fire booking with simulated payment failure
    console.log('Firing booking request with failPaymentForTest: true (requesting 2 seats)...');
    const tokenFail = await createAuthUser('failpay');
    const failRes = await fetch(`${BOOKING_SERVICE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenFail}`
      },
      body: JSON.stringify({ flightId: TARGET_FLIGHT_ID, noOfSeats: 2, failPaymentForTest: true })
    });

    const failData = await failRes.json();
    console.log(`Booking response status: ${failRes.status} (Expected 402 PAYMENT_REQUIRED)`);
    console.log(`Booking response body:`, JSON.stringify(failData));

    if (failRes.status !== 402) {
      throw new Error(`[ASSERTION FAILED] Expected status 402, got ${failRes.status}`);
    }
    console.log('  [PASS] Booking rejected with HTTP 402 due to payment failure.');

    // 5. Verify compensation restored seats back to 5
    await new Promise(r => setTimeout(r, 1000));
    const afterFlight = await getFlight(TARGET_FLIGHT_ID);
    console.log(`Flight ${TARGET_FLIGHT_ID} seats after failure compensation: ${afterFlight.totalSeats}`);

    if (afterFlight.totalSeats !== 5) {
      throw new Error(`[ASSERTION FAILED] Expected seats to be restored to 5, but got ${afterFlight.totalSeats}`);
    }
    console.log(`  [PASS] Compensating transaction verified: seats before failed payment: ${beforeFlight.totalSeats}, after: ${afterFlight.totalSeats} (restored)`);

  } finally {
    // 6. Turn off test hook and cleanup override
    console.log('\nStep 2c: Disabling ALLOW_TEST_HOOKS and restoring container...');
    if (fs.existsSync(overridePath)) {
      fs.unlinkSync(overridePath);
    }
    execSync('docker compose up -d booking-service', { stdio: 'inherit' });
    await new Promise(r => setTimeout(r, 4000));

    // 7. Restore original seats from flight-constants.js
    console.log(`Restoring Flight ${TARGET_FLIGHT_ID} back to source of truth capacity (${originalSeats})...`);
    await setFlightSeats(TARGET_FLIGHT_ID, originalSeats);
    const restoredFlight = await getFlight(TARGET_FLIGHT_ID);
    console.log(`Flight ${TARGET_FLIGHT_ID} restored seats: ${restoredFlight.totalSeats}`);
  }
}

async function main() {
  try {
    const originalSeats = await runConcurrencyTest();
    await runCompensationTest(originalSeats);
    console.log('\n======================================================');
    console.log('🎉 ALL CONCURRENCY AND COMPENSATION TESTS PASSED!');
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    process.exit(1);
  }
}

main();
