'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'roleId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Roles',
        key: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'roleId');
  }
};