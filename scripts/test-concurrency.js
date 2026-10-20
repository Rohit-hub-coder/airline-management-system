/**
 * Concurrent Booking Test: Verifies atomic seat decrement and race condition protection
 */

async function testConcurrency() {
  console.log('Testing Concurrent Reservations Under High Load...');

  // 1. Get a flight
  const flightRes = await (await fetch('http://localhost:3000/api/v1/flight/3')).json();
  const initialSeats = flightRes.data.totalSeats;
  console.log(`Initial Flight 3 seats: ${initialSeats}`);

  // 2. Create and authenticate 5 concurrent test users
  const tokens = [];
  for (let i = 0; i < 5; i++) {
    const email = `conc_user_${Date.now()}_${i}@example.com`;
    const s = await (await fetch('http://localhost:3001/api/v1/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `Conc User ${i}`, email, password: 'password123' })
    })).json();
    await fetch('http://localhost:3001/api/v1/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: s.data.otp })
    });
    const l = await (await fetch('http://localhost:3001/api/v1/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123' })
    })).json();
    tokens.push(l.data.token);
  }
  console.log(`Created and authenticated ${tokens.length} users.`);

  // 3. Fire 5 concurrent booking requests of 2 seats each (total 10 seats) simultaneously
  console.log('Firing 5 concurrent booking requests of 2 seats each simultaneously...');
  const requests = tokens.map(token => {
    return fetch('http://localhost:3002/api/v1/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ flightId: 3, noOfSeats: 2 })
    }).then(async r => ({ status: r.status, data: await r.json() }));
  });

  const results = await Promise.all(requests);
  const successes = results.filter(r => r.status === 201);
  const failures = results.filter(r => r.status !== 201);
  console.log(`Concurrent Results: ${successes.length} succeeded, ${failures.length} failed.`);

  // 4. Verify exact seat count in database
  const flightAfterRes = await (await fetch('http://localhost:3000/api/v1/flight/3')).json();
  const expectedRemaining = initialSeats - (successes.length * 2);
  const actualRemaining = flightAfterRes.data.totalSeats;
  console.log(`Expected Remaining Seats: ${expectedRemaining}, Actual: ${actualRemaining}`);

  if (actualRemaining === expectedRemaining) {
    console.log('[PASS] Atomic inventory protection verified! No race conditions.');
    process.exit(0);
  } else {
    console.error('[FAIL] Inventory mismatch! Possible race condition.');
    process.exit(1);
  }
}

testConcurrency();
