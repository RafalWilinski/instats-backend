const config = require('./config.js');
const winston = require('winston');

const postgres = require('knex')({
  client: 'pg',
  connection: config('postgres_connection_url'),
  searchPath: 'knex,public',
  debug: config('knex_debug')
});

module.exports = postgres;