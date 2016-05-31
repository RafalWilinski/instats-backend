'use strict';
const postgres = require('./postgres');
const logger = require('./log');

const check = (req, res) => {
  postgres.select('*')
    .from('config')
    .then((result) => {
      logger.info("postgres pool data", { result });

      return res.json({
        reachable: 'OK',
        port: process.env.PORT || 3000,
        postgres: true
      });

    }).catch((err) => {
    logger.error(err);

    return res.json({
      reachable: 'OK',
      port: process.env.PORT || 3000,
      postgres: false
    });
  });
};

module.exports = check;
