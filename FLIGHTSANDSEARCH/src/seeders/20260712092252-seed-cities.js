'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Cities', [
      {
        name: 'Mumbai',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'New Delhi',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Kolkata',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Bengaluru',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Chennai',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Prayagraj',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Ahmedabad',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Pune',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Patna',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Varanasi',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Cities', null, {});
  }
};