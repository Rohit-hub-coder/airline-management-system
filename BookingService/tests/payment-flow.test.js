const axios = require('axios');
const BookingService = require('../src/services/booking-service');

jest.mock('axios', () => ({
  get: jest.fn(),
  patch: jest.fn()
}));

jest.mock('../src/repository/booking-repository', () => {
  return jest.fn().mockImplementation(() => ({
    create: jest.fn().mockResolvedValue({ id: 42, userId: 7, status: 'Booked' }),
    findById: jest.fn().mockResolvedValue(null),
    updateById: jest.fn().mockResolvedValue({ id: 42, status: 'Cancelled' })
  }));
});

jest.mock('../src/services/payment-service', () => {
  return jest.fn().mockImplementation(() => ({
    processPayment: jest.fn().mockResolvedValue({ success: false })
  }));
});

jest.mock('../src/models', () => ({
  Outbox: {
    create: jest.fn().mockResolvedValue({})
  }
}));

describe('BookingService payment rollback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('cancels the booking when payment fails and releases seats', async () => {
    axios.get.mockResolvedValue({ data: { data: { id: 1, totalSeats: 20, price: 100 } } });
    axios.patch.mockResolvedValue({});

    const service = new BookingService();

    await expect(service.createBooking({ userId: 7, flightId: 1, noOfSeats: 1 })).rejects.toMatchObject({
      name: 'Payment failed'
    });

    expect(axios.patch).toHaveBeenCalledTimes(1);
  });
});
