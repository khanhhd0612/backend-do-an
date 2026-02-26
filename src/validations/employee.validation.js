const Joi = require('joi');
const {
    objectId,
    phone,
    email,
    url,
    currency,
    teamRole,
} = require('./custom.validation');

const skillSchema = Joi.object().keys({
    skillName: Joi.string()
        .required()
        .trim()
        .messages({ 'any.required': 'Tên kỹ năng là bắt buộc' }),

    level: Joi.string()
        .valid('beginner', 'intermediate', 'advanced', 'expert')
        .default('intermediate'),

    yearsOfExperience: Joi.number()
        .min(0)
        .default(0)
        .messages({ 'number.min': 'Số năm kinh nghiệm không thể âm' }),

    certification: Joi.string().trim().allow('', null),
});

const certificationSchema = Joi.object().keys({
    certName: Joi.string()
        .required()
        .trim()
        .messages({ 'any.required': 'Tên chứng chỉ là bắt buộc' }),

    issuedBy: Joi.string()
        .required()
        .trim()
        .messages({ 'any.required': 'Đơn vị cấp là bắt buộc' }),

    issueDate: Joi.date()
        .required()
        .max('now')
        .messages({
            'any.required': 'Ngày cấp là bắt buộc',
            'date.max': 'Ngày cấp không được là tương lai',
        }),

    expiryDate: Joi.date()
        .min(Joi.ref('issueDate'))
        .allow(null)
        .messages({ 'date.min': 'Ngày hết hạn phải sau ngày cấp' }),

    documentUrl: Joi.string()
        .trim()
        .custom(url)
        .allow('', null),
});

const salarySchema = Joi.object().keys({
    basicSalary: Joi.number()
        .required()
        .min(0)
        .messages({
            'any.required': 'Lương cơ bản là bắt buộc',
            'number.min': 'Lương cơ bản không thể âm',
        }),

    allowance: Joi.number()
        .min(0)
        .default(0)
        .messages({ 'number.min': 'Phụ cấp không thể âm' }),

    currency: Joi.string()
        .custom(currency)
        .default('VND'),

    paymentFrequency: Joi.string()
        .valid('daily', 'weekly', 'monthly')
        .default('monthly'),

    lastSalaryReview: Joi.date().allow(null),
});

const bankAccountSchema = Joi.object().keys({
    accountName: Joi.string().trim().allow('', null),
    accountNumber: Joi.string().trim().allow('', null),
    bankName: Joi.string().trim().allow('', null),
    bankCode: Joi.string().trim().allow('', null),
});

const emergencyContactSchema = Joi.object().keys({
    name: Joi.string().trim().allow('', null),
    relationship: Joi.string().trim().allow('', null),
    phone: Joi.string()
        .trim()
        .custom(phone)
        .allow('', null),
});

const workHistorySchema = Joi.object().keys({
    companyName: Joi.string().trim(),
    position: Joi.string().trim(),
    startDate: Joi.date(),
    endDate: Joi.date()
        .min(Joi.ref('startDate'))
        .messages({ 'date.min': 'Ngày kết thúc phải sau ngày bắt đầu' }),
    experience: Joi.string().trim(),
});

const createEmployee = {
    body: Joi.object().keys({
        employeeCode: Joi.string()
            .required()
            .trim()
            .uppercase()
            .messages({ 'any.required': 'Mã nhân viên là bắt buộc' }),

        fullName: Joi.string()
            .required()
            .trim()
            .min(3)
            .max(100)
            .messages({
                'any.required': 'Tên đầy đủ là bắt buộc',
                'string.min': 'Tên phải ít nhất 3 ký tự',
                'string.max': 'Tên không quá 100 ký tự',
            }),

        email: Joi.string()
            .required()
            .trim()
            .lowercase()
            .custom(email)
            .messages({ 'any.required': 'Email là bắt buộc' }),

        phone: Joi.string()
            .required()
            .trim()
            .custom(phone)
            .messages({ 'any.required': 'Số điện thoại là bắt buộc' }),

        dateOfBirth: Joi.date()
            .required()
            .max('now')
            .messages({
                'any.required': 'Ngày sinh là bắt buộc',
                'date.max': 'Ngày sinh không hợp lệ',
            }),

        gender: Joi.string()
            .required()
            .valid('Nam', 'Nữ', 'Khác')
            .messages({ 'any.required': 'Giới tính là bắt buộc' }),

        // Giấy tờ tuỳ thân
        idNumber: Joi.string()
            .required()
            .trim()
            .messages({ 'any.required': 'Số CMND/CCCD là bắt buộc' }),

        idIssuedDate: Joi.date()
            .required()
            .max('now')
            .messages({
                'any.required': 'Ngày cấp CMND/CCCD là bắt buộc',
                'date.max': 'Ngày cấp không được là tương lai',
            }),

        idIssuedPlace: Joi.string().trim().allow('', null),

        // Công việc
        position: Joi.string()
            .required()
            .trim()
            .max(50)
            .messages({
                'any.required': 'Chức vụ là bắt buộc',
                'string.max': 'Chức vụ không quá 50 ký tự',
            }),

        department: Joi.string()
            .required()
            .trim()
            .messages({ 'any.required': 'Phòng ban là bắt buộc' }),

        employmentType: Joi.string()
            .valid('full-time', 'part-time', 'contract', 'temporary')
            .default('full-time'),

        hireDate: Joi.date()
            .required()
            .messages({
                'any.required': 'Ngày vào làm là bắt buộc',
                'date.base': 'Ngày vào làm phải là ngày hợp lệ',
            }),

        leaveDate: Joi.date()
            .greater(Joi.ref('hireDate'))
            .allow(null)
            .messages({ 'date.greater': 'Ngày rời phải sau ngày vào làm' }),

        // Lương, kỹ năng, chứng chỉ
        salary: salarySchema.required(),
        skills: Joi.array().items(skillSchema).default([]),
        certifications: Joi.array().items(certificationSchema).default([]),
        bankAccount: bankAccountSchema.allow(null),
        emergencyContact: emergencyContactSchema.allow(null),
        workHistory: Joi.array().items(workHistorySchema).default([]),

        profileImage: Joi.string()
            .trim()
            .custom(url)
            .allow('', null),
    }),
};

const updateEmployee = {
    params: Joi.object().keys({
        employeeId: Joi.string()
            .required()
            .custom(objectId)
            .messages({ 'any.required': 'ID nhân viên là bắt buộc' }),
    }),

    body: Joi.object()
        .keys({
            fullName: Joi.string().trim().min(3).max(100).messages({
                'string.min': 'Tên phải ít nhất 3 ký tự',
                'string.max': 'Tên không quá 100 ký tự',
            }),

            email: Joi.string().trim().lowercase().custom(email),
            phone: Joi.string().trim().custom(phone),
            dateOfBirth: Joi.date().max('now'),
            gender: Joi.string().valid('Nam', 'Nữ', 'Khác'),

            idNumber: Joi.string().trim(),
            idIssuedDate: Joi.date().max('now'),
            idIssuedPlace: Joi.string().trim().allow('', null),

            position: Joi.string().trim().max(50),
            department: Joi.string().trim(),
            employmentType: Joi.string().valid('full-time', 'part-time', 'contract', 'temporary'),
            hireDate: Joi.date(),
            leaveDate: Joi.date().allow(null),

            salary: salarySchema,
            skills: Joi.array().items(skillSchema),
            certifications: Joi.array().items(certificationSchema),
            bankAccount: bankAccountSchema.allow(null),
            emergencyContact: emergencyContactSchema.allow(null),
            workHistory: Joi.array().items(workHistorySchema),

            profileImage: Joi.string().trim().custom(url).allow('', null),
            status: Joi.string().valid('active', 'inactive', 'on_leave', 'terminated'),
        })
        .min(1)
        .messages({ 'object.min': 'Phải cập nhật ít nhất một trường' }),
};

const getEmployee = {
    params: Joi.object().keys({
        employeeId: Joi.string()
            .required()
            .custom(objectId)
            .messages({
                'any.required': 'ID nhân viên là bắt buộc',
                'any.invalid': 'ID nhân viên không hợp lệ',
            }),
    }),
};

const deleteEmployee = {
    params: Joi.object().keys({
        employeeId: Joi.string()
            .required()
            .custom(objectId)
            .messages({
                'any.required': 'ID nhân viên là bắt buộc',
                'any.invalid': 'ID nhân viên không hợp lệ',
            }),
    }),
};

const getEmployees = {
    query: Joi.object().keys({
        page: Joi.number()
            .integer()
            .min(1)
            .default(1)
            .messages({
                'number.base': 'Trang phải là số',
                'number.min': 'Trang phải ≥ 1',
            }),

        limit: Joi.number()
            .integer()
            .min(1)
            .max(100)
            .default(10)
            .messages({
                'number.base': 'Limit phải là số',
                'number.max': 'Limit không quá 100',
            }),

        sortBy: Joi.string()
            .pattern(/^[a-zA-Z]+:(asc|desc)$/)
            .default('createdAt:desc')
            .messages({ 'string.pattern.base': 'Format sortBy: field:asc hoặc field:desc' }),

        keyword: Joi.string()
            .trim()
            .max(100)
            .messages({ 'string.max': 'Keyword không quá 100 ký tự' }),

        department: Joi.string().trim(),
        status: Joi.string().valid('active', 'inactive', 'on_leave', 'terminated'),
        employmentType: Joi.string().valid('full-time', 'part-time', 'contract', 'temporary'),
    }),
};

const updateEmployeeStatus = {
    params: Joi.object().keys({
        employeeId: Joi.string()
            .required()
            .custom(objectId)
            .messages({ 'any.required': 'ID nhân viên là bắt buộc' }),
    }),

    body: Joi.object().keys({
        status: Joi.string()
            .required()
            .valid('active', 'inactive', 'on_leave', 'terminated')
            .messages({ 'any.required': 'Trạng thái là bắt buộc' }),
    }),
};

const updateSalary = {
    params: Joi.object().keys({
        employeeId: Joi.string()
            .required()
            .custom(objectId)
            .messages({ 'any.required': 'ID nhân viên là bắt buộc' }),
    }),

    body: Joi.object().keys({
        basicSalary: Joi.number()
            .required()
            .min(0)
            .messages({
                'any.required': 'Lương cơ bản là bắt buộc',
                'number.min': 'Lương cơ bản không thể âm',
            }),

        allowance: Joi.number()
            .min(0)
            .default(0)
            .messages({ 'number.min': 'Phụ cấp không thể âm' }),
    }),
};

const addSkill = {
    params: Joi.object().keys({
        employeeId: Joi.string()
            .required()
            .custom(objectId)
            .messages({ 'any.required': 'ID nhân viên là bắt buộc' }),
    }),
    body: skillSchema,
};

const updateSkill = {
    params: Joi.object().keys({
        employeeId: Joi.string()
            .required()
            .custom(objectId)
            .messages({ 'any.required': 'ID nhân viên là bắt buộc' }),

        skillName: Joi.string()
            .required()
            .messages({ 'any.required': 'Tên kỹ năng là bắt buộc' }),
    }),

    body: Joi.object()
        .keys({
            level: Joi.string()
                .valid('beginner', 'intermediate', 'advanced', 'expert'),

            yearsOfExperience: Joi.number()
                .min(0)
                .messages({ 'number.min': 'Số năm kinh nghiệm không thể âm' }),

            certification: Joi.string().trim().allow('', null),
        })
        .min(1)
        .messages({ 'object.min': 'Phải cập nhật ít nhất một trường' }),
};

const removeSkill = {
    params: Joi.object().keys({
        employeeId: Joi.string()
            .required()
            .custom(objectId)
            .messages({ 'any.required': 'ID nhân viên là bắt buộc' }),

        skillName: Joi.string()
            .required()
            .messages({ 'any.required': 'Tên kỹ năng là bắt buộc' }),
    }),
};

const addCertification = {
    params: Joi.object().keys({
        employeeId: Joi.string()
            .required()
            .custom(objectId)
            .messages({ 'any.required': 'ID nhân viên là bắt buộc' }),
    }),
    body: certificationSchema,
};

const removeCertification = {
    params: Joi.object().keys({
        employeeId: Joi.string()
            .required()
            .custom(objectId)
            .messages({ 'any.required': 'ID nhân viên là bắt buộc' }),

        certName: Joi.string()
            .required()
            .messages({ 'any.required': 'Tên chứng chỉ là bắt buộc' }),
    }),
};

const getExpiringCertifications = {
    query: Joi.object().keys({
        days: Joi.number()
            .integer()
            .min(1)
            .max(365)
            .default(30)
            .messages({
                'number.base': 'Số ngày phải là số',
                'number.min': 'Số ngày phải ≥ 1',
                'number.max': 'Số ngày không quá 365',
            }),
    }),
};

const assignToProject = {
    params: Joi.object().keys({
        employeeId: Joi.string()
            .required()
            .custom(objectId)
            .messages({ 'any.required': 'ID nhân viên là bắt buộc' }),
    }),

    body: Joi.object().keys({
        projectId: Joi.string()
            .required()
            .custom(objectId)
            .messages({
                'any.required': 'ID dự án là bắt buộc',
                'any.invalid': 'ID dự án không hợp lệ',
            }),

        role: Joi.string()
            .required()
            .custom(teamRole)
            .messages({ 'any.required': 'Vai trò là bắt buộc' }),
    }),
};

const unassignFromProject = {
    params: Joi.object().keys({
        employeeId: Joi.string()
            .required()
            .custom(objectId)
            .messages({ 'any.required': 'ID nhân viên là bắt buộc' }),

        projectId: Joi.string()
            .required()
            .custom(objectId)
            .messages({
                'any.required': 'ID dự án là bắt buộc',
                'any.invalid': 'ID dự án không hợp lệ',
            }),
    }),
};

module.exports = {
    createEmployee,
    getEmployees,
    getEmployee,
    updateEmployee,
    deleteEmployee,
    updateEmployeeStatus,
    updateSalary,
    addSkill,
    updateSkill,
    removeSkill,
    addCertification,
    removeCertification,
    getExpiringCertifications,
    assignToProject,
    unassignFromProject,
};