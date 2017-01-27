'use strict';
const instagram = require('../../instagram');
const postgres = require('../../postgres');
const logger = require('../../log');

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
      .limit(100)
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
      .limit(100)
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

const getPhotos = (req, res) => {
  if (req.query.userId === null) {
    res.status(400);
    return res.json({
      error: 'id not provided',
    });
  } else {
    postgres('photos')
      .select('*')
      .where({
        user: req.query.userId,
      })
      .then((photos) => {
        res.status(200);
        return res.json(photos);
      })
      .catch((error) => {
        logger.error('Error while executing getPhotos query', {
          error,
          userId: req.query.userId,
        });

        res.status(404);
        return res.json({
          error: 'user not found'
        });
      });
  }
};

const getPhotoAnalytics = (req, res) => {
  if (req.query.id == null) {
    res.status(400);
    return res.json({
      error: 'id not provided',
    });
  } else {
    postgres('photos')
      .select('*')
      .where({
        id: req.query.id
      })
      .join('photos_likes', 'photos.instagram_photo_id', 'photos_likes.photo')
      .then((data) => {
        res.status(200);
        return res.json(data);
      })
      .catch((error) => {
        res.status(404);
        return res.json(error);
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
    const array = Array.from(new Set(req.query.ids.split(',').filter((id) => id)));
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
  if (req.body.id === null) {
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


module.exports = {
  exchangeCodeForToken: require('./exchangeCodeForToken'),
  getFollowers,
  getFollowings,
  getStats,
  getPhotos,
  getPhotoAnalytics,
  getUserInfo,
  getUserInfoBatch,
  isUserRegistered,
  promoteUser,
  registerUser: require('./register'),
  updateAccessToken,
};
