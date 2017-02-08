const postgres = require('../../postgres');
const helpers = require('../helpers');

const getPhotos = (req, res) => {
  postgres('photos')
    .select('*')
    .where({
      user: req.params.userId,
    })
    .then((photos) => helpers.returnData(photos, res))
    .catch((error) => helpers.postgresError(error, res));
};

const getPhotoAnalytics = (req, res) => {
  postgres('photos')
    .select('*')
    .where({
      'photos.id': req.params.photoId,
    })
    .limit(helpers.getLimit(req))
    .join('photos_likes', 'photos.instagram_photo_id', 'photos_likes.photo')
    .then((data) => helpers.returnData(data, res))
    .catch((error) => helpers.postgresError(error, res));
};

module.exports = {
  getPhotos,
  getPhotoAnalytics,
};
