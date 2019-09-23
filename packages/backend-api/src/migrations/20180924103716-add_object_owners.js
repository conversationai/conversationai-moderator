'use strict';

module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'categories',
      'ownerId',
      {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        // references: { model: 'users', key: 'id' }
      },
    );
    await queryInterface.addColumn(
      'articles',
      'ownerId',
      {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        // references: { model: 'users', key: 'id' }
      },
    );
    await queryInterface.addColumn(
      'comments',
      'ownerId',
      {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        // references: { model: 'users', key: 'id' }
      },
    );

    // TODO: Sequelize is not setting up the appropriate foreign key constraints.  Maybe fixed in later sequelize?
    // Add them by hand
    await queryInterface.sequelize.query(
      "ALTER TABLE categories ADD INDEX ownerId (ownerId); ",
      { type: queryInterface.sequelize.QueryTypes.RAW }
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE categories ADD CONSTRAINT categories_ibfk_2 FOREIGN KEY (ownerId) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE; ",
      { type: queryInterface.sequelize.QueryTypes.RAW }
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE articles ADD INDEX ownerId (ownerId);",
      { type: queryInterface.sequelize.QueryTypes.RAW }
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE articles ADD CONSTRAINT articles_ibfk_2 FOREIGN KEY (ownerId) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE;",
      { type: queryInterface.sequelize.QueryTypes.RAW }
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE comments ADD INDEX ownerId (ownerId);",
      { type: queryInterface.sequelize.QueryTypes.RAW }
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE comments ADD CONSTRAINT comments_ibfk_3 FOREIGN KEY (ownerId) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE;",
      { type: queryInterface.sequelize.QueryTypes.RAW }
    );
  },

  down: async function (queryInterface, Sequelize) {
    await queryInterface.removeColumn('categories', 'ownerId');
    await queryInterface.removeColumn('articles', 'ownerId');
    await queryInterface.removeColumn('comments', 'ownerId');
  }
};
