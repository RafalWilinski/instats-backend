const logger = require('../../log');
const postgres = require('../../postgres');
const responses = require('./responses');

const postgresQueryError = (error, req, res) => {
  if (Object.keys(error).length === 0) return responses.userNotFoundError(res);

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

const getSmallProfilesBatch = (req, res) => {
  if (req.query.ids == null) {
    return responses.idNotProvidedError(res);
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
    return responses.idNotProvidedError(res);
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
    })
    .catch((error) => postgresQueryError(error, req, res));
};

module.exports = {
  getSmallProfile,
  getSmallProfilesBatch,
};
