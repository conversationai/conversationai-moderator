'use strict';

module.exports = {
  up: async function (queryInterface, Sequelize) {
    const qr = await queryInterface.sequelize.query('SELECT * FROM users WHERE users.group = \'service\';',
      { type: Sequelize.QueryTypes.SELECT});
    for (const user of qr) {
      if (!user.extra) {
        console.log(`skipping ${user.name}`);
        continue;
      }
      const extra = JSON.parse(user.extra);
      if (extra.serviceType !== 'moderator') {
        console.log(`skipping non moderator service user ${user.name}`);
      }

      if (extra.endpointType === 'perspective-api') {
        console.log(`Updating API service user ${user.name}`);
        extra.apiKey = process.env.GOOGLE_CLOUD_API_KEY;
        extra.attributes = {
            ATTACK_ON_AUTHOR: {},
            ATTACK_ON_COMMENTER: {},
            INCOHERENT: {},
            INFLAMMATORY: {},
            OBSCENE: {},
            OFF_TOPIC: {},
            SPAM: {} ,
            UNSUBSTANTIAL: {},
            LIKELY_TO_REJECT: {},
            TOXICITY: {},
          };
        extra.userAgent = 'OsmodAssistantV0';
      }
      else if (extra.endpointType === 'perspective-proxy') {
        console.log(`Updating proxy service user ${user.name}`);
        extra.apiKey = process.env.GOOGLE_SCORE_AUTH;
      }
      else {
        console.log(`Unknown endpoint type ${extra.endpointType} for user ${user.name}`);
        continue;
      }

      const newextra = JSON.stringify(extra);
      const ur = await queryInterface.sequelize.query(`UPDATE users SET extra = \'${newextra}\' WHERE id = ${user.id};`)
    }
  },

  down: function (queryInterface, Sequelize) {
  }
};
