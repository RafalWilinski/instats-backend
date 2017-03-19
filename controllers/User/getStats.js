const instagram = require('../../instagram');
const responses = require('./../responses');

const getStats = (req, res) => {
  instagram.fetchStats(req.query.access_token)
    .then((instagramData) => {
      res.status(200);
      return res.json(instagramData);
    }).catch(() => responses.returnStatus('Instagram API error', 500, res, req.query.access_token));
};

module.exports = getStats;
