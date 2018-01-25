'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.renameColumn('articles', 'deferedCount', 'deferredCount');
    queryInterface.renameColumn('categories', 'deferedCount', 'deferredCount');
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.renameColumn('articles', 'deferredCount', 'deferedCount');
    queryInterface.renameColumn('categories', 'deferredCount', 'deferedCount');
  }
};
