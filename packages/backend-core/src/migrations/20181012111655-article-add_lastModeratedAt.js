'use strict';

module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'articles',
      'lastModeratedAt',
      {
        type: Sequelize.DATE,
        allowNull: true,
      },
    );
  },

  down: async function (queryInterface, Sequelize) {
    await queryInterface.removeColumn('articles', 'lastModeratedAt');
  }
};
