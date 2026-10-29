'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    try {
      const [results] = await queryInterface.sequelize.query('SELECT COUNT(*) as cnt FROM Airports;');
      if (results && results[0] && results[0].cnt > 0) {
        return;
      }
      await queryInterface.bulkInsert('Airports', [
        {
          name: 'Indira Gandhi International Airport',
          address: 'New Delhi, India',
          cityId: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Chhatrapati Shivaji Maharaj International Airport',
          address: 'Mumbai, India',
          cityId: 2,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Kempegowda International Airport',
          address: 'Bengaluru, India',
          cityId: 3,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Rajiv Gandhi International Airport',
          address: 'Hyderabad, India',
          cityId: 4,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Netaji Subhas Chandra Bose International Airport',
          address: 'Kolkata, India',
          cityId: 5,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ], { ignoreDuplicates: true });
    } catch (err) {
      console.log('Airports seeder: already seeded or skipped (' + err.message + ')');
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Airports', null, {});
  }
};
