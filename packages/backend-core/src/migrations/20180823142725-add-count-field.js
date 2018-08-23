'use strict';

module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'categories',
      'count',
      {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
    );
    await queryInterface.addColumn(
      'articles',
      'count',
      {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
    );
  },

  down: async function (queryInterface, Sequelize) {
    await queryInterface.removeColumn('categories', 'count');
    await queryInterface.removeColumn('articles', 'count');
  }
};
