'use strict';

module.exports = {
  up: async function(queryInterface, Sequelize) {
    await queryInterface.changeColumn(
      'moderator_assignments',
      'userId',
      {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      }
    );
    await queryInterface.changeColumn(
      'moderator_assignments',
      'articleId',
      {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
      }
    );
    await queryInterface.changeColumn(
      'moderation_rules',
      'lowerThreshold',
      {
        type: Sequelize.FLOAT(2).UNSIGNED,
        allowNull: false,
      }
    );
    await queryInterface.changeColumn(
      'moderation_rules',
      'upperThreshold',
      {
        type: Sequelize.FLOAT(2).UNSIGNED,
        allowNull: false,
      }
    );
    await queryInterface.addColumn(
      'last_updates',
      'lastUpdate',
      {
        type: Sequelize.INTEGER.UNSIGNED,
      }
    );
    await queryInterface.removeColumn('last_updates', 'counter');
    await queryInterface.sequelize.query('ALTER TABLE moderation_rules DROP INDEX createdBy');
    await queryInterface.sequelize.query('ALTER TABLE moderation_rules DROP FOREIGN KEY moderation_rules_tagId_foreign_idx');
    await queryInterface.sequelize.query('ALTER TABLE moderation_rules DROP FOREIGN KEY moderation_rules_ibfk_3');
    await queryInterface.sequelize.query('ALTER TABLE moderation_rules DROP INDEX moderation_rules_tagId_foreign_idx');
    await queryInterface.sequelize.query('ALTER TABLE moderation_rules ADD INDEX tagId (tagId)');
    await queryInterface.sequelize.query('ALTER TABLE moderation_rules ADD CONSTRAINT moderation_rules_ibfk_2 FOREIGN KEY (categoryId) REFERENCES categories (id) ON DELETE CASCADE ON UPDATE CASCADE');
    await queryInterface.sequelize.query('ALTER TABLE moderation_rules ADD CONSTRAINT moderation_rules_ibfk_1 FOREIGN KEY (tagId) REFERENCES tags (id) ON DELETE CASCADE ON UPDATE CASCADE');
  },

  down: async function(queryInterface, Sequelize) {
    await queryInterface.changeColumn(
      'moderator_assignments',
      'userId',
      {
        type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
      }
    );
    await queryInterface.changeColumn(
      'moderator_assignments',
      'articleId',
      {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      }
    );
    await queryInterface.changeColumn(
      'moderation_rules',
      'lowerThreshold',
      {
        type: Sequelize.FLOAT(2).UNSIGNED,
        allowNull: true,
      }
    );
    await queryInterface.changeColumn(
      'moderation_rules',
      'upperThreshold',
      {
        type: Sequelize.FLOAT(2).UNSIGNED,
        allowNull: true,
      }
    );
    await queryInterface.addColumn(
      'last_updates',
      'counter',
      {
        type: Sequelize.INTEGER.UNSIGNED,
      }
    );
    await queryInterface.removeColumn('last_updates', 'lastUpdate');
  }
};
