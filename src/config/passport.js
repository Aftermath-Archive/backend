const LocalStrategy = require('passport-local').Strategy;
const passport = require('passport');
const bcrypt = require('bcrypt');
const { User } = require('../models/userModel');

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

// This is the Local Strategy, which is used for authenticating users with a username and password.
// https://www.passportjs.org/packages/passport-local/
passport.use(
    new LocalStrategy(
        {
            usernameField: 'username',
            passwordField: 'password',
        },
        async (username, password, done) => {
            try {
                const user = await User.findOne({ username });
                if (!user)
                    return done(null, false, { message: 'User not found' });

                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch)
                    return done(null, false, { message: 'Incorrect password' });

                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => User.findById(id, done));
