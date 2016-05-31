'use strict';
const dotenv = require('dotenv').config();
require('@risingstack/trace');
const newrelic = require('newrelic');
const express = require('express');
const postgres = require('./postgres');
const crons = require('./cron');
const router = require('./router');
const cors = require('cors');
const bodyParser = require('body-parser');
const winston = require('winston');
const logger = require('./log');
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/api', router);
app.get('/healthcheck', require('./healthcheck'));

crons.startCrons(postgres);

app.listen(process.env.PORT || 3000, () => {
  logger.info('Server started at ' + (process.env.PORT || 3000) + ' port');
});

module.exports = app;
