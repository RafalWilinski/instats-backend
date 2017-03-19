const postgres = require('../../postgres');
const responses = require('./../responses');
const helpers = require('../helpers');

const getStatsOverTime = (req, res) => {
  postgres('stats')
    .select('*')
    .where({
      'user_ref': req.params.userId,
    })
    .limit(helpers.getLimit(req))
    .offset(helpers.getOffset(req))
    .then((data) => responses.returnData(data, res))
    .catch((error) => responses.returnStatus('Internal Database Error', 500, res));
};

module.exports = getStatsOverTime;
