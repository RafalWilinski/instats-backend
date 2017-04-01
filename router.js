const express = require('express');
const router = express.Router();
const UserController = require('./controllers/User/index');
const SmallProfileController = require('./controllers/SmallProfile/index');
const authMiddleware = require('./controllers/middleware');

router.get('/user/:userId/photos', UserController.getPhotos);
router.get('/user/:userId/photo/:photoId', UserController.getPhotoAnalytics);
router.get('/user/:userId/stats', authMiddleware, UserController.getStatsOverTime);
router.get('/user/:userId/followers/', UserController.getFollowersDelta);
router.post('/user/request_access_token', UserController.exchangeCodeForToken);

router.get('/small_profile', SmallProfileController.get);
router.get('/small_profiles', SmallProfileController.getBatch);

module.exports = router;
