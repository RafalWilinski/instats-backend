'use strict';

module.exports = {
  exchangeCodeForToken: require('./exchangeCodeForToken'),
  getStats: require('./stats'),
  getPhotos: require('./photos').getPhotos,
  getPhotoAnalytics: require('./photos').getPhotoAnalytics,
  getUserInfo: require('./getUserInfo').getSmallProfile,
  getUserInfoBatch: require('./getUserInfo').getSmallProfilesBatch,
  isUserRegistered: require('./helpers').isUserRegistered,
  registerUser: require('./register'),
  updateAccessToken: require('./helpers').updateAccessToken,
};
