const axios = require('axios');
const crypto = require('crypto');
const config = require('./config.json');
const logger = require('./log');
const Promise = require('bluebird');

const defaultFetchCount = 1000;

const http = axios({
  baseURL: config.instagram_base_url
});

const generateSignature = (endpoint, params) => {
  let query = endpoint;
  const ordered = {};

  Object.keys(params).sort().forEach((key) => {
    ordered[key] = params[key];
  });

  for (let param in ordered) {
    query += '|' + param + '=' + ordered[param];
  }
  return crypto.createHmac("sha256", config.instagram_client_secret).update(query).digest("hex");
};

const fetchFollowers = (id, instagramId, access_token) => new Promise((resolve, reject) => {
  const path = `/users/${instagramId}/followed-by`;
  const sig = generateSignature(path, {
    access_token,
    count: defaultFetchCount
  });

  http.get('/users/self/', {
    params: {
      access_token,
      sig,
      count: defaultFetchCount
    }
  }).then((payload) => {
    logger.info('fetchFollowers succeeded', {
      access_token,
      sig,
      instagramId,
      id,
      status: payload.status,
      data: payload.data,
      headers: payload.headers
    });

    if (payload.data.meta.code === 200) {

    } else {
      logger.warn('[fetchFollowers] Instagram API returned non-200 status code', {
        access_token,
        sig,
        status: payload.status,
        data: payload.data,
        headers: payload.headers
      });
      return reject();
    }

  }).catch((error) => {
    logger.error('Failed to fetch instagram followers', {
      error,
      sig,
      access_token,
      instagramId
    });
    return reject(error);
  });
});

const fetchFollowings = (id, instagramId, accessToken) => new Promise((resolve, reject) => {

});

const fetchProfile = (instagramId, accessToken) => new Promise((resolve, reject) => {

});

const fetchStats = (access_token) => new Promise((resolve, reject) => {
  const sig = generateSignature('/users/self', {
    access_token
  });

  http.get('/users/self/', {
    params: {
      access_token,
      sig
    }
  }).then((payload) => {
    logger.info('Fetch user stats succeeded', {
      access_token,
      sig,
      status: payload.status,
      data: payload.data,
      headers: payload.headers
    });

    if (payload.data.meta.code === 200) {
      return resolve(payload.data.data);
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

module.exports = {
  fetchFollowers,
  fetchFollowings,
  fetchProfile,
  fetchStats
};