const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const departmentSchema = mongoose.Schema(
    {
        departmentCode: {
            type: String,
            required: [true, 'Mã phòng ban là bắt buộc'],
            unique: true,
            trim: true,
            uppercase: true
        },

        departmentName: {
            type: String,
            required: [true, 'Tên phòng ban là bắt buộc'],
            trim: true,
            maxlength: [100, 'Tên không quá 100 ký tự']
        },

        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Mô tả không quá 500 ký tự'],
            default: ''
        },

        manager: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Employee',
            default: null
        },

        status: {
            type: String,
            enum: {
                values: ['active', 'inactive'],
                message: 'Trạng thái không hợp lệ'
            },
            default: 'active'
        },

        createdBy: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User'
        }
    },
    { timestamps: true }
);

departmentSchema.index({ departmentCode: 1 }, { unique: true });
departmentSchema.index({ status: 1 });

departmentSchema.plugin(toJSON);
departmentSchema.plugin(paginate);

departmentSchema.statics.isCodeTaken = async function (departmentCode, excludeId) {
    const dept = await this.findOne({
        departmentCode: departmentCode.toUpperCase(),
        _id: { $ne: excludeId }
    });
    return !!dept;
};

departmentSchema.statics.isNameTaken = async function (departmentName, excludeId) {
    const dept = await this.findOne({
        departmentName,
        _id: { $ne: excludeId }
    });
    return !!dept;
};

const Department = mongoose.model('Department', departmentSchema);

module.exports = Department;