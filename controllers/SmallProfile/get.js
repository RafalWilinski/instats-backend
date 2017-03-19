const postgres = require('../../postgres');
const responses = require('./../responses');

const getSmallProfile = (req, res) => {
  if (req.query.id == null) {
    return responses.returnStatus('Id not provided', 422, res);
  }

  postgres('small_profiles')
    .select('name', 'picture_url', 'instagram_id')
    .where({
      instagram_id: req.query.id,
    })
    .limit(1)
    .then((users) => {
      res.status(200);
      return res.json({
        username: users[0].name,
        profile_picture: users[0].picture_url,
      });
    })
    .catch((error) => responses.returnStatus('Internal Database Error', 500, res));
};

module.exports = getSmallProfile;
