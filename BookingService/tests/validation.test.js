const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const validateBooking = require('../src/middlewares/validate-booking');

const app = express();
app.use(bodyParser.json());
app.post('/bookings', validateBooking, (req, res) => res.status(200).json({ ok: true }));

describe('validateBooking middleware', () => {
  it('rejects invalid flightId values', async () => {
    const response = await request(app).post('/bookings').send({ flightId: 0, noOfSeats: 1 });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid flightId');
  });

  it('rejects invalid noOfSeats values', async () => {
    const response = await request(app).post('/bookings').send({ flightId: 1, noOfSeats: 11 });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid noOfSeats');
  });
});
