/**
 * Demo State Reset Script
 * 
 * Restores the Airline Management System databases to a pristine demo-ready state.
 * Includes Safety Guards to prevent running against production or non-local databases.
 */

const { execSync } = require('child_process');
const { INITIAL_FLIGHTS } = require('./flight-constants');

// Safety Guards (Requirement 3)
const ALLOWED_DB_HOSTS = ['localhost', '127.0.0.1', 'airline-mysql'];
const dbHost = process.env.DB_HOST || '127.0.0.1';
const nodeEnv = process.env.NODE_ENV || 'development';

if (nodeEnv === 'production') {
  console.error('\n⛔ SAFETY ABORT: reset-demo.js cannot run in production (NODE_ENV=production).');
  process.exit(1);
}

if (!ALLOWED_DB_HOSTS.includes(dbHost)) {
  console.error(`\n⛔ SAFETY ABORT: reset-demo.js refused to run against host "${dbHost}". Allowed hosts: ${ALLOWED_DB_HOSTS.join(', ')}.`);
  process.exit(1);
}

function execSql(sql) {
  const cleanSql = sql.replace(/\r?\n/g, ' ').replace(/"/g, '\\"').trim();
  const cmd = `docker exec -e MYSQL_PWD=Pixel!Thunder_48@Ocean airline-mysql mysql -u root -e "${cleanSql}"`;
  return execSync(cmd, { encoding: 'utf-8' });
}

function runReset() {
  console.log('======================================================');
  console.log('  AIRLINE SYSTEM — DEMO STATE CLEANUP & RESET');
  console.log('======================================================');
  console.log(`[Safety Guard] Target DB Host: ${dbHost} (airline-mysql)`);
  console.log(`[Safety Guard] Environment:    ${nodeEnv}`);
  console.log('\nPending Destructive Operations:');
  console.log(`  - RESTORE Flights 1-3 seats from flight-constants.js (1: ${INITIAL_FLIGHTS[1].totalSeats}, 2: ${INITIAL_FLIGHTS[2].totalSeats}, 3: ${INITIAL_FLIGHTS[3].totalSeats})`);
  console.log('  - TRUNCATE all records from booking_db_dev.bookings');
  console.log('  - TRUNCATE all records from booking_db_dev.outbox');
  console.log('  - TRUNCATE all records from reminder_db_dev.notifications');
  console.log("  - DELETE automated test users from auth_db_dev.Users (@example.com / %test%)");
  console.log('======================================================\n');

  try {
    // 1. Reset Flight Seats using Single Source of Truth
    console.log('[1/4] Restoring Flight 1-3 seat inventory from flight-constants.js...');
    execSql(`UPDATE flight_search_db_dev.Flights SET totalSeats = ${INITIAL_FLIGHTS[1].totalSeats} WHERE id = 1;`);
    execSql(`UPDATE flight_search_db_dev.Flights SET totalSeats = ${INITIAL_FLIGHTS[2].totalSeats} WHERE id = 2;`);
    execSql(`UPDATE flight_search_db_dev.Flights SET totalSeats = ${INITIAL_FLIGHTS[3].totalSeats} WHERE id = 3;`);

    // 2. Clear Bookings and Outbox
    console.log('[2/4] Clearing test bookings and outbox records...');
    execSql('DELETE FROM booking_db_dev.bookings;');
    execSql('ALTER TABLE booking_db_dev.bookings AUTO_INCREMENT = 1;');
    execSql('DELETE FROM booking_db_dev.outbox;');
    execSql('ALTER TABLE booking_db_dev.outbox AUTO_INCREMENT = 1;');

    // 3. Clear Notifications
    console.log('[3/4] Clearing reminder notifications...');
    execSql('DELETE FROM reminder_db_dev.notifications;');
    execSql('ALTER TABLE reminder_db_dev.notifications AUTO_INCREMENT = 1;');

    // 4. Clean Test Users
    console.log('[4/4] Purging automated test users from auth database...');
    execSql("DELETE FROM auth_db_dev.Users WHERE email LIKE '%example.com%' OR email LIKE '%test%';");

    console.log('\n[OK] Cleanup completed successfully!\n');

    // Display Current State
    console.log('--- Current Flight Inventory ---');
    const flightsOut = execSql('SELECT id, flightNumber, totalSeats, price, boardingGate FROM flight_search_db_dev.Flights WHERE id IN (1, 2, 3);');
    console.log(flightsOut.trim());

    console.log('\n--- Table Counts ---');
    const countsOut = execSql("SELECT (SELECT COUNT(*) FROM booking_db_dev.bookings) AS total_bookings, (SELECT COUNT(*) FROM booking_db_dev.outbox) AS pending_outbox, (SELECT COUNT(*) FROM auth_db_dev.Users) AS active_users, (SELECT COUNT(*) FROM reminder_db_dev.notifications) AS notifications;");
    console.log(countsOut.trim());

    console.log('\n✨ System is 100% clean and ready for interview presentation!\n');
  } catch (err) {
    console.error('Reset failed:', err.message);
    process.exit(1);
  }
}

runReset();
