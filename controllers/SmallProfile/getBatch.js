const postgres = require('../../postgres');
const responses = require('./../responses');

const getSmallProfilesBatch = (req, res) => {
  if (req.query.ids == null) {
    return responses.returnStatus('Ids not provided', 422, res);
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
    .catch((error) => responses.returnStatus('Internal Database Error', 500, res));
};

module.exports = getSmallProfilesBatch;
