const postgres = require('../../../postgres');
const responses = require('./../../responses');
const helpers = require('../../helpers');

const getPhotoAnalytics = (req, res) => {
  const query = `SELECT t.* 
    FROM (
      SELECT photos_likes.timestamp, photos_likes.likes, row_number() OVER(ORDER BY photos_likes.id ASC) AS row
      FROM photos
      JOIN photos_likes ON photos.instagram_photo_id = photos_likes.photo 
      WHERE photos.id='${req.params.photoId}'
    ) t
    WHERE t.row % ${req.query.mod || 1} = 0
    LIMIT ${helpers.getLimit(req)}
    OFFSET ${helpers.getOffset(req)};`;

  postgres.raw(query)
    .then((data) => responses.returnData(data.rows, res))
    .catch((error) => responses.returnStatus('Internal Database Error', 500, res, error));
};

module.exports = getPhotoAnalytics;
