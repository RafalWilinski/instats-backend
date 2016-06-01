'use strict';
const instagram = require('../instagram');
const postgres = require('../postgres');
const logger = require('../log');
const metrics = require('../metrics');

const getFollowers = (req, res) => {
  if (req.query.id == null) {
    res.status(400);
    return res.json({
      error: 'id is missing'
    });
  } else {
    postgres('followers_arrays')
      .select('*')
      .where({
        user_ref: req.query.id
      })
      .orderBy('timestamp', 'asc')
      .then((arrays) => {
        res.status(200);
        return res.json({
          result: arrays
        });
      })
      .catch((error) => {
        logger.error('Error while querying followers_arrays', {
          id: req.query.id,
          error
        });
        res.status(400);
        return res.json({
          error: 'error running query'
        });
      });
  }
};

const getFollowings = (req, res) => {
  if (req.query.id == null) {
    metrics.apiExchangeFail.inc();
    res.status(400);
    return res.json({
      error: 'id is missing'
    });
  } else {
    postgres('followings_arrays')
      .select('*')
      .where({
        user_ref: req.query.id
      })
      .orderBy('timestamp', 'asc')
      .then((arrays) => {
        metrics.apiExchangeSuccess.inc();
        res.status(200);
        return res.json({
          result: arrays
        });
      })
      .catch((error) => {
        logger.error('Error while querying followings_arrays', {
          id: req.query.id,
          error
        });

        metrics.apiExchangeFail.inc();
        res.status(400);
        return res.json({
          error: 'error running query'
        });
      });
  }
};

const getStats = (req, res) => {
  if (req.query.access_token == null) {
    res.status(400);
    return res.json({
      error: 'access_token not provided'
    });
  } else {
    instagram.fetchStats(req.query.access_token)
      .then((instagramData) => {
        console.log(instagramData);
        res.status(200);
        return res.json(instagramData);
      })
      .catch(() => {
        logger.error('Error while getStats request', {
          access_token: req.query.access_token
        });

        res.status(400);
        return res.json({
          error: 'failed to fetch stats from instagram'
        });
      });
  }
};

const getUserInfo = (req, res) => {
  if (req.query.id == null || req.query.access_token == null) {
    res.status(400);
    return res.json({
      error: 'id or access_token not provided'
    });
  } else {
    postgres('small_profiles')
      .select('*')
      .where({
        instagram_id: req.query.id
      })
      .limit(1)
      .then((users) => {
        if (users) {
          res.status(200);
          return res.json({
            response: { meta: { code: 200 } },
            data: {
              username: users[0].name,
              profile_picture: users[0].picture_url
            }
          });
        } else {
          logger.warn('User not found in small profiles!');

          res.status(404);
          return res.json({
            error: 'user not found'
          });
        }
      })
      .catch((err) => {
        logger.error('Error while executing getUserInfo query', {
          err,
          id: req.query.id,
          access_token: req.query.access_token
        });

        res.status(404);
        return res.json({
          error: 'user not found'
        });
      });
  }
};

const exchangeCodeForToken = (req, res) => {
  if (req.body.code == null) {
    res.status(403);
    return res.json({
      error: 'Exchange code is missing'
    });
  }

  instagram.exchangeToken(req.body.code)
    .then((body) => {
      isUserRegistered(body.user.id)
        .then((user) => {
          updateAccessToken(body, user)
            .then((data) => {
              res.status(200);
              return res.json({
                data: data[0]
              });
            })
            .catch(() => {
              res.status(403);
              return res.json({
                error: 'Failed to exchange token'
              });
            });
        })
        .catch(() => {
          registerUser(body)
            .then((data) => {
              res.status(200);
              return res.json({
                data: data[0]
              });
            })
            .catch(() => {
              res.status(400);
              return res.json({
                error: 'failed to register user'
              })
            });
        });
    })
    .catch(() => {
      res.status(403);
      return res.json({
        error: 'Failed to exchange token'
      });
    });
};

const registerUser = (payload) => new Promise((resolve, reject) => {
  postgres('users')
    .insert({
      instagram_id: payload.user.id,
      instagram_name: payload.user.username,
      access_token: payload.access_token,
      profile_picture: payload.user.profile_picture,
      last_login: new Date().toUTCString(),
      access_token_validity: true,
      is_premium: false,
      register_date: new Date().toUTCString()
    })
    .then((data) => {
      logger.info('New user registered', {
        result: data,
        payload
      });
      return resolve(data);
    })
    .catch((error) => {
      logger.error('Error while registering new user', {
        error,
        payload
      });
      return reject(error);
    });
});

const updateAccessToken = (body) => new Promise((resolve, reject) => {
  postgres('users')
    .where({
      instagram_id: body.user.id
    })
    .increment('logins_count', 1)
    .update({
      last_login: new Date().toUTCString(),
      access_token: body.access_token
    })
    .then((data) => {
      logger.info('User info updated', {
        result: data,
        body
      });
      return resolve(data);
    })
    .catch((error) => {
      logger.error('Error while registering new user', {
        error,
        body
      });
      return reject(error);
    });
});

const isUserRegistered = (instagram_id) => new Promise((resolve, reject) =>
  postgres('users')
    .select('*')
    .where({
      instagram_id
    })
    .then((data) => {
      if (data.length > 0) return resolve(data[0]);
      else return reject();
    })
    .catch((error) => reject())
);

const promoteUser = (req, res) => {
  if (req.body.id == null) {
    res.status(400);
    return res.json({
      error: 'id not provided'
    })
  } else {
    postgres('users')
      .where({
        id: req.body.id
      })
      .update({
        is_premium: true
      })
      .then(() => {
        res.status(200);
        return res.json({
          success: 'ok'
        })
      })
      .catch((error) => {
        logger.error('Error while promoting user', {
          error,
          id: req.body.id
        });

        res.status(400);
        return res.json({
          error
        })
      });
  }
};

const invalidateAccessToken = (userId) => new Promise((resolve, reject) => {
  postgres('users')
    .update({
      access_token_validity: false
    })
    .where({
      id: userId
    })
    .then((data) => {
      logger.info('Access token invalidated', {
        userId,
        data
      });

      return resolve();
    })
    .catch((error) => {
      logger.error('Failed to invalidate access token', {
        userId,
        error
      });

      return reject();
    });
});

module.exports = {
  exchangeCodeForToken,
  getFollowers,
  getFollowings,
  getStats,
  getUserInfo,
  isUserRegistered,
  promoteUser,
  registerUser,
  updateAccessToken,
  invalidateAccessToken
};
