const config = require('./config.json');
const winston = require('winston');

const postgres = require('knex')({
  client: 'pg',
  connection: config.postgresConnectionUrl || process.env.PG_CONNECTION_STRING,
  searchPath: 'knex,public',
  pool: {
    min: 2,
    max: 5
  },
  debug: config.knexDebug
});

module.exports = postgres;