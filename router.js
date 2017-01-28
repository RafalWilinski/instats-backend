const express = require('express');
const router = express.Router();
const UserController = require('./controllers/User/index');

router.get('/user/photos', UserController.getPhotos);
router.get('/user/photo/', UserController.getPhotoAnalytics);
router.get('/user/stats', UserController.getStats);
router.post('/user/request_access_token', UserController.exchangeCodeForToken);

router.get('/small_profile', UserController.getUserInfo);
router.get('/small_profiles', UserController.getUserInfoBatch);

module.exports = router;
