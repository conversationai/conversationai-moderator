'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.addColumn(
      'categories',
      'sourceId',
      {
        type: Sequelize.CHAR(255),
        allowNull: true,
      },
    );
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.removeColumn('categories', 'sourceId');
  }
};
