module.exports = {
  exchangeCodeForToken: require('./exchangeCodeForToken'),
  getStats: require('./getStats'),
  getPhotos: require('./photo/getPhotos'),
  getPhotoAnalytics: require('./photo/getPhotoAnalytics'),
  isUserRegistered: require('./helpers/isUserRegistered'),
  registerUser: require('./register'),
  updateAccessToken: require('./helpers/updateAccessToken'),
  getFollowersDelta: require('./getFollowersDelta'),
  getStatsOverTime: require('./getStatsOverTime')
};
