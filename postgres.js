const config = require('./config.js');
const winston = require('winston');

const postgres = require('knex')({
  client: 'pg',
  connection: config('postgres_connection_url'),
  searchPath: 'knex,public',
  pool: {
    min: 2,
    max: 5
  },
  debug: config.knexDebug
});

module.exports = postgres;