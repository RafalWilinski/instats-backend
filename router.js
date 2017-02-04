const express = require('express');
const router = express.Router();
const UserController = require('./controllers/User/index');
const authMiddleware = require('./controllers/middleware');

router.get('/user/:userId/photos', UserController.getPhotos);
router.get('/user/:userId/photo/:photoId', UserController.getPhotoAnalytics);
router.get('/user/:userId/stats', authMiddleware, UserController.getStats);
router.post('/user/request_access_token', UserController.exchangeCodeForToken);

router.get('/small_profile', UserController.getUserInfo);
router.get('/small_profiles', UserController.getUserInfoBatch);

module.exports = router;
