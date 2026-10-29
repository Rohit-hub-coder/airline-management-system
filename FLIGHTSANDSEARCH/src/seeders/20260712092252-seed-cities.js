'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const [results] = await queryInterface.sequelize.query('SELECT COUNT(*) as cnt FROM Cities;');
      if (results && results[0] && results[0].cnt > 0) {
        return;
      }
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
      ], { ignoreDuplicates: true });
    } catch (err) {
      console.log('Cities seeder: already seeded or skipped (' + err.message + ')');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Cities', null, {});
  }
};
