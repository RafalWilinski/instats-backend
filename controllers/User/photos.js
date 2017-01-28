const postgres = require('../../postgres');

const returnData = (data, res) => {
  res.status(200);
  return res.json(data);
};

const idNotProvidedError = (res) => {
  res.status(400);
  return res.json({
    error: 'id not provided',
  });
};

const postgresError = (error, res) => {
  res.status(404);
  return res.json({
    error,
  });
};

const getPhotos = (req, res) => {
  if (req.query.userId === null) {
    return idNotProvidedError(res);
  }

  postgres('photos')
    .select('*')
    .where({
      user: req.query.userId,
    })
    .then((photos) => returnData(photos, res))
    .catch((error) => postgresError(error, res));
};

const getPhotoAnalytics = (req, res) => {
  if (req.query.id == null) {
    return idNotProvidedError(res);
  }

  postgres('photos')
    .select('*')
    .where({
      id: req.query.id
    })
    .join('photos_likes', 'photos.instagram_photo_id', 'photos_likes.photo')
    .then((data) => returnData(data, res))
    .catch((error) => postgresError(error, res));
};

module.exports = {
  getPhotos,
  getPhotoAnalytics,
};
