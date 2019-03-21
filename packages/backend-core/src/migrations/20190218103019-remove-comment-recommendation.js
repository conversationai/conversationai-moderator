'use strict';

module.exports = {
  up: async function(queryInterface, Sequelize) {
    await queryInterface.dropTable('comment_recommendations');
    await queryInterface.removeColumn(
      'articles',
      'recommendedCount'
    );
    await queryInterface.removeColumn(
      'categories',
      'recommendedCount'
    );
    await queryInterface.removeColumn(
      'comments',
      'recommendedCount'
    );
  },

  down: async function (queryInterface, Sequelize) {
    await queryInterface.createTable('comment_recommendations', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false},
      updatedAt: { type: Sequelize.DATE, allowNull: false},
      sourceId: {
        type: Sequelize.CHAR(255),
        allowNull: true,
      },
      commentId: {
        type: Sequelize.BIGINT.UNSIGNED,
        references: { model: 'comments', key: 'id' },
        onDelete: "cascade",
        onUpdate: "cascade",
      },
      extra: {
        type: Sequelize.JSON,
        allowNull: true,
      },
    }, {charset: 'utf8',});

    await queryInterface.addColumn(
      'articles',
      'recommendedCount',
      {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      }
    );
    await queryInterface.addColumn(
      'categories',
      'recommendedCount',
      {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      }
    );
    await queryInterface.addColumn(
      'comments',
      'recommendedCount',
      {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      }
    );
  }
};
