const postgres = require('../../postgres');
const helpers = require('../helpers');
const responses = require('../responses');

const getFollowersDelta = (req, res) => {
  if (req.params.userId == null) {
    return responses.returnStatus('UserId not provided', 422, res);
  }

  postgres('followers_deltas')
    .select('timestamp as time', 'in_or_out as flow', 's.name as name', 's.picture_url as pic')
    .joinRaw('JOIN small_profiles s ON s.instagram_id = ANY(followers_deltas.users_array)')
    .where({
      user_ref: req.params.userId,
    })
    .whereBetween('timestamp', helpers.getBetweenDates(req))
    .then((data) => responses.returnData(data, res))
    .catch((error) => responses.returnStatus('Internal Database Error', 500, res, error));
};

module.exports = getFollowersDelta;
