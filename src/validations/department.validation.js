const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createDepartment = {
    body: Joi.object().keys({
        departmentCode: Joi.string().required().trim().uppercase().max(20).messages({
            'string.empty': 'Mã phòng ban không được để trống',
            'any.required': 'Mã phòng ban là bắt buộc',
            'string.max': 'Mã phòng ban không quá 20 ký tự'
        }),

        departmentName: Joi.string().required().trim().max(100).messages({
            'string.empty': 'Tên phòng ban không được để trống',
            'any.required': 'Tên phòng ban là bắt buộc',
            'string.max': 'Tên phòng ban không quá 100 ký tự'
        }),

        description: Joi.string().trim().max(500).allow('').optional().messages({
            'string.max': 'Mô tả không quá 500 ký tự'
        }),

        manager: Joi.string().custom(objectId).allow(null).optional().messages({
            'any.invalid': 'Manager ID không hợp lệ'
        }),

        status: Joi.string().valid('active', 'inactive').optional().messages({
            'any.only': 'Trạng thái phải là active hoặc inactive'
        })
    })
};

const updateDepartment = {
    params: Joi.object().keys({
        departmentId: Joi.string().custom(objectId).required().messages({
            'any.required': 'Department ID là bắt buộc',
            'any.invalid': 'Department ID không hợp lệ'
        })
    }),

    body: Joi.object()
        .keys({
            departmentCode: Joi.string().trim().uppercase().max(20).optional().messages({
                'string.max': 'Mã phòng ban không quá 20 ký tự'
            }),

            departmentName: Joi.string().trim().max(100).optional().messages({
                'string.max': 'Tên phòng ban không quá 100 ký tự'
            }),

            description: Joi.string().trim().max(500).allow('').optional().messages({
                'string.max': 'Mô tả không quá 500 ký tự'
            }),

            manager: Joi.string().custom(objectId).allow(null).optional().messages({
                'any.invalid': 'Manager ID không hợp lệ'
            }),

            status: Joi.string().valid('active', 'inactive').optional().messages({
                'any.only': 'Trạng thái phải là active hoặc inactive'
            })
        })
        .min(1)
        .messages({
            'object.min': 'Phải có ít nhất 1 trường để cập nhật'
        })
};

const getDepartment = {
    params: Joi.object().keys({
        departmentId: Joi.string().custom(objectId).required().messages({
            'any.required': 'Department ID là bắt buộc',
            'any.invalid': 'Department ID không hợp lệ'
        })
    })
};

const getDepartments = {
    query: Joi.object().keys({
        departmentName: Joi.string().optional(),
        status: Joi.string().valid('active', 'inactive').optional(),
        sortBy: Joi.string().optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        page: Joi.number().integer().min(1).optional()
    })
};

const deleteDepartment = {
    params: Joi.object().keys({
        departmentId: Joi.string().custom(objectId).required().messages({
            'any.required': 'Department ID là bắt buộc',
            'any.invalid': 'Department ID không hợp lệ'
        })
    })
};

const assignManager = {
    params: Joi.object().keys({
        departmentId: Joi.string().custom(objectId).required()
    }),

    body: Joi.object().keys({
        managerId: Joi.string().custom(objectId).allow(null).required().messages({
            'any.required': 'Manager ID là bắt buộc',
            'any.invalid': 'Manager ID không hợp lệ'
        })
    })
};

module.exports = {
    createDepartment,
    updateDepartment,
    getDepartment,
    getDepartments,
    deleteDepartment,
    assignManager
};