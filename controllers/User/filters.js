const postgres = require('../../postgres');
const responses = require('./../responses');
const helpers = require('../helpers');

const getStatsOverTime = (req, res) => {
  if (req.params.userId == null) {
    return responses.returnStatus('UserId not provided', 422, res);
  }

  const whereClause = {
    'photos.user': req.params.userId,
  };

  postgres('photos')
    .select('filter')
    .count('filter')
    .where(whereClause)
    .orderBy('count')
    .groupBy('filter')
    .then((data) => responses.returnData(data, res))
    .catch((error) => responses.returnStatus('Internal Database Error', 500, res));
};

module.exports = getStatsOverTime;
