const express = require('express');
const validate = require('../../middlewares/validate');
const authValidation = require('../../validations/auth.validation');
const authController = require('../../controllers/auth.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

router.post('/register', validate(authValidation.register), authController.register);

router.post('/login', validate(authValidation.login), authController.login);

router.post('/forgot-password', validate(authValidation.forgotPassword), authController.forgotPassword);

router.post('/reset-password/:resetToken', validate(authValidation.resetPassword), authController.resetPassword);

router.post('/logout', auth(), authController.logout);

router.post('/refresh', authController.refreshAccessToken);

router.get('/me', auth(), authController.getMe);


module.exports = router;