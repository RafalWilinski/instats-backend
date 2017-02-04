const dotenv = require('dotenv').config();
const newrelic = require('newrelic');
const express = require('express');
const postgres = require('./postgres');
const router = require('./router');
const cors = require('cors');
const bodyParser = require('body-parser');
const winston = require('winston');
const logger = require('./log');
const RateLimit = require('express-rate-limit');
const app = express();

const datadogOptions = {
  'response_code': true,
  'tags': ['instats:api']
};

app.enable('trust proxy');

const limiter = new RateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  delayMs: 0,
});

app.use(limiter);
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
