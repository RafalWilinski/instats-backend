const instagram = require('../../instagram');
const logger = require('../../log');

const instagramError = (req, res) => {
  logger.error('Error while getStats request', {
    access_token: req.query.access_token
  });

  res.status(400);
  return res.json({
    error: 'failed to fetch stats from instagram'
  });
};

const accessTokenMissingError = (res) => {
  res.status(400);
  return res.json({
    error: 'access_token not provided'
  });
};

const getStats = (req, res) => {
  if (req.query.access_token == null) {
    return accessTokenMissingError(res);
  }

  instagram.fetchStats(req.query.access_token)
    .then((instagramData) => {
      res.status(200);
      return res.json(instagramData);
    }).catch(() => instagramError(req, res));
};

module.exports = getStats;
