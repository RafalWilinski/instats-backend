'use strict';
const axios = require('axios');
const crypto = require('crypto');
const Promise = require('bluebird');
const postgres = require('./postgres');
const config = require('./config.js');
const logger = require('./log');
const metrics = require('./metrics');
const request = require('request');
const helpers = require('./helpers');

const generateSignature = helpers.generateSignature;
const fetchPaginatedData = helpers.fetchPaginatedData;
const jsonToParams = helpers.jsonToParams;

const defaultFetchCount = config('default_fetch_count');

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
        metrics.fetchStatsSuccess.inc();
        return resolve(payload.data);
      } else {
        logger.warn('[fetchStats] Instagram API returned non-200 status code', {
          access_token,
          sig,
          status: payload.status,
          data: payload.data,
          headers: payload.headers
        });

        metrics.fetchStatsFail.inc();
        return reject();
      }
    }).catch((error) => {
      logger.error('Failed to fetch instagram user stats', {
        status: error.status,
        sig,
        access_token
      });

      metrics.fetchStatsFail.inc();
      return reject();
    });
});

const exchangeToken = (code) => new Promise((resolve, reject) => {
  request.post({
    url: 'https://api.instagram.com/oauth/access_token/',
    form: {
      client_id: config('instagram_client_id'),
      client_secret: config('instagram_client_secret'),
      grant_type: 'authorization_code',
      redirect_uri: config('instagram_callback_url'),
      code
    }
  }, function (error, response, body) {
    if (error) {
        logger.error('Failed to call instagram api', {
          error,
          url: 'https://api.instagram.com/oauth/access_token/',
          code
        });

        metrics.exchangeFail.inc();
        return reject(error);
    } else {
      logger.info('Instagram info fetched', {
        body: JSON.parse(body)
      });

      metrics.exchangeSuccess.inc();
      return resolve(JSON.parse(body));
    }
  });
});

module.exports = {
  fetchFollowers,
  fetchFollowings,
  fetchProfile,
  fetchStats,
  fetchPhotos,
  exchangeToken,
};
