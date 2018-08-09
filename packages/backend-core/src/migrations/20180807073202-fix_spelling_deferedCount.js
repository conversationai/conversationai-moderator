'use strict';

module.exports = {
  up: async function (queryInterface, Sequelize) {
    const qr = await queryInterface.sequelize.query('SHOW COLUMNS FROM categories where Field = \'deferedCount\';',
      { type: Sequelize.QueryTypes.SELECT});
    if (qr.length > 0) {
      console.log('Renaming deferedCount to deferredCount');
      queryInterface.renameColumn('articles', 'deferedCount', 'deferredCount');
      queryInterface.renameColumn('categories', 'deferedCount', 'deferredCount');
    }
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.renameColumn('articles', 'deferredCount', 'deferedCount');
    queryInterface.renameColumn('categories', 'deferredCount', 'deferedCount');
  }
};
