'use strict';

module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "ALTER TABLE last_updates ENGINE=InnoDB DEFAULT CHARSET=utf8;",
      { type: queryInterface.sequelize.QueryTypes.RAW });

    await queryInterface.sequelize.query(
      "ALTER TABLE articles DROP FOREIGN KEY categoryId_foreign_idx;",
      { type: queryInterface.sequelize.QueryTypes.RAW });
    await queryInterface.sequelize.query(
      "ALTER TABLE articles DROP INDEX categoryId_foreign_idx;",
      { type: queryInterface.sequelize.QueryTypes.RAW });
    await queryInterface.sequelize.query(
      "ALTER TABLE articles ADD INDEX categoryId (categoryId);",
      { type: queryInterface.sequelize.QueryTypes.RAW });
    await queryInterface.sequelize.query(
      "ALTER TABLE articles ADD CONSTRAINT articles_ibfk_1 FOREIGN KEY (categoryId) REFERENCES categories (id) ON DELETE SET NULL ON UPDATE CASCADE;",
      { type: queryInterface.sequelize.QueryTypes.RAW });

    await queryInterface.sequelize.query(
      "ALTER TABLE categories CHANGE COLUMN isActive isActive tinyint(1) DEFAULT '1';",
      { type: queryInterface.sequelize.QueryTypes.RAW });

    await queryInterface.sequelize.query(
      "ALTER TABLE comments CHANGE COLUMN isAutoResolved isAutoResolved tinyint(1) DEFAULT '0';",
      { type: queryInterface.sequelize.QueryTypes.RAW });
    await queryInterface.sequelize.query(
      "ALTER TABLE comments CHANGE COLUMN isHighlighted isHighlighted tinyint(1) DEFAULT '0';",
      { type: queryInterface.sequelize.QueryTypes.RAW });
    await queryInterface.sequelize.query(
      "ALTER TABLE comments CHANGE COLUMN isDeferred isDeferred tinyint(1) DEFAULT '0';",
      { type: queryInterface.sequelize.QueryTypes.RAW });
    await queryInterface.sequelize.query(
      "ALTER TABLE comments CHANGE COLUMN isBatchResolved isBatchResolved tinyint(1) DEFAULT '0';",
        { type: queryInterface.sequelize.QueryTypes.RAW });
    await queryInterface.sequelize.query(
      "ALTER TABLE comments ADD CONSTRAINT comments_ibfk_2 FOREIGN KEY (replyId) REFERENCES comments (id) ON DELETE SET NULL ON UPDATE CASCADE;",
      { type: queryInterface.sequelize.QueryTypes.RAW });

    await queryInterface.sequelize.query(
      "ALTER TABLE comments DROP FOREIGN KEY comments_ibfk_1;",
      { type: queryInterface.sequelize.QueryTypes.RAW });
    await queryInterface.sequelize.query(
      "ALTER TABLE comments DROP INDEX articleId_index;",
      { type: queryInterface.sequelize.QueryTypes.RAW });
    await queryInterface.sequelize.query(
      "ALTER TABLE comments ADD INDEX articleId (articleId);",
      { type: queryInterface.sequelize.QueryTypes.RAW });
    await queryInterface.sequelize.query(
      "ALTER TABLE comments ADD CONSTRAINT comments_ibfk_1 FOREIGN KEY (articleId) REFERENCES articles (id) ON DELETE SET NULL ON UPDATE CASCADE;",
      { type: queryInterface.sequelize.QueryTypes.RAW });
  },

  down: function (queryInterface, Sequelize) {
  }
};
