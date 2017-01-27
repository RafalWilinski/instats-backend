const dotenv = require('dotenv').config();
const newrelic = require('newrelic');
const trace = require('@risingstack/trace');
const express = require('express');
const postgres = require('./postgres');
const router = require('./router');
const cors = require('cors');
const bodyParser = require('body-parser');
const winston = require('winston');
const logger = require('./log');
const app = express();

const datadogOptions = {
  'response_code': true,
  'tags': ['instats:api']
};

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(require('connect-datadog')(datadogOptions));

app.use('/api', router);
app.get('/healthcheck', require('./healthcheck'));

app.listen(process.env.PORT || 3000, () => {
  logger.info('Server started at ' + (process.env.PORT || 3000) + ' port');
});

module.exports = app;
