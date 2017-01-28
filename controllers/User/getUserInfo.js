const logger = require('../../log');
const postgres = require('../../postgres');

const idParameterMissingError = (res) => {
  res.status(400);
  return res.json({
    error: 'id not provided'
  });
};

const postgresQueryError = (error, req, res) => {
  logger.error('Error while executing getUserInfoBatch query', {
    error,
    ids: req.query.ids,
  });

  res.status(404);
  return res.json({
    error: 'users not found:err'
  });
};

const userNotFoundError = (res) => {
  logger.warn('Users not found in small profiles!');

  res.status(404);
  return res.json({
    error: 'users not found'
  });
};

const getSmallProfilesBatch = (req, res) => {
  if (req.query.ids === null) {
    return idParameterMissingError(res);
  }

  const array = Array.from(new Set(req.query.ids.split(',').filter((id) => id)));
  postgres('small_profiles')
    .select('name', 'picture_url', 'instagram_id')
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
      }

      return userNotFoundError(res);
    })
    .catch((error) => postgresQueryError(error, req, res));
};

const getSmallProfile = (req, res) => {
  if (req.query.id == null) {
    return idParameterMissingError(res);
  }

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
            profile_picture: users[0].picture_url,
          }
        });
      }

      return userNotFoundError(res);
    })
    .catch((error) => postgresQueryError(error, req, res));
};

module.exports = {
  getSmallProfile,
  getSmallProfilesBatch,
};
