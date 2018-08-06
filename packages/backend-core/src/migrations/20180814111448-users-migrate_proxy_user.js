'use strict';

module.exports = {
  up: async function (queryInterface, Sequelize) {
    // We would like to use the user model when doing the migration.  But we can't because sequelize-cli
    // is using its own Sequelize object, so knows nothing of our models.  (Not a good design:-P)
    // So bash away at the SQL directly
    const users = await queryInterface.sequelize.query('SELECT id, endpoint FROM users WHERE `group` = "service" AND endpoint IS NOT NULL;',
                                                       { type: Sequelize.QueryTypes.SELECT });
    for (const u of users) {
      const extra = {
        endpoint: u.endpoint,
        serviceType: 'moderator',
        endpointType: 'perspective-proxy'
      };

      const res = await queryInterface.sequelize.query('update users set extra = \''+JSON.stringify(extra)+'\' where id = "'+u.id+'";',
                                                       { type: Sequelize.QueryTypes.UPDATE });
      console.log(res);
    }
  },

  down: async function (queryInterface, Sequelize) {
    const users = await queryInterface.sequelize.query('SELECT id, extra FROM users WHERE `group` = "service" AND extra IS NOT NULL;',
                                                       { type: Sequelize.QueryTypes.SELECT });
    for (const u of users) {
      const extra = JSON.parse(u.extra);
      if (extra.serviceType === 'moderator' && extra.endpointType === 'perspective-proxy') {
        const res = await queryInterface.sequelize.query('update users set endpoint = \'' + extra.endpoint + '\', extra = NULL where id = "' + u.id + '";',
          {type: Sequelize.QueryTypes.UPDATE});
        console.log(res);
      }
    }
  }
};
