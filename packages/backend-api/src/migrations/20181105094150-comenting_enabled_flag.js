'use strict';

module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'articles',
      'isCommentingEnabled',
      {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    );
    // TODO: Change column doesn't work in current sequelize.  Need to change by hand:-(
    await queryInterface.changeColumn(
      'articles',
      'isAutoModerated',
      {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    );
    await queryInterface.removeColumn('articles', 'disableRules');
  },

  down: async function (queryInterface, Sequelize) {
    await queryInterface.removeColumn('articles', 'isCommentingEnabled');
    await queryInterface.changeColumn(
      'articles',
      'isAutoModerated',
      {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: true,
      },
    );
    await queryInterface.addColumn(
      'articles',
      'disableRules',
      {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
    );
  }
};
