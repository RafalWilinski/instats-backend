const logger = require('../../log');
const postgres = require('../../postgres');

const idParameterMissingError = (res) => {
  res.status(400);
  return res.json({
    error: 'id not provided'
  });
};

const postgresQueryError = (error, req, res) => {
  if (Object.keys(error).length === 0) return userNotFoundError(res);

  logger.error('Error while executing getSmallProfile/getSmallProfilesBatch query', {
    error,
    ids: req.query.ids,
    id: req.query.id,
  });

  res.status(500);
  return res.json({
    error: 'users not found:err'
  });
};

const userNotFoundError = (res) => {
  logger.warn('Users not found in small profiles!');

  res.status(400);
  return res.json({
    error: 'users not found'
  });
};

const getSmallProfilesBatch = (req, res) => {
  if (req.query.ids == null) {
    return idParameterMissingError(res);
  }

  const array = Array.from(new Set(req.query.ids.split(',').filter((id) => id)));
  postgres('small_profiles')
    .select('name', 'picture_url', 'instagram_id')
    .whereIn(
      'instagram_id', array
    )
    .then((users) => {
      res.status(200);
      return res.json(users);
    })
    .catch((error) => postgresQueryError(error, req, res));
};

const getSmallProfile = (req, res) => {
  if (req.query.id == null) {
    return idParameterMissingError(res);
  }

  postgres('small_profiles')
    .select('name', 'picture_url', 'instagram_id')
    .where({
      instagram_id: req.query.id
    })
    .limit(1)
    .then((users) => {
      res.status(200);
      return res.json({
        username: users[0].name,
        profile_picture: users[0].picture_url,
      });

      return userNotFoundError(res);
    })
    .catch((error) => postgresQueryError(error, req, res));
};

module.exports = {
  getSmallProfile,
  getSmallProfilesBatch,
};
