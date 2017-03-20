const postgres = require('../../../postgres');
const responses = require('./../../responses');
const helpers = require('../../helpers');

const getPhotoAnalytics = (req, res) => {
  postgres('photos')
    .select('photos_likes.likes', 'photos_likes.timestamp')
    .where({
      'photos.id': req.params.photoId,
    })
    .limit(helpers.getLimit(req))
    .offset(helpers.getOffset(req))
    .join('photos_likes', 'photos.instagram_photo_id', 'photos_likes.photo')
    .then((data) => responses.returnData(data, res))
    .catch((error) => responses.returnStatus('Internal Database Error', 500, res, error));
};

module.exports = getPhotoAnalytics;
