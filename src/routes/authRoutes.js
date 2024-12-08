const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');

router.post('/register', authController.handleRegisterUser);

router.post('/login', authController.handleLoginUser);

router.get(
    '/logout',
    passport.authenticate('jwt', { session: false }),
    authController.handleLogoutUser
);

module.exports = router;
