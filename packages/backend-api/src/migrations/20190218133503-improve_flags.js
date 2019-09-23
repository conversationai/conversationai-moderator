'use strict';

module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'comment_flags',
      'label',
      {
        type: Sequelize.CHAR(80),
        allowNull: false,
      }
    );
    await queryInterface.addColumn(
      'comment_flags',
      'detail',
      {
        type: Sequelize.STRING,
        allowNull: true,
      }
    );
    await queryInterface.addColumn(
      'comment_flags',
      'authorSourceId',
      {
        type: Sequelize.CHAR(255),
        allowNull: true,
      }
    );
    await queryInterface.addColumn(
      'comment_flags',
      'isResolved',
      {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      }
    );

    await queryInterface.removeColumn(
      'comments',
      'flaggedCount'
    );
    await queryInterface.addColumn(
      'comments',
      'flagsCount',
      {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      }
    );
    await queryInterface.addColumn(
      'comments',
      'unresolvedFlagsCount',
      {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      }
    );
    await queryInterface.addColumn(
      'comments',
      'flagsSummary',
      {
        type: Sequelize.JSON,
        allowNull: true,
      }
    );
  },

  down: async function (queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      'comments',
      'flagsCount'
    );
    await queryInterface.removeColumn(
      'comments',
      'unresolvedFlagsCount'
    );
    await queryInterface.removeColumn(
      'comments',
      'flagsSummary'
    );
    await queryInterface.addColumn(
      'comments',
      'flaggedCount',
      {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      }
    );

    await queryInterface.removeColumn(
      'comment_flags',
      'label'
    );
    await queryInterface.removeColumn(
      'comment_flags',
      'detail'
    );
    await queryInterface.removeColumn(
      'comment_flags',
      'authorSourceId'
    );
    await queryInterface.removeColumn(
      'comment_flags',
      'isResolved'
    );
  }
};
