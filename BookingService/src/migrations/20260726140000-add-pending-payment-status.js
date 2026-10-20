'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query("ALTER TABLE bookings MODIFY COLUMN status ENUM('In Process','Pending Payment','Booked','Cancelled') NOT NULL DEFAULT 'In Process'");
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query("ALTER TABLE bookings MODIFY COLUMN status ENUM('In Process','Booked','Cancelled') NOT NULL DEFAULT 'In Process'");
  }
};
