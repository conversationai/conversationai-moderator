'use strict';

module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.renameColumn('articles', 'count', 'allCount');
    await queryInterface.renameColumn('categories', 'count', 'allCount');
  },

  down: async function (queryInterface, Sequelize) {
    await queryInterface.renameColumn('articles', 'allCount', 'count');
    await queryInterface.renameColumn('categories', 'allCount', 'count');
  }
};
