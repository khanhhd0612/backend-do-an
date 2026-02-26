const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Tên là bắt buộc'],
            trim: true,
            maxlength: [100, 'Tên không quá 100 ký tự']
        },
        userName: {
            type: String,
            unique: true,
            required: [true, 'Tên đăng nhập là bắt buộc'],
            trim: true,
            maxlength: [100, 'Tên đăng nhập không quá 100 ký tự']
        },

        email: {
            type: String,
            required: [true, 'Email là bắt buộc'],
            unique: true,
            trim: true,
            lowercase: true,
            validate(value) {
                if (!validator.isEmail(value)) {
                    throw new Error('Email không hợp lệ.');
                }
            }
        },

        password: {
            type: String,
            required: [true, 'Mật khẩu là bắt buộc'],
            trim: true,
            minlength: [8, 'Mật khẩu phải có ít nhất 8 ký tự'],
            validate(value) {
                if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
                    throw new Error('Mật khẩu phải chứa ít nhất một chữ cái và một chữ số.');
                }
            },
            private: true,
            select: false // Không trả về password
        },

        phone: {
            type: String,
            required: [true, 'Số điện thoại là bắt buộc'],
            validate(value) {
                if (!validator.isMobilePhone(value, 'vi-VN')) {
                    throw new Error('Số điện thoại không hợp lệ (Việt Nam)');
                }
            }
        },

        position: {
            type: String,
            required: [true, 'Chức vụ là bắt buộc'],
            trim: true,
            maxlength: [50, 'Chức vụ không quá 50 ký tự']
        },

        role: {
            type: String,
            enum: {
                values: roles,
                message: `Role phải là một trong: ${roles.join(', ')}`
            },
            default: 'employee',
            required: true
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        profileImage: {
            type: String,
            default: '',
            validate(value) {
                if (value && !validator.isURL(value)) {
                    throw new Error('URL ảnh không hợp lệ');
                }
            }
        },

        isActive: {
            type: Boolean,
            default: true
        },

        lastLogin: {
            type: Date,
            default: null
        },

        resetPasswordToken: {
            type: String,
            default: null,
            select: false
        },

        resetPasswordExpires: {
            type: Date,
            default: null,
            select: false
        },

        emailVerificationToken: {
            type: String,
            default: null,
            select: false
        },

        emailVerificationExpires: {
            type: Date,
            default: null,
            select: false
        },
    },
    {
        timestamps: true
    }
);

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ userName: 1 }, { unique: true });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

userSchema.plugin(toJSON);
userSchema.plugin(paginate);


/**
 * Kiểm tra email đã tồn tại
 * @param {string} email - Email cần kiểm tra
 * @param {string} excludeUserId - ID user để exclude (khi update)
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
    const user = await this.findOne({
        email,
        _id: { $ne: excludeUserId }
    });
    return !!user;
};

/**
 * Kiểm tra username đã tồn tại
 * @param {string} name - Username cần kiểm tra
 * @param {string} excludeUserId - ID user để exclude (khi update)
 * @returns {Promise<boolean>}
 */
userSchema.statics.isUserNameTaken = async function (userName, excludeUserId) {
    const user = await this.findOne({
        userName,
        _id: { $ne: excludeUserId }
    });
    return !!user;
};

/**
 * Tạo reset password token
 * @returns {Object} - { token, hashedToken }
 */
userSchema.statics.createResetToken = function () {
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    return {
        token: resetToken,
        hashedToken: hashedToken
    };
};

/**
 * Tạo email verification token
 * @returns {Object} - { token, hashedToken }
 */
userSchema.statics.createEmailVerificationToken = function () {
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    return {
        token: token,
        hashedToken: hashedToken
    };
};

/**
 * Tìm user bằng reset token
 * @param {string} token - Reset token
 * @returns {Promise<User>}
 */
userSchema.statics.findByResetToken = async function (token) {
    const crypto = require('crypto');
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    return await this.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() }
    });
};

/**
 * Tìm user bằng email verification token
 * @param {string} token - Email verification token
 * @returns {Promise<User>}
 */
userSchema.statics.findByEmailVerificationToken = async function (token) {
    const crypto = require('crypto');
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    return await this.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() }
    });
};

/**
 * So khớp mật khẩu
 * @param {string} password - Mật khẩu 
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPasswordMatch = async function (password) {
    return bcrypt.compare(password, this.password);
};

/**
 * Cập nhật last login
 * @returns {Promise<User>}
 */
userSchema.methods.updateLastLogin = async function () {
    this.lastLogin = new Date();
    return await this.save();
};

/**
 * Lấy public profile
 * @returns {Object}
 */
userSchema.methods.getPublicProfile = function () {
    return {
        id: this._id,
        name: this.name,
        email: this.email,
        phone: this.phone,
        position: this.position,
        role: this.role,
        profileImage: this.profileImage,
        isActive: this.isActive,
        isVerified: this.isVerified,
        createdAt: this.createdAt
    };
};

/**
 * Dữ liệu khi login
 * @returns {Object}
 */
userSchema.methods.toAuthJSON = function () {
    return {
        id: this._id,
        name: this.name,
        email: this.email,
        phone: this.phone,
        position: this.position,
        role: this.role,
        profileImage: this.profileImage,
        isVerified: this.isVerified
    };
};

/**
 * Hash mật khẩu
 */
userSchema.pre('save', async function (next) {
    try {
        // Chỉ hash nếu password được thay đổi
        if (!this.isModified('password')) {
            return next();
        }

        this.password = await bcrypt.hash(this.password, 8);

        // Xóa reset password token
        if (this.isModified('password')) {
            this.resetPasswordToken = undefined;
            this.resetPasswordExpires = undefined;
        }

        next();
    } catch (error) {
        next(error);
    }
});

/**
 * @typedef User
 * @property {string} _id
 * @property {string} name - Tên user
 * @property {string} userName - Tên đăng nhập
 * @property {string} email - Email duy nhất
 * @property {string} password - Mật khẩu hashed
 * @property {string} phone - Số điện thoại
 * @property {string} position - Chức vụ
 * @property {string} role - Role
 * @property {boolean} isVerified - Đã xác minh email
 * @property {string} profileImage - URL ảnh đại diện
 * @property {boolean} isActive - Tài khoản hoạt động
 * @property {Date} lastLogin - Lần login cuối
 * @property {Date} createdAt - Ngày tạo
 * @property {Date} updatedAt - Ngày cập nhật
 */

const User = mongoose.model('User', userSchema);

module.exports = User;
