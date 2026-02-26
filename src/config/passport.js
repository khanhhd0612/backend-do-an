const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const dotenv = require("dotenv");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");

dotenv.config();

/**
 * lấy token
 * @param {Object} req - Request object
 * @returns {string|null} - Token hoặc null
 */
const tokenExtractor = (req) => {
    let token = null;

    if (req && req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }

    return token;
};

passport.use(
    new JwtStrategy(
        {
            secretOrKey: process.env.JWT_SECRET,
            jwtFromRequest: tokenExtractor,
            passReqToCallback: true
        },
        async (req, payload, done) => {
            try {
                const user = await User.findById(payload.id);

                if (!user) {
                    return done(null, false);
                }

                if (!user.isActive) {
                    return done(
                        new ApiError(
                            httpStatus.UNAUTHORIZED,
                            'Tài khoản đã bị vô hiệu hóa'
                        ),
                        false
                    );
                }

                return done(null, user);
            } catch (err) {
                console.error('JWT Strategy error:', err);
                return done(err, false);
            }
        }
    )
);

module.exports = passport;