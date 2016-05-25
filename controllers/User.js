const instagram = require('../instagram');
const postgres = require('../postgres');
const logger = require('../log');

const getFollowers = (req, res) => {

};

const getFollowings = (req, res) => {

};

const getStats = (req, res) => {
  
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

};

module.exports = {
  getFollowers,
  getFollowings,
  getStats,
  getUserInfo,
  exchangeCodeForToken,
  promoteUser
};
