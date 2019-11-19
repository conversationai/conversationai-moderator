'use strict';

module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'categories',
      'sourceId',
      {
        type: Sequelize.CHAR(255),
        allowNull: true,
      },
    );
  },

  down: async function (queryInterface, Sequelize) {
    await queryInterface.removeColumn('categories', 'sourceId');
  }
};
