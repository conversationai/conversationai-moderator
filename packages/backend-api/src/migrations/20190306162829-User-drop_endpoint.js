'use strict';

module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      'users',
      'endpoint'
    );
  },

  down: async function (queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'users',
      'endpoint',
      {
        type: Sequelize.CHAR(255),
        allowNull: true,
      }
    );
  }
};
