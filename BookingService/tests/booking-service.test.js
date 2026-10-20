jest.mock('axios', () => ({
  get: jest.fn(),
  patch: jest.fn()
}));

jest.mock('../src/repository/booking-repository', () => {
  return jest.fn().mockImplementation(() => ({
    create: jest.fn()
  }));
});

jest.mock('../src/services/payment-service', () => {
  return jest.fn().mockImplementation(() => ({
    processPayment: jest.fn().mockResolvedValue({ success: true })
  }));
});

jest.mock('../src/models', () => ({
  Outbox: {
    create: jest.fn().mockResolvedValue({})
  },
  sequelize: {
    transaction: jest.fn(async (cb) => cb({}))
  }
}));

const axios = require('axios');
const BookingRepository = require('../src/repository/booking-repository');
const PaymentService = require('../src/services/payment-service');
const BookingService = require('../src/services/booking-service');
const { Outbox, sequelize } = require('../src/models');

describe('BookingService.createBooking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fails closed when the flight service response does not include verifiable seat data', async () => {
    axios.get.mockResolvedValue({ data: { ok: true } });

    const createBookingMock = jest.fn().mockResolvedValue({ id: 99 });
    BookingRepository.mockImplementation(() => ({
      create: createBookingMock
    }));

    const service = new BookingService();

    await expect(service.createBooking({ userId: 42, flightId: 1, noOfSeats: 1 })).rejects.toMatchObject({
      message: 'The flight service did not provide a usable seat count',
      name: 'Flight availability could not be verified',
      statusCode: 503
    });

    expect(axios.patch).not.toHaveBeenCalled();
    expect(createBookingMock).not.toHaveBeenCalled();
  });

  it('atomically creates a booking and outbox entry inside a database transaction', async () => {
    axios.get.mockResolvedValue({ data: { data: { totalSeats: 50, price: 5000 } } });
    axios.patch.mockResolvedValue({ data: { success: true } });

    const fakeBooking = { id: 101, userId: 42, flightId: 1, noOfSeats: 2, status: 'Booked' };
    const createBookingMock = jest.fn().mockResolvedValue(fakeBooking);
    BookingRepository.mockImplementation(() => ({
      create: createBookingMock
    }));

    const service = new BookingService();
    const result = await service.createBooking({ userId: 42, flightId: 1, noOfSeats: 2 });

    expect(result).toEqual(fakeBooking);
    expect(sequelize.transaction).toHaveBeenCalledTimes(1);
    expect(createBookingMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'Booked', totalCost: 10000 }),
      expect.objectContaining({ transaction: expect.anything() })
    );
    expect(Outbox.create).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'booking.created', status: 'Pending' }),
      expect.objectContaining({ transaction: expect.anything() })
    );
  });
});
