'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('last_updates', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
      counter: {
        type: Sequelize.INTEGER.UNSIGNED,
      },
    });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('last_updates');
  }
};
