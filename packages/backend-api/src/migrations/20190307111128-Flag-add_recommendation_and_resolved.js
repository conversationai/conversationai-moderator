'use strict';

module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'comment_flags',
      'isRecommendation',
      {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      }
    );
    await queryInterface.addColumn(
      'comment_flags',
      'resolvedById',
      {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'set null',
      }
    );
    await queryInterface.addColumn(
      'comment_flags',
      'resolvedAt',
      {
        type: Sequelize.DATE,
        allowNull: true,
      }
    );
  },

  down: async function (queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      'comment_flags',
      'isRecommendation'
    );
    await queryInterface.removeColumn(
      'comment_flags',
      'resolvedById'
    );
    await queryInterface.removeColumn(
      'comment_flags',
      'resolvedAt'
    );
  }
};
