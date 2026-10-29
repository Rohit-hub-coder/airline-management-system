'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const [results] = await queryInterface.sequelize.query('SELECT COUNT(*) as cnt FROM Airplanes;');
      if (results && results[0] && results[0].cnt > 0) {
        return;
      }
      await queryInterface.bulkInsert('Airplanes', [
        {
          modelNumber: 'A320',
          capacity: 180,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          modelNumber: 'A321',
          capacity: 220,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          modelNumber: 'B737',
          capacity: 189,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          modelNumber: 'B777',
          capacity: 396,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          modelNumber: 'A350',
          capacity: 325,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ], { ignoreDuplicates: true });
    } catch (err) {
      console.log('Airplanes seeder: already seeded or skipped (' + err.message + ')');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Airplanes', null, {});
  }
};
