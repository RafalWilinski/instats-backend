const isUserRegistered = (instagramId) => require('./helpers/isUserRegistered')(instagramId);

module.exports = {
  exchangeCodeForToken: require('./exchangeCodeForToken'),
  getPhotos: require('./photo/getPhotos'),
  getPhotoAnalytics: require('./photo/getPhotoAnalytics'),
  isUserRegistered,
  registerUser: require('./register'),
  updateAccessToken: require('./helpers/updateAccessToken'),
  getFollowersDelta: require('./getFollowersDelta'),
  getStatsOverTime: require('./getStatsOverTime')
};
