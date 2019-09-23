'use strict';

module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      'comments',
      'flagsCount'
    );
  },

  down: async function (queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'comments',
      'flagsCount',
      {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      }
    );
  }
};
