const postgres = require('../../../postgres');
const responses = require('./../../responses');
const helpers = require('../../helpers');

const getPhotos = (req, res) => {
  postgres('photos')
    .select('*')
    .where({
      user: req.params.userId,
    })
    .orderBy('created_time')
    .then((photos) => responses.returnData(photos, res))
    .catch((error) => responses.returnStatus('Internal Database Error', 500, res));
};

module.exports = getPhotos;
