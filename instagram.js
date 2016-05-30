const axios = require('axios');
const crypto = require('crypto');
const Promise = require('bluebird');
const postgres = require('./postgres');
const config = require('./config.js');
const logger = require('./log');

const defaultFetchCount = config('default_fetch_count');

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

            return resolve(fetchPaginatedData(paginationUrl, path, [...accumulator, ...payload.data.data], dbUserId));

          } else {
            const array = [...accumulator, ...payload.data.data];
            logger.info('Pagination end reached', {
              array,
              path,
              dbUserId
            });

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

          return reject();
        }
      })
      .catch((error) => {
        logger.warn('Instagram API error (paginated)', {
          error,
          fullUrl,
          path,
          dbUserId
        });
        return reject();
      });
});

const fetchFollowers = (id, instagramId, access_token) => new Promise((resolve, reject) => {
  const path = `/users/${instagramId}/followed-by`;
  const sig = generateSignature(`/users/${instagramId}/followed-by`, {
    access_token,
    count: defaultFetchCount
  });

  const fullUrl = `${config('instagram_base_url')}${path}?${jsonToParams({
    access_token,
    count: defaultFetchCount,
    sig
  })}`;

  return fetchPaginatedData(fullUrl, path, [], id).then((followersArray) => {
    return resolve(followersArray);
  }).catch((err) => {
    logger.error('failed to fetch followers', {
      id, instagramId, fullUrl, path, err
    });
    return reject();
  });
});

const fetchFollowings = (id, instagramId, access_token) => new Promise((resolve, reject) => {
  const path = `/users/${instagramId}/follows`;
  const sig = generateSignature(`/users/${instagramId}/follows`, {
    access_token,
    count: defaultFetchCount
  });

  const fullUrl = `${config('instagram_base_url')}${path}?${jsonToParams({
    access_token,
    count: defaultFetchCount,
    sig
  })}`;

  fetchPaginatedData(fullUrl, path, [], id).then((followsArray) => {
    return resolve(followsArray);
  }).catch((err) => {
    logger.error('failed to fetch followers', {
      id, instagramId, fullUrl, path, err
    });
    return reject();
  });
});

const fetchProfile = (instagramId, access_token) => new Promise((resolve, reject) => {
  const sig = generateSignature(`/users/${instagramId}`, {
    access_token
  });
  const fullUrl = `${config('instagram_base_url')}/users/${instagramId}?${jsonToParams({
    access_token,
    sig
  })}`;

  return axios.get(fullUrl)
      .then((payload) => {
        logger.info('Fetch user stats succeeded', {
          access_token,
          sig,
          status: payload.status,
          data: payload.data
        });

        if (payload.data.meta.code === 200) {
          return resolve(payload.data);
        } else {
          logger.warn('[fetchProfile] Instagram API returned non-200 status code', {
            access_token,
            sig,
            status: payload.status,
            data: payload.data,
            headers: payload.headers
          });
          return reject();
        }
      })
      .catch((error) => {
        logger.error('Failed to fetch instagram user', {
          error,
          instagramId,
          sig,
          access_token
        });
        return reject();
      });
});

const fetchStats = (access_token) => new Promise((resolve, reject) => {
  const sig = generateSignature('/users/self', {
    access_token
  });
  const fullUrl = `${config('instagram_base_url')}/users/self/?${jsonToParams({
    access_token,
    sig
  })}`;

  return axios.get(fullUrl)
      .then((payload) => {
        logger.info('Fetch user stats succeeded', {
          access_token,
          sig,
          status: payload.status,
          data: payload.data,
          headers: payload.headers
        });

        if (payload.data.meta.code === 200) {
          return resolve(payload.data);
        } else {
          logger.warn('[fetchStats] Instagram API returned non-200 status code', {
            access_token,
            sig,
            status: payload.status,
            data: payload.data,
            headers: payload.headers
          });
          return reject();
        }
      }).catch((error) => {
        logger.error('Failed to fetch instagram user stats', {
          error,
          sig,
          access_token
        });
        return reject();
      });
});

const exchangeToken = (code) => new Promise((resolve, reject) => {
  return axios.post(`${config('instagram_base_url')}/oauth/access_token/`)
      .send({
        client_id: config('instagram_client_id'),
        client_secret: config('instagram_client_secret'),
        grant_type: 'authorization_code',
        redirect_url: config('instagram_callback_url'),
        code
      })
      .then((payload) => {
        return resolve(payload.body);
      })
      .catch((error) => {
        logger.error('Failed to exchange token', {
          error,
          code
        });

        return reject();
      });
});

module.exports = {
  fetchFollowers,
  fetchFollowings,
  fetchProfile,
  fetchStats,
  exchangeToken,
  generateSignature,
  getJsonFromUrlParams,
  jsonToParams
};
