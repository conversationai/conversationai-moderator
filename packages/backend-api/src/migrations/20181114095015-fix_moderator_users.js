'use strict';

const {
  User,
  USER_GROUP_GENERAL,
  USER_GROUP_ADMIN,
  USER_GROUP_SERVICE,
  USER_GROUP_MODERATOR,
  USER_GROUP_YOUTUBE} = require('../../dist/models/user');

module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'group', {
      type: Sequelize.ENUM(USER_GROUP_GENERAL, USER_GROUP_ADMIN, USER_GROUP_SERVICE, USER_GROUP_MODERATOR, USER_GROUP_YOUTUBE),
      allowNull: false,
    });

    const users = await queryInterface.sequelize.query('SELECT id, extra FROM users WHERE `group` = "service" AND extra IS NOT NULL;',
      { type: Sequelize.QueryTypes.SELECT });

    for (const u of users) {
      const extra = JSON.parse(u.extra);
      delete extra.serviceType;
      await queryInterface.sequelize.query('update users set `group` = "moderator", extra = \''+JSON.stringify(extra)+'\' where id = "'+u.id+'";',
        { type: Sequelize.QueryTypes.UPDATE });
    }
  },

  down: async function (queryInterface, Sequelize) {
    const users = await queryInterface.sequelize.query('SELECT id, extra FROM users WHERE `group` = "moderator" AND extra IS NOT NULL;',
      { type: Sequelize.QueryTypes.SELECT });

    for (const u of users) {
      const extra = JSON.parse(u.extra);
      extra.serviceType = 'moderator';
      await queryInterface.sequelize.query('update users set `group` = "service", extra = \''+JSON.stringify(extra)+'\' where id = "'+u.id+'";',
        { type: Sequelize.QueryTypes.UPDATE });
    }

    await queryInterface.changeColumn('users', 'group', {
      type: Sequelize.ENUM(USER_GROUP_GENERAL, USER_GROUP_ADMIN, USER_GROUP_SERVICE, USER_GROUP_YOUTUBE),
      allowNull: false,
    });
  }
};
