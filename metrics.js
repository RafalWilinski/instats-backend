const metrics = require('metrics');

const server = new metrics.Server(1337);

// Database metrics
const spSuccess = new metrics.Counter;
const spDuplicate = new metrics.Counter;
const spFail = new metrics.Counter;
const arraySuccess = new metrics.Counter;
const arrayFail = new metrics.Counter;
const deleteSuccess = new metrics.Counter;
const deleteFail = new metrics.Counter;

server.addMetric('db.insert.small_profiles.success', spSuccess);
server.addMetric('db.insert.small_profiles.fail', spFail);
server.addMetric('db.insert.small_profiles.duplicate', spDuplicate);
server.addMetric('db.insert.arrays.success', arraySuccess);
server.addMetric('db.insert.arrays.fail', arrayFail);
server.addMetric('db.insert.delete.success', deleteSuccess);
server.addMetric('db.insert.delete.fail', deleteFail);

// Instagram API Metrics
const paginationFail = new metrics.Counter;
const paginationSuccess = new metrics.Counter;
const followersSuccess = new metrics.Counter;
const followersFail = new metrics.Counter;
const followsSuccess = new metrics.Counter;
const followsFail = new metrics.Counter;
const oauthExceptions = new metrics.Counter;
const fetchStatsSuccess = new metrics.Counter;
const fetchStatsFail = new metrics.Counter;
const fetchUserSuccess = new metrics.Counter;
const fetchUserFail = new metrics.Counter;
const exchangeSuccess = new metrics.Counter;
const exchangeFail = new metrics.Counter;

server.addMetric('api.instagram.pagination.success', paginationSuccess);
server.addMetric('api.instagram.pagination.fail', paginationFail);
server.addMetric('api.instagram.followers.success', followersSuccess);
server.addMetric('api.instagram.followers.fail', followersFail);
server.addMetric('api.instagram.follows.success', followsSuccess);
server.addMetric('api.instagram.follows.fail', followsFail);
server.addMetric('api.instagram.exceptions.token_invalid', oauthExceptions);
server.addMetric('api.instagram.stats.success', fetchStatsSuccess);
server.addMetric('api.instagram.stats.fail', fetchStatsFail);
server.addMetric('api.instagram.users.success', fetchUserSuccess);
server.addMetric('api.instagram.users.fail', fetchUserFail);
server.addMetric('api.instagram.exchange.success', exchangeSuccess);
server.addMetric('api.instagram.exchange.fail', exchangeFail);

// Instats API Metrics
const apiExchangeSuccess = new metrics.Counter;
const apiExchangeFail = new metrics.Counter;

server.addMetric('api.instats.exchange.success', apiExchangeSuccess);
server.addMetric('api.instats.exchange.fail', apiExchangeFail);


module.exports = {
  server,
  spSuccess,
  spFail,
  spDuplicate,
  arraySuccess,
  arrayFail,
  deleteSuccess,
  deleteFail,
  paginationFail,
  paginationSuccess,
  followersSuccess,
  followersFail,
  followsSuccess,
  followsFail,
  oauthExceptions,
  fetchStatsSuccess,
  fetchStatsFail,
  fetchUserSuccess,
  fetchUserFail,
  exchangeSuccess,
  exchangeFail,
  apiExchangeSuccess,
  apiExchangeFail
};
