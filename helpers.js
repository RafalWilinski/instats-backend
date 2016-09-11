'use strict';
const axios = require('axios');
const crypto = require('crypto');
const metrics = require('./metrics');
const logger = require('./log');
const config = require('./config.js');
const UserController = require('./controllers/User');

const generateSignature = (endpoint, params) => {
  var query = endpoint;
  const ordered = {};

  Object.keys(params).sort().forEach((key) => {
    ordered[key] = params[key];
  });

  for (var param in ordered) {
    query += '|' + param + '=' + ordered[param];
  }
  return crypto.createHmac("sha256", config('instagram_client_secret')).update(query).digest("hex");
};

const getJsonFromUrlParams = (query) => {
  const result = {};
  query = query.split('?')[1];
  query.split('&').forEach((part) => {
    var item = part.split("=");
    result[item[0]] = decodeURIComponent(item[1]);
  });

  return result;
};

const modifyPaginationUrl = (fullUrl, apiPath) => {
  const urlParamsAsJson = getJsonFromUrlParams(fullUrl);
  delete urlParamsAsJson['sig'];

  const signature = generateSignature(apiPath, urlParamsAsJson);
  const newUrl = fullUrl.split('sig=')[0] + 'sig=' + signature + '&cursor=' + urlParamsAsJson.cursor;

  logger.info('Pagination url generated', { fullUrl, newUrl, signature });
  return newUrl;
};

const jsonToParams = (data) => Object.keys(data).map((k) => {
  return encodeURIComponent(k) + '=' + encodeURIComponent(data[k])
}).join('&');

const fetchPaginatedData = (fullUrl, path, accumulator, dbUserId) => new Promise((resolve, reject) => {
  return axios.get(fullUrl)
    .then((payload) => {
      if (payload.data.meta.code === 200) {

        if (payload.data.hasOwnProperty('pagination') &&
          payload.data.pagination.hasOwnProperty('next_url')) {

          const paginationUrl = modifyPaginationUrl(payload.data.pagination.next_url, path);
          logger.info('Fetching paginated data', {
            paginationUrl,
            fullUrl,
            path
          });

          metrics.paginationSuccess.inc();
          return resolve(fetchPaginatedData(paginationUrl, path, accumulator.concat(payload.data.data), dbUserId));

        } else {
          const array = accumulator.concat(payload.data.data);
          logger.info('Pagination end reached', {
            array,
            path,
            dbUserId
          });

          metrics.paginationSuccess.inc();
          return resolve(array);
        }

      } else {
        logger.warn('Instagram API returned non-200 status code (paginated)', {
          fullUrl,
          path,
          status: payload.status,
          data: payload.data,
          headers: payload.headers
        });

        if (payload.meta.error_type === 'OAuthAccessTokenException') {
          logger.info('Invalidating user', {
            id: dbUserId
          });

          metrics.oauthExceptions.inc();
          UserController.invalidateAccessToken(dbUserId);
        }

        metrics.paginationFail.inc();
        return reject();
      }
    })
    .catch((error) => {
      console.log(error);
      logger.warn('Instagram API error (paginated)', {
        fullUrl,
        path,
        dbUserId,
        error: error.data
      });

      metrics.paginationFail.inc();
      return reject(error.data);
    });
});

module.exports = {
  fetchPaginatedData,
  jsonToParams,
  getJsonFromUrlParams,
  generateSignature
};
