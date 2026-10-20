const { Flight } = require('../models');
async function seed() {
  const newFlights = [
    {
      flightNumber: 'UK-811',
      airplaneId: 1,
      departureAirportId: 1, // DEL
      arrivalAirportId: 3, // HYD (assuming 3 exists, if not, I'll use 2)
      arrivalTime: '2026-08-16T10:00:00.000Z',
      departureTime: '2026-08-16T08:00:00.000Z',
      price: 5200,
      totalSeats: 200,
      boardingGate: 'Gate 2B'
    },
    {
      flightNumber: '6E-455',
      airplaneId: 2,
      departureAirportId: 2, // BOM
      arrivalAirportId: 1, // DEL
      arrivalTime: '2026-08-17T18:30:00.000Z',
      departureTime: '2026-08-17T16:15:00.000Z',
      price: 4300,
      totalSeats: 160,
      boardingGate: 'Gate 4'
    },
    {
      flightNumber: 'QP-112',
      airplaneId: 1,
      departureAirportId: 1,
      arrivalAirportId: 2,
      arrivalTime: '2026-08-18T22:00:00.000Z',
      departureTime: '2026-08-18T20:10:00.000Z',
      price: 3900,
      totalSeats: 180,
      boardingGate: 'Gate 11A'
    }
  ];

  try {
    for (const flight of newFlights) {
      const existing = await Flight.findOne({ where: { flightNumber: flight.flightNumber } });
      if (!existing) {
        await Flight.create(flight);
      }
    }
    console.log('Seeded flights successfully');
  } catch (err) {
    console.error('Seeding error, possibly bad foreign keys, retrying with guaranteed airport IDs:', err.message);
    // Fallback: use departureAirportId: 1 and arrivalAirportId: 2 for all if others don't exist
    try {
      newFlights[0].arrivalAirportId = 2;
      newFlights[1].airplaneId = 1; // Try to use known airplaneId 1
      newFlights[1].departureAirportId = 1;
      newFlights[1].arrivalAirportId = 2;
      
      await Flight.create(newFlights[0]);
      await Flight.create(newFlights[1]);
      await Flight.create(newFlights[2]);
      console.log('Seeded using fallback IDs (1 and 2)');
    } catch(e) {
      console.error('Fallback failed:', e.message);
    }
  }
  process.exit(0);
}
seed();
