const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');
const jwt = require("jsonwebtoken");

const register = async (userBody) => {
    if (await User.isEmailTaken(userBody.email)) {
        throw new ApiError(404, 'Email đã được sử dụng');
    }

    if (await User.isUserNameTaken(userBody.userName)) {
        throw new ApiError(404, 'Tên đăng nhập đã tồn tại');
    }

    const user = await User.create({
        name: userBody.name,
        userName: userBody.userName,
        email: userBody.email,
        password: userBody.password,
        phone: userBody.phone,
        position: userBody.position || 'Employee',
        role: userBody.role || 'employee'
    });

    return user;
};

const login = async (userName, password) => {
    const user = await User.findOne({ userName }).select('+password');

    if (!user) {
        throw new ApiError(403, 'Tên đăng nhập hoặc mật khẩu không đúng');
    }

    if (!user.isActive) {
        throw new ApiError(403, 'Tài khoản này đã bị vô hiệu hóa');
    }

    const isPasswordMatch = await user.isPasswordMatch(password);
    if (!isPasswordMatch) {
        throw new ApiError(403, 'Email hoặc mật khẩu không đúng');
    }

    await user.updateLastLogin();

    const accessToken = jwt.sign({
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role
    },
        process.env.JWT_SECRET, { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign({
        id: user._id.toString(),
        type: 'refresh'
    },
        process.env.REFRESH_SECRET,
        { expiresIn: "7d" }
    );

    return {
        user: user.toAuthJSON(),
        accessToken: accessToken,
        refreshToken: refreshToken
    };
};

const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        throw new ApiError(401, 'Refresh token không tồn tại');
    }

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    } catch (err) {
        throw new ApiError(401, 'Refresh token không hợp lệ hoặc đã hết hạn');
    }

    if (decoded.type !== 'refresh') {
        throw new ApiError(401, 'Token không hợp lệ');
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
        throw new ApiError(401, 'User không tồn tại hoặc bị khoá');
    }

    const accessToken = jwt.sign(
        {
            id: user._id.toString(),
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );

    const newRefreshToken = jwt.sign(
        {
            id: user._id.toString(),
            type: 'refresh'
        },
        process.env.REFRESH_SECRET,
        { expiresIn: '7d' }
    );

    return {
        accessToken,
        refreshToken: newRefreshToken,
        user: user.toAuthJSON()
    };
};

const forgotPassword = async (email) => {
    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, 'Không tìm thấy user với email này');
    }

    const { token, hashedToken } = User.createResetToken();

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    return token;
};

const resetPassword = async (resetToken, newPassword) => {
    const user = await User.findByResetToken(resetToken);

    if (!user) {
        throw new ApiError(404, 'Reset token không hợp lệ hoặc đã hết hạn');
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return user;
};

module.exports = {
    refreshAccessToken,
    login,
    register,
    forgotPassword,
    resetPassword
}