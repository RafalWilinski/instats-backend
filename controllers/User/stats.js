const instagram = require('../../instagram');
const responses = require('./responses');

const getStats = (req, res) => {
  if (req.query.access_token == null) {
    return responses.accessTokenMissingError(res);
  }

  instagram.fetchStats(req.query.access_token)
    .then((instagramData) => {
      res.status(200);
      return res.json(instagramData);
    }).catch(() => responses.instagramError(req, res));
};

module.exports = getStats;
