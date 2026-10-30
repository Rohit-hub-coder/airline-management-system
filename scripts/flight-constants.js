/**
 * Flight Constants - Single Source of Truth for seeded flight seat capacities
 */
const INITIAL_FLIGHTS = {
  1: {
    flightNumber: 'UK-811',
    totalSeats: 200,
    price: 5200,
    boardingGate: 'Gate 2B'
  },
  2: {
    flightNumber: '6E-455',
    totalSeats: 160,
    price: 4300,
    boardingGate: 'Gate 4'
  },
  3: {
    flightNumber: 'QP-112',
    totalSeats: 180,
    price: 3900,
    boardingGate: 'Gate 11A'
  }
};

module.exports = {
  INITIAL_FLIGHTS
};
