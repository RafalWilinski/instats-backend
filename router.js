const express = require('express');
const router = express.Router();
const UserController = require('./controllers/User');

router.get('/get_followers', UserController.getFollowers);
router.get('/get_followings', UserController.getFollowings);
router.get('/get_photos', UserController.getPhotos);
router.get('/get_photos_analytics', UserController.getPhotoAnalytics);
router.get('/get_stats', UserController.getStats);
router.get('/get_user_info', UserController.getUserInfo);
router.get('/get_user_info_batch', UserController.getUserInfoBatch);
router.post('/request_access_token', UserController.exchangeCodeForToken);
router.post('/promote', UserController.promoteUser);

module.exports = router;
