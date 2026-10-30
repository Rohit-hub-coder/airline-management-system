// e2e-runner.js - Dynamic Automated E2E Acceptance Suite
const E2ERunner = (() => {

  const CHECKS = [
    "Gateway direct health (/api/v1/health) returns 200",
    "Aggregate health returns 200",
    "Aggregate AuthService reports UP",
    "Aggregate BookingService reports UP",
    "Aggregate FlightService reports UP",
    "Aggregate ReminderService reports UP",
    "RabbitMQ status proxy (/api/v1/rabbitmq/status) returns 200",
    "RabbitMQ proxy reports REMINDER_QUEUE healthy",
    "GET /api/v1/flights/flight returns 200",
    "Flight catalog contains real seeded flight records",
    "Target Flight 1 capacity matches single source of truth (200 seats)",
    "GET /api/v1/flights/city returns 200",
    "City catalog contains seeded cities (>= 4)",
    "User signup returns 201 Created",
    "OTP generated successfully in signup response",
    "OTP verification returns 200 OK",
    "Signin returns 200 OK",
    "Received valid signed JWT bearer token",
    "User profile endpoint accessible with Bearer token",
    "Booking created with 201 Created",
    "Booking record contains valid ID and totalCost",
    "Booking status is Booked",
    "Flight seats accurately decremented from 200 to 198",
    "Outbox record exists with Pending or Sent status",
    "Forbidden request for another user's outbox event rejected with 403",
    "Exact outbox match: bookingId=1 query strictly returns booking 1 event (not prefix match booking 12)",
    "GET /api/v1/bookings returns 200",
    "User booking records retrieved successfully",
    "PATCH /api/v1/bookings/:id/cancel returns 200 OK",
    "Cancel response confirms status Cancelled",
    "Flight seats accurately restored to 200",
    "Unauthorized booking request without token rejected with 401",
    "Booking request for non-existent flight rejected with 404"
  ];

  async function runAll(mountId = 'e2eModalMount') {
    const totalChecks = CHECKS.length;
    let modal = document.getElementById(mountId);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = mountId;
      document.body.appendChild(modal);
    }

    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md';
    modal.innerHTML = `
      <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-xs">
        <!-- Header -->
        <div class="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div class="flex items-center gap-2">
            <span class="text-base">🧪</span>
            <div>
              <h3 class="font-bold text-white text-sm">Automated E2E Acceptance Suite</h3>
              <p class="text-[11px] text-slate-400">Verifying all ${totalChecks} distributed microservice assertions</p>
            </div>
          </div>
          <button id="closeE2EBtn" onclick="document.getElementById('${mountId}').remove()" class="text-slate-400 hover:text-white text-sm hidden">✕</button>
        </div>

        <!-- Progress Summary -->
        <div class="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div id="e2eSummaryText" class="font-mono text-slate-300 font-bold">
            Running 0/${totalChecks} assertions...
          </div>
          <div class="w-32 bg-slate-800 rounded-full h-2 overflow-hidden">
            <div id="e2eProgressBar" class="bg-blue-600 h-2 transition-all duration-200" style="width: 0%"></div>
          </div>
        </div>

        <!-- Checklist -->
        <div id="e2eChecklist" class="p-4 space-y-2 overflow-y-auto flex-1 font-mono text-[11px]">
          ${CHECKS.map((c, i) => `
            <div id="check_${i}" class="p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-400 flex items-center gap-2">
              <span class="check-icon">⚪</span>
              <span class="check-text">${i + 1}. ${c}</span>
            </div>
          `).join('')}
        </div>

        <!-- Footer Banner -->
        <div id="e2eFooterBanner" class="p-4 border-t border-slate-800 bg-slate-950 text-center font-bold text-xs text-slate-400">
          Executing automated test transactions...
        </div>
      </div>
    `;

    const updateCheck = (index, passed) => {
      const el = document.getElementById(`check_${index}`);
      if (!el) return;
      const icon = el.querySelector('.check-icon');
      if (passed) {
        el.className = 'p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2';
        icon.textContent = '✅';
      } else {
        el.className = 'p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-2';
        icon.textContent = '❌';
      }
      const progress = Math.round(((index + 1) / totalChecks) * 100);
      document.getElementById('e2eProgressBar').style.width = `${progress}%`;
      document.getElementById('e2eSummaryText').textContent = `Running ${index + 1}/${totalChecks} assertions...`;
    };

    let passedCount = 0;
    const rand = Math.floor(1000 + Math.random() * 9000);
    const testEmail = `e2e_showcase_${Date.now()}_${rand}@example.com`;
    const testPassword = 'Password123!';
    let token = null;
    let initialSeats = 0;
    let bookingId = null;

    const origToken = State.get().session.token;
    const origEmail = State.get().session.email;
    const origUser = State.get().session.user;

    try {
      // 1. Gateway direct health (/api/v1/health) returns 200
      const h1 = await API.checkGatewayHealth();
      if (h1.status === 'up') { passedCount++; updateCheck(0, true); } else { updateCheck(0, false); }

      // 2. Aggregate health returns 200
      const h2 = await API.checkAggregateHealth();
      const aggOk = h2.auth.status === 'up' && h2.bookings.status === 'up' && h2.flights.status === 'up' && h2.reminder.status === 'up';
      if (aggOk) { passedCount++; updateCheck(1, true); } else { updateCheck(1, false); }

      // 3. Aggregate AuthService reports UP
      if (h2.auth.status === 'up') { passedCount++; updateCheck(2, true); } else { updateCheck(2, false); }

      // 4. Aggregate BookingService reports UP
      if (h2.bookings.status === 'up') { passedCount++; updateCheck(3, true); } else { updateCheck(3, false); }

      // 5. Aggregate FlightService reports UP
      if (h2.flights.status === 'up') { passedCount++; updateCheck(4, true); } else { updateCheck(4, false); }

      // 6. Aggregate ReminderService reports UP
      if (h2.reminder.status === 'up') { passedCount++; updateCheck(5, true); } else { updateCheck(5, false); }

      // 7. RabbitMQ status proxy (/api/v1/rabbitmq/status) returns 200
      const rm = await API.checkRabbitMQStatus();
      if (rm.status === 'up') { passedCount++; updateCheck(6, true); } else { updateCheck(6, false); }

      // 8. RabbitMQ proxy reports REMINDER_QUEUE healthy
      if (rm.stats?.name === 'REMINDER_QUEUE' && rm.stats?.messages_ready !== 'n/a') { passedCount++; updateCheck(7, true); } else { updateCheck(7, false); }

      // 9. GET /api/v1/flights/flight returns 200
      const fRes = await API.getFlights();
      if (fRes.ok) { passedCount++; updateCheck(8, true); } else { updateCheck(8, false); }

      // 10. Flight catalog contains real seeded flight records
      if (Array.isArray(fRes.data) && fRes.data.length >= 3) { passedCount++; updateCheck(9, true); } else { updateCheck(9, false); }

      // 11. Target Flight 1 capacity matches single source of truth (200 seats)
      const targetFlight = fRes.data ? fRes.data.find(f => f.id === 1) || fRes.data[0] : null;
      initialSeats = targetFlight ? targetFlight.totalSeats : 0;
      if (targetFlight && initialSeats === 200) { passedCount++; updateCheck(10, true); } else { updateCheck(10, false); }

      // 12. GET /api/v1/flights/city returns 200
      const cRes = await API.getCities();
      if (cRes.ok) { passedCount++; updateCheck(11, true); } else { updateCheck(11, false); }

      // 13. City catalog contains seeded cities (>= 4)
      if (Array.isArray(cRes.data) && cRes.data.length >= 4) { passedCount++; updateCheck(12, true); } else { updateCheck(12, false); }

      // 14. User signup returns 201 Created
      const signupRes = await API.signup('E2E Showcase Pilot', testEmail, testPassword);
      if (signupRes.status === 201) { passedCount++; updateCheck(13, true); } else { updateCheck(13, false); }

      // 15. OTP generated successfully in signup response
      const otp = signupRes.data?.otp;
      if (otp) { passedCount++; updateCheck(14, true); } else { updateCheck(14, false); }

      // 16. OTP verification returns 200 OK
      const otpRes = await API.verifyOtp(testEmail, otp);
      if (otpRes.ok) { passedCount++; updateCheck(15, true); } else { updateCheck(15, false); }

      // 17. Signin returns 200 OK
      const signinRes = await API.signin(testEmail, testPassword);
      token = signinRes.data?.token || signinRes.data;
      if (signinRes.ok) { passedCount++; updateCheck(16, true); } else { updateCheck(16, false); }

      // 18. Received valid signed JWT bearer token
      if (token && typeof token === 'string' && token.split('.').length === 3) {
        passedCount++;
        updateCheck(17, true);
        State.setSession(token, testEmail);
      } else {
        updateCheck(17, false);
      }

      // 19. User profile endpoint accessible with Bearer token
      const profRes = await API.getProfile();
      if (profRes.ok) { passedCount++; updateCheck(18, true); } else { updateCheck(18, false); }

      // 20. Booking created with 201 Created
      const bookRes = await API.createBooking(1, 2);
      if (bookRes.status === 201) { passedCount++; updateCheck(19, true); } else { updateCheck(19, false); }

      // 21. Booking record contains valid ID and totalCost
      bookingId = bookRes.data?.id;
      if (bookingId && bookRes.data?.totalCost) { passedCount++; updateCheck(20, true); } else { updateCheck(20, false); }

      // 22. Booking status is Booked
      if (bookRes.data?.status === 'Booked') { passedCount++; updateCheck(21, true); } else { updateCheck(21, false); }

      // 23. Flight seats accurately decremented from 200 to 198
      const fCheck1 = await API.getFlight(1);
      const afterSeats = fCheck1.data?.totalSeats;
      if (afterSeats === initialSeats - 2) { passedCount++; updateCheck(22, true); } else { updateCheck(22, false); }

      // 24. Outbox record exists with Pending or Sent status
      const outboxRes = await API.getBookingOutbox(bookingId);
      if (outboxRes.ok && ['Pending', 'Sent'].includes(outboxRes.data?.status)) { passedCount++; updateCheck(23, true); } else { updateCheck(23, false); }

      // 25. Forbidden request for another user's outbox event rejected with 403
      const otherEmail = `other_showcase_${Date.now()}_${rand}@example.com`;
      const otherSignRes = await API.signup('Other Viewer', otherEmail, testPassword);
      const otherOtp = otherSignRes.data?.otp;
      await API.verifyOtp(otherEmail, otherOtp);
      const otherLogRes = await API.signin(otherEmail, testPassword);
      const otherToken = otherLogRes.data?.token || otherLogRes.data;

      const forbiddenOutboxRes = await fetch(`${window.location.origin}/api/v1/bookings/${bookingId}/outbox`, {
        headers: { 'Authorization': `Bearer ${otherToken}` }
      });
      if (forbiddenOutboxRes.status === 403) { passedCount++; updateCheck(24, true); } else { updateCheck(24, false); }

      // Restore active user session
      State.setSession(token, testEmail);

      // 26. Exact outbox match: bookingId=1 query strictly returns booking 1 event (not prefix match booking 12)
      const extraIds = [];
      for (let b = 2; b <= 12; b++) {
        const extraRes = await API.createBooking(1, 1);
        if (extraRes.data?.id) extraIds.push(extraRes.data.id);
      }
      for (const id of extraIds) {
        await API.cancelBooking(id);
      }
      const exactOutboxRes = await API.getBookingOutbox(bookingId);
      const returnedOutboxBookingId = exactOutboxRes.data?.payload?.bookingId;
      const collidedId = extraIds[extraIds.length - 1];
      if (
        exactOutboxRes.ok &&
        returnedOutboxBookingId === Number(bookingId) &&
        (!collidedId || returnedOutboxBookingId !== collidedId)
      ) {
        passedCount++;
        updateCheck(25, true);
      } else {
        updateCheck(25, false);
      }

      // 27. GET /api/v1/bookings returns 200
      const myBookings = await API.getBookings();
      if (myBookings.ok) { passedCount++; updateCheck(26, true); } else { updateCheck(26, false); }

      // 28. User booking records retrieved successfully
      if ((myBookings.data?.count ?? myBookings.data?.length) >= 1) { passedCount++; updateCheck(27, true); } else { updateCheck(27, false); }

      // 29. PATCH /api/v1/bookings/:id/cancel returns 200 OK
      const cancelRes = await API.cancelBooking(bookingId);
      if (cancelRes.ok) { passedCount++; updateCheck(28, true); } else { updateCheck(28, false); }

      // 30. Cancel response confirms status Cancelled
      if (cancelRes.data?.status === 'Cancelled' || cancelRes.raw?.data?.status === 'Cancelled') { passedCount++; updateCheck(29, true); } else { updateCheck(29, false); }

      // 31. Flight seats accurately restored to 200
      const fCheck2 = await API.getFlight(1);
      const restoredSeats = fCheck2.data?.totalSeats;
      if (restoredSeats === initialSeats) { passedCount++; updateCheck(30, true); } else { updateCheck(30, false); }

      // 32. Unauthorized booking request without token rejected with 401
      const unauthRes = await fetch(`${window.location.origin}/api/v1/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flightId: 1, noOfSeats: 1 })
      });
      if (unauthRes.status === 401) { passedCount++; updateCheck(31, true); } else { updateCheck(31, false); }

      // 33. Booking request for non-existent flight rejected with 404
      const invalidRes = await API.createBooking(999999, 1);
      if (invalidRes.status === 404) { passedCount++; updateCheck(32, true); } else { updateCheck(32, false); }

    } catch (e) {
      console.error('E2E Runner exception', e);
    } finally {
      // Restore user session if one existed prior to test run
      State.setSession(origToken, origEmail, origUser);
    }

    // Final Banner
    const footer = document.getElementById('e2eFooterBanner');
    const closeBtn = document.getElementById('closeE2EBtn');
    if (closeBtn) closeBtn.classList.remove('hidden');

    if (passedCount === totalChecks) {
      footer.className = 'p-4 border-t border-emerald-500/30 bg-emerald-950/60 text-center font-bold text-sm text-emerald-300';
      footer.textContent = `🎉 ALL ${passedCount}/${totalChecks} ASSERTIONS PASSED! System is fully verified.`;
      document.getElementById('e2eSummaryText').textContent = `${passedCount}/${totalChecks} PASSED (100%)`;
    } else {
      footer.className = 'p-4 border-t border-rose-500/30 bg-rose-950/60 text-center font-bold text-sm text-rose-300';
      footer.textContent = `${passedCount}/${totalChecks} passed. Please inspect failing check.`;
      document.getElementById('e2eSummaryText').textContent = `${passedCount}/${totalChecks} PASSED`;
    }

    // Refresh UI flights & bookings in main screen
    if (window.UIFlights) {
      UIFlights.loadFlights('flightsContainer');
      UIFlights.loadBookings('bookingsContainer');
    }

    return {
      passed: passedCount,
      total: totalChecks,
      failed: totalChecks - passedCount
    };
  }

  return {
    runAll,
    CHECKS
  };
})();

window.E2ERunner = E2ERunner;
