const passport = require('passport');
const ApiError = require('../utils/ApiError');
const { roleRights } = require('../config/roles');

const verifyCallback = (req, resolve, reject, requiredRights) => async (err, user, info) => {
    if (err) {
        return reject(err);
    }

    if (!user) {
        return reject(new ApiError(401, 'Vui lòng đăng nhập để tiếp tục'));
    }

    req.user = user;

    if (requiredRights.length) {
        const userRights = roleRights.get(user.role) || [];
        const hasRequiredRights = requiredRights.every(r =>
            userRights.includes(r)
        );

        if (!hasRequiredRights && req.params.userId !== user.id) {
            return reject(new ApiError(403, 'Bạn không đủ quyền thực hiện hành động này'));
        }
    }

    resolve();
};

const auth = (...requiredRights) => async (req, res, next) => {
    return new Promise((resolve, reject) => {
        passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, requiredRights))(req, res, next);
    })
        .then(() => next())
        .catch((err) => next(err));
};

module.exports = auth;
