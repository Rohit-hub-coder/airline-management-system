const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user-controller');
const validateSignupRequest = require('../../middlewares/signup-middleware');
const validateSignInRequest = require('../../middlewares/signin-middleware');
const verifyToken = require('../../middlewares/auth-middleware');
const authorize = require('../../middlewares/authorize-middleware');

router.post('/signup', validateSignupRequest, userController.create);
router.post('/signin', validateSignInRequest, userController.signIn);
router.post('/verify-otp', userController.verifyOTP);
router.get('/profile', verifyToken, userController.getProfile);

router.post('/assign-role', verifyToken, authorize('admin'), userController.assignRole);
module.exports = router;