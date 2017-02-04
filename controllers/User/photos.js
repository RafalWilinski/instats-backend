const postgres = require('../../postgres');

const returnData = (data, res) => {
  res.status(200);
  return res.json(data);
};

const postgresError = (error, res) => {
  res.status(500);
  return res.json({
    error,
  });
};

const getLimit = (req) => {
  const defaultLimit = 100;

  if (req.query.limit) {
    const limit = parseInt(req.query.limit);
    return limit > defaultLimit ? defaultLimit : limit;
  }

  return defaultLimit;
};

const getPhotos = (req, res) => {
  postgres('photos')
    .select('*')
    .where({
      user: req.params.userId,
    })
    .then((photos) => returnData(photos, res))
    .catch((error) => postgresError(error, res));
};

const getPhotoAnalytics = (req, res) => {
  postgres('photos')
    .select('*')
    .where({
      'photos.id': req.params.photoId,
    })
    .limit(getLimit(req))
    .join('photos_likes', 'photos.instagram_photo_id', 'photos_likes.photo')
    .then((data) => returnData(data, res))
    .catch((error) => postgresError(error, res));
};

module.exports = {
  getPhotos,
  getPhotoAnalytics,
};
