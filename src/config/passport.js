const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const dotenv = require('dotenv');

const { User } = require('../models/userModel');

dotenv.config();

/**
 * This is the setup file for Passport.js
 * If you wish to add your own strategies, you can do so here.
 * A list of strategies can be found at http://www.passportjs.org/
 * Some common strategies include:
 * - Facebook
 * - Google
 * - Twitter
 * - GitHub
 * - Etc
 */

/**
 * This is the JWT strategy for Passport.js
 * https://www.passportjs.org/packages/passport-jwt/
 */

const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET_KEY,
};

passport.use(
    new JwtStrategy(jwtOptions, async (payload, done) => {
        try {
            const user = await User.findById(payload.id);
            if (user) {
                return done(null, user);
            }
            return done(null, false, { message: 'User not found' });
        } catch (error) {
            return done(error, false);
        }
    })
);

module.exports = passport;
