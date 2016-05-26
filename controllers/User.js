const instagram = require('../instagram');
const postgres = require('../postgres');
const logger = require('../log');

const getFollowers = (req, res) => {
  if (req.query.id == null) {
    req.status(400);
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
          res.status(400);
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
    req.status(400);
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
          res.status(400);
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
  if(req.query.access_token == null) {
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
  
};

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

module.exports = {
  getFollowers,
  getFollowings,
  getStats,
  getUserInfo,
  exchangeCodeForToken,
  promoteUser
};
