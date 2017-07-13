const postgres = require('../../postgres');
const responses = require('./../responses');
const helpers = require('../helpers');

const getPhotos = (req) =>
  postgres('photos')
    .select('photos.instagram_photo_id as i', 'l.likes as c', 'l.timestamp as t')
    .joinRaw('JOIN photos_likes l ON photos.instagram_photo_id = l.photo')
    .whereBetween('l.timestamp', helpers.getBetweenDates(req))
    .where({
      'photos.user': req.params.userId,
    });

const getComments = (req) =>
  postgres('photos')
    .select('photos.instagram_photo_id as i', 'pc.comments as c', 'pc.timestamp as t')
    .joinRaw('JOIN photos_comments pc ON photos.instagram_photo_id = pc.photo')
    .whereBetween('pc.timestamp', helpers.getBetweenDates(req))
    .where({
      'photos.user': req.params.userId,
    });

const getMappedData = (data) => {
  const photos = {};
  data.forEach((d) => {
    if (photos[d.i] === undefined) {
      photos[d.i] = [];
    }

    photos[d.i].push({
      c: d.c,
      t: d.t,
    });
  });

  return photos;
}

const getSortedData = (photos) => {
  const sortedPhotos = {};
  Object.keys(photos).forEach((id) => {
    sortedPhotos[id] = photos[id].sort((a, b) => b.t - a.t);
  });

  return sortedPhotos;
}

const getValuesCummulative = (photos, comments) => {
  const cummulative = [];
  photos.forEach((photo) => {
    cummulative.push({
      c: photo.c,
      t: photo.t,
    })
  });

  comments.forEach((comment, index) => {
    if (cummulative[index]) {
      cummulative[index].c += comment.c;
    } else {
      cummulative.push({
        c: comment.c,
        t: comment.t,
      });
    }
  });

  return cummulative;
}

const getEngagement = (req, res) => {
  if (req.params.userId == null) {
    return responses.returnStatus('UserId not provided', 422, res);
  }

  Promise.all([getPhotos(req), getComments(req)])
    .then(([photosData, commentsData]) => {
      const photos = getSortedData(getMappedData(photosData));
      const comments = getSortedData(getMappedData(commentsData));

      const cummulative = {};
      Object.keys(photos).forEach((id) => {
        cummulative[id] = getValuesCummulative(photos[id], comments[id]);
      });

      return responses.returnData({ photos, comments, cummulative }, res)
    })
    .catch((error) => responses.returnStatus(error, 500, res, error));
}

module.exports = getEngagement;
