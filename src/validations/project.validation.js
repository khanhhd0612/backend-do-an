const Joi = require('joi');
const {
    objectId,
    projectCode,
    projectStatus,
    stageStatus,
    teamRole,
    phone,
    email,
    currency
} = require('./custom.validation');

const createProject = {
    body: Joi.object().keys({
        projectCode: Joi.string()
            .required()
            .trim()
            .uppercase()
            .custom(projectCode)
            .messages({
                'any.required': 'Mã dự án là bắt buộc'
            }),

        projectName: Joi.string()
            .required()
            .trim()
            .min(5)
            .max(200)
            .messages({
                'any.required': 'Tên dự án là bắt buộc',
                'string.min': 'Tên dự án phải ít nhất 5 ký tự',
                'string.max': 'Tên dự án không quá 200 ký tự'
            }),

        description: Joi.string()
            .trim()
            .max(1000)
            .messages({
                'string.max': 'Mô tả không quá 1000 ký tự'
            }),

        location: Joi.object()
            .required()
            .keys({
                address: Joi.string()
                    .required()
                    .trim()
                    .min(10)
                    .max(200)
                    .messages({
                        'any.required': 'Địa chỉ là bắt buộc',
                        'string.min': 'Địa chỉ phải ít nhất 10 ký tự',
                        'string.max': 'Địa chỉ không quá 200 ký tự'
                    }),

                district: Joi.string()
                    .required()
                    .trim()
                    .messages({
                        'any.required': 'Quận/huyện là bắt buộc'
                    }),

                city: Joi.string()
                    .required()
                    .trim()
                    .messages({
                        'any.required': 'Thành phố là bắt buộc'
                    }),

                coordinates: Joi.object()
                    .keys({
                        lat: Joi.number()
                            .min(-90)
                            .max(90)
                            .messages({
                                'number.min': 'Latitude không hợp lệ',
                                'number.max': 'Latitude không hợp lệ'
                            }),
                        lng: Joi.number()
                            .min(-180)
                            .max(180)
                            .messages({
                                'number.min': 'Longitude không hợp lệ',
                                'number.max': 'Longitude không hợp lệ'
                            })
                    })
            }),

        client: Joi.object()
            .required()
            .keys({
                name: Joi.string()
                    .required()
                    .trim()
                    .min(2)
                    .max(100)
                    .messages({
                        'any.required': 'Tên khách hàng là bắt buộc',
                        'string.min': 'Tên khách hàng phải ít nhất 2 ký tự',
                        'string.max': 'Tên khách hàng không quá 100 ký tự'
                    }),

                contactPerson: Joi.string()
                    .trim()
                    .max(100)
                    .messages({
                        'string.max': 'Tên liên hệ không quá 100 ký tự'
                    }),

                phone: Joi.string()
                    .trim()
                    .custom(phone)
                    .optional(),

                email: Joi.string()
                    .trim()
                    .lowercase()
                    .custom(email)
                    .optional()
            }),

        projectManager: Joi.string()
            .required()
            .custom(objectId)
            .messages({
                'any.required': 'Quản lý dự án là bắt buộc'
            }),

        supervisors: Joi.array()
            .items(
                Joi.string().custom(objectId).messages({
                    'any.invalid': 'ID giám sát viên không hợp lệ'
                })
            ),

        startDate: Joi.date()
            .required()
            .messages({
                'any.required': 'Ngày bắt đầu là bắt buộc',
                'date.base': 'Ngày bắt đầu phải là một ngày hợp lệ'
            }),

        endDate: Joi.date()
            .required()
            .greater(Joi.ref('startDate'))
            .messages({
                'any.required': 'Ngày kết thúc là bắt buộc',
                'date.base': 'Ngày kết thúc phải là một ngày hợp lệ',
                'date.greater': 'Ngày kết thúc phải sau ngày bắt đầu'
            }),

        estimatedDuration: Joi.number()
            .required()
            .integer()
            .min(1)
            .max(120)
            .messages({
                'any.required': 'Thời gian dự kiến là bắt buộc',
                'number.base': 'Thời gian dự kiến phải là số',
                'number.integer': 'Thời gian dự kiến phải là số nguyên',
                'number.min': 'Thời gian phải ít nhất 1 tháng',
                'number.max': 'Thời gian không quá 120 tháng'
            }),

        budget: Joi.object()
            .required()
            .keys({
                estimatedBudget: Joi.number()
                    .required()
                    .integer()
                    .min(1000000)
                    .max(999999999999)
                    .messages({
                        'any.required': 'Ngân sách dự kiến là bắt buộc',
                        'number.base': 'Ngân sách dự kiến phải là số',
                        'number.integer': 'Ngân sách dự kiến phải là số nguyên',
                        'number.min': 'Ngân sách tối thiểu 1 triệu VND',
                        'number.max': 'Ngân sách quá lớn'
                    }),

                approvedBudget: Joi.number()
                    .required()
                    .integer()
                    .min(1000000)
                    .messages({
                        'any.required': 'Ngân sách được duyệt là bắt buộc',
                        'number.base': 'Ngân sách được duyệt phải là số',
                        'number.integer': 'Ngân sách được duyệt phải là số nguyên',
                        'number.min': 'Ngân sách tối thiểu 1 triệu VND'
                    }),

                currency: Joi.string()
                    .custom(currency)
                    .default('VND')
            })
    })
};

const updateProject = {
    params: Joi.object().keys({
        projectId: Joi.string()
            .required()
            .custom(objectId)
            .messages({
                'any.required': 'ID dự án là bắt buộc',
                'any.invalid': 'ID dự án không hợp lệ'
            })
    }),

    body: Joi.object()
        .keys({
            projectCode: Joi.string()
                .trim()
                .uppercase()
                .custom(projectCode),

            projectName: Joi.string()
                .trim()
                .min(5)
                .max(200)
                .messages({
                    'string.min': 'Tên dự án phải ít nhất 5 ký tự',
                    'string.max': 'Tên dự án không quá 200 ký tự'
                }),

            description: Joi.string()
                .trim()
                .max(1000),

            location: Joi.object().keys({
                address: Joi.string().trim().min(10).max(200),
                district: Joi.string().trim(),
                city: Joi.string().trim(),
                coordinates: Joi.object().keys({
                    lat: Joi.number().min(-90).max(90),
                    lng: Joi.number().min(-180).max(180)
                })
            }),

            client: Joi.object().keys({
                name: Joi.string().trim().min(2).max(100),
                contactPerson: Joi.string().trim().max(100),
                phone: Joi.string().trim().custom(phone),
                email: Joi.string().trim().lowercase().custom(email)
            }),

            projectManager: Joi.string().custom(objectId),
            supervisors: Joi.array().items(Joi.string().custom(objectId)),

            startDate: Joi.date(),
            endDate: Joi.date().greater(Joi.ref('startDate')),
            estimatedDuration: Joi.number().integer().min(1).max(120),

            budget: Joi.object().keys({
                estimatedBudget: Joi.number().integer().min(1000000),
                approvedBudget: Joi.number().integer().min(1000000),
                currency: Joi.string().custom(currency)
            }),

            status: Joi.string().custom(projectStatus)
        })
        .min(1)
        .messages({
            'object.min': 'Phải cập nhật ít nhất một trường'
        })
};

const getProject = {
    params: Joi.object().keys({
        projectId: Joi.string()
            .required()
            .custom(objectId)
            .messages({
                'any.required': 'ID dự án là bắt buộc',
                'any.invalid': 'ID dự án không hợp lệ'
            })
    })
};

const deleteProject = {
    params: Joi.object().keys({
        projectId: Joi.string()
            .required()
            .custom(objectId)
            .messages({
                'any.required': 'ID dự án là bắt buộc',
                'any.invalid': 'ID dự án không hợp lệ'
            })
    })
};
const listProjects = {
    query: Joi.object().keys({
        page: Joi.number()
            .integer()
            .min(1)
            .default(1)
            .messages({
                'number.base': 'Trang phải là số',
                'number.integer': 'Trang phải là số nguyên',
                'number.min': 'Trang phải ≥ 1'
            }),

        limit: Joi.number()
            .integer()
            .min(1)
            .max(100)
            .default(10)
            .messages({
                'number.base': 'Limit phải là số',
                'number.integer': 'Limit phải là số nguyên',
                'number.min': 'Limit phải ≥ 1',
                'number.max': 'Limit không quá 100'
            }),

        sortBy: Joi.string()
            .pattern(/^[a-zA-Z]+:(asc|desc)$/)
            .default('createdAt:desc')
            .messages({
                'string.pattern.base': 'Format sortBy: field:asc hoặc field:desc'
            }),

        status: Joi.string()
            .custom(projectStatus),

        city: Joi.string()
            .trim()
            .messages({
                'string.base': 'City phải là text'
            }),

        managerId: Joi.string()
            .custom(objectId)
            .messages({
                'any.invalid': 'ID manager không hợp lệ'
            }),

        keyword: Joi.string()
            .trim()
            .max(100)
            .messages({
                'string.max': 'Keyword không quá 100 ký tự'
            })
    })
};

const updateProgress = {
    params: Joi.object().keys({
        projectId: Joi.string()
            .required()
            .custom(objectId)
            .messages({
                'any.required': 'ID dự án là bắt buộc'
            })
    }),

    body: Joi.object().keys({
        percentage: Joi.number()
            .required()
            .integer()
            .min(0)
            .max(100)
            .messages({
                'any.required': 'Tiến độ là bắt buộc',
                'number.base': 'Tiến độ phải là số',
                'number.integer': 'Tiến độ phải là số nguyên',
                'number.min': 'Tiến độ phải ≥ 0%',
                'number.max': 'Tiến độ phải ≤ 100%'
            })
    })
};

const updateActualExpense = {
    params: Joi.object().keys({
        projectId: Joi.string()
            .required()
            .custom(objectId)
    }),

    body: Joi.object().keys({
        amount: Joi.number()
            .required()
            .integer()
            .min(0)
            .messages({
                'any.required': 'Số tiền là bắt buộc',
                'number.base': 'Số tiền phải là số',
                'number.integer': 'Số tiền phải là số nguyên',
                'number.min': 'Số tiền không thể âm'
            })
    })
};

const updateProjectStatus = {
    params: Joi.object().keys({
        projectId: Joi.string()
            .required()
            .custom(objectId)
    }),

    body: Joi.object().keys({
        status: Joi.string()
            .required()
            .custom(projectStatus)
            .messages({
                'any.required': 'Trạng thái là bắt buộc'
            })
    })
};

const addTeamMember = {
    params: Joi.object().keys({
        projectId: Joi.string()
            .required()
            .custom(objectId)
    }),

    body: Joi.object().keys({
        employeeId: Joi.string()
            .required()
            .custom(objectId)
            .messages({
                'any.required': 'ID nhân viên là bắt buộc',
                'any.invalid': 'ID nhân viên không hợp lệ'
            }),

        role: Joi.string()
            .required()
            .custom(teamRole)
            .messages({
                'any.required': 'Vai trò là bắt buộc'
            })
    })
};

const removeTeamMember = {
    params: Joi.object().keys({
        projectId: Joi.string()
            .required()
            .custom(objectId),
        employeeId: Joi.string()
            .required()
            .custom(objectId)
    })
};

const addStage = {
    params: Joi.object().keys({
        projectId: Joi.string()
            .required()
            .custom(objectId)
    }),

    body: Joi.object().keys({
        stageName: Joi.string()
            .required()
            .trim()
            .min(3)
            .max(100)
            .messages({
                'any.required': 'Tên giai đoạn là bắt buộc',
                'string.min': 'Tên giai đoạn phải ít nhất 3 ký tự',
                'string.max': 'Tên giai đoạn không quá 100 ký tự'
            }),

        startDate: Joi.date()
            .required()
            .messages({
                'any.required': 'Ngày bắt đầu giai đoạn là bắt buộc'
            }),

        endDate: Joi.date()
            .required()
            .greater(Joi.ref('startDate'))
            .messages({
                'any.required': 'Ngày kết thúc giai đoạn là bắt buộc',
                'date.greater': 'Ngày kết thúc phải sau ngày bắt đầu'
            })
    })
};

const updateStage = {
    params: Joi.object().keys({
        projectId: Joi.string()
            .required()
            .custom(objectId),
        stageIndex: Joi.number()
            .required()
            .integer()
            .min(0)
            .messages({
                'number.base': 'Index giai đoạn phải là số',
                'number.min': 'Index giai đoạn phải ≥ 0'
            })
    }),

    body: Joi.object().keys({
        stageName: Joi.string().trim().min(3).max(100),
        startDate: Joi.date(),
        endDate: Joi.date().greater(Joi.ref('startDate')),
        status: Joi.string().custom(stageStatus),
        progress: Joi.number().integer().min(0).max(100)
    })
};

const completeStage = {
    params: Joi.object().keys({
        projectId: Joi.string()
            .required()
            .custom(objectId),
        stageIndex: Joi.number()
            .required()
            .integer()
            .min(0)
    })
};

module.exports = {
    createProject,
    updateProject,
    getProject,
    deleteProject,
    listProjects,
    updateProgress,
    updateActualExpense,
    updateProjectStatus,
    addTeamMember,
    removeTeamMember,
    addStage,
    updateStage,
    completeStage
};