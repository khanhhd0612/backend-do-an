const catchAsync = require('../utils/catchAsync');
const authService = require('../services/auth.service');
const userService = require('../services/user.service');
const mailService = require('../services/mail.service');

const login = catchAsync(async (req, res) => {
    const { userName, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.login(userName, password);

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Chỉ HTTPS
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000 // 15 phút
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7d
    });

    return res.json({
        status: "success",
        message: "Đăng nhập thành công",
        data: user
    })
});

const register = catchAsync(async (req, res) => {
    const user = await authService.register(req.body);

    return res.json({
        status: "success",
        message: "Đăng ký thành công. Vui lòng kiểm tra email để xác minh",
        data: {
            user
        }
    });
});

const logout = catchAsync(async (req, res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return res.json({
        status: "success",
        message: "Đăng xuất thành công"
    });
});

const refreshAccessToken = catchAsync(async (req, res) => {
    const { refreshToken } = req.cookies;

    const { accessToken, refreshToken: newRefreshToken, user } =
        await authService.refreshAccessToken(refreshToken);

    res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60 * 1000
    });

    return res.json({
        status: "success",
        message: "Token được làm mới thành công",
        data: {
            user
        }
    });
});

const getMe = catchAsync(async (req, res) => {
    const userId = req.user.id;

    const user = await userService.getUserById(userId);



    res.status(200).json({
        success: true,
        message: 'Lấy profile thành công',
        data: {
            user: user.getPublicProfile()
        }
    });
});

const forgotPassword = catchAsync(async (req, res) => {
    const { email } = req.body;

    const resetToken = await authService.forgotPassword(email);

    const resetUrl = `${process.env.CLIENT_URL}/reset/password/${resetToken}`;

    await mailService.sendMail({
        to: email,
        subject: 'Đặt lại mật khẩu',
        text: `Nhấn vào link này để đặt lại mật khẩu của bạn: ${resetUrl}`,
    });

    res.status(200).json({
        success: true,
        message: 'Email reset mật khẩu đã được gửi',
        data: {
            ...(process.env.NODE_ENV === 'development' && { resetToken })
        }
    });
});

const resetPassword = catchAsync(async (req, res) => {
    const { resetToken } = req.params;
    const { newPassword } = req.body;

    const user = await authService.resetPassword(resetToken, newPassword);

    res.status(200).json({
        success: true,
        message: 'Reset mật khẩu thành công',
        data: {
            user: user.toAuthJSON()
        }
    });
});

module.exports = {
    login,
    logout,
    register,
    refreshAccessToken,
    getMe,
    forgotPassword,
    resetPassword
}