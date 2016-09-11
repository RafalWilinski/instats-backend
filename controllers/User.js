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
  if (req.query.id == null) {
    res.status(400);
    return res.json({
      error: 'id not provided'
    });
  } else {
    postgres('small_profiles')
      .select('username', 'profile_picture', 'instagram_id')
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
        });

        res.status(404);
        return res.json({
          error: 'user not found'
        });
      });
  }
};

const getUserInfoBatch = (req, res) => {
  if (req.query.ids === null) {
    res.status(400);
    return res.json({
      error: 'ids not provided'
    });
  } else {
    const array = req.query.ids.split(',').filter((id) => id);
    postgres('small_profiles').select('name', 'picture_url', 'instagram_id')
      .whereIn(
        'instagram_id', array
      )
      .then((users) => {
        if (users) {
          res.status(200);
          return res.json({
            response: { meta: { code: 200 } },
            data: users,
          });
        } else {
          logger.warn('Users not found in small profiles!');

          res.status(404);
          return res.json({
            error: 'users not found'
          });
        }
      })
      .catch((error) => {
        logger.error('Error while executing getUserInfoBatch query', {
          error,
          ids: req.query.ids,
        });

        res.status(404);
        return res.json({
          error: 'users not found:err'
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
      if (body.hasOwnProperty('code') && body.code !== 200) {
        res.status(403);
        metrics.apiExchangeFail.inc();

        logger.error('Instagram API responded with non-200 status', {
          statusCode: body.code,
          code: req.body.code,
          body
        });

        return res.json({
          error: 'Failed to exchange token'
        });
      }

      isUserRegistered(body.user.id)
        .then((user) => {
          updateAccessToken(body, user)
            .then((data) => {
              metrics.apiExchangeSuccess.inc();
              res.status(200);
              return res.json({
                data: data[0]
              });
            })
            .catch((error) => {
              metrics.apiExchangeFail.inc();

              logger.error('failed to update access token', {
                error,
                body
              });

              res.status(403);
              return res.json({
                error: 'Failed to exchange token'
              });
            });
        })
        .catch(() => {
          registerUser(body)
            .then((data) => {
              metrics.apiExchangeSuccess.inc();
              res.status(200);
              return res.json({
                data: data[0]
              });
            })
            .catch((error) => {
              logger.error('Failed to register new user to DB', {
                error,
                body
              });

              metrics.apiExchangeFail.inc();
              res.status(400);
              return res.json({
                error: 'failed to register user'
              })
            });
        });
    })
    .catch(() => {
      metrics.apiExchangeFail.inc();
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
    .returning('*')
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
    .returning('*')
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
  getUserInfoBatch,
  isUserRegistered,
  promoteUser,
  registerUser,
  updateAccessToken,
  invalidateAccessToken
};
