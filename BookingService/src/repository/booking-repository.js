const { Booking } = require('../models');

class BookingRepository {
  async create(bookingData, options = {}) {
    return Booking.create(bookingData, options);
  }

  async findById(id) {
    return Booking.findByPk(id);
  }

  async updateById(id, updateData) {
    await Booking.update(updateData, { where: { id } });
    return this.findById(id);
  }

  async findAllByUser(userId, { page = 1, limit = 10, status } = {}) {
    const offset = (page - 1) * limit;
    const where = { userId };

    if (status) {
      where.status = status;
    }

    return Booking.findAndCountAll({
      where,
      limit: Number(limit),
      offset: Number(offset),
      order: [['createdAt', 'DESC']]
    });
  }
}

module.exports = BookingRepository;
