const Joi = require('joi');
const { objectId } = require('./custom.validation');

const bonusSchema = Joi.object().keys({
    type: Joi.string().valid('kpi', 'project', 'attendance', 'other').required()
        .messages({ 'any.required': 'Loại thưởng là bắt buộc' }),
    amount: Joi.number().min(0).required()
        .messages({ 'any.required': 'Số tiền thưởng là bắt buộc' }),
    description: Joi.string().trim().max(200).allow('', null),
});

const deductionSchema = Joi.object().keys({
    type: Joi.string().valid('absent', 'late', 'damage', 'advance', 'other').required()
        .messages({ 'any.required': 'Loại khấu trừ là bắt buộc' }),
    amount: Joi.number().min(0).required()
        .messages({ 'any.required': 'Số tiền khấu trừ là bắt buộc' }),
    description: Joi.string().trim().max(200).allow('', null),
});

const createPayroll = {
    body: Joi.object().keys({
        employeeId: Joi.string()
            .required()
            .custom(objectId)
            .messages({ 'any.required': 'ID nhân viên là bắt buộc' }),

        month: Joi.number()
            .required()
            .integer()
            .min(1)
            .max(12)
            .messages({
                'any.required': 'Tháng là bắt buộc',
                'number.min': 'Tháng từ 1-12',
                'number.max': 'Tháng từ 1-12',
            }),

        year: Joi.number()
            .required()
            .integer()
            .min(2000)
            .max(2100)
            .messages({ 'any.required': 'Năm là bắt buộc' }),

        projectId: Joi.string().custom(objectId).allow(null),
        dependents: Joi.number().integer().min(0).default(0),
        bonuses: Joi.array().items(bonusSchema).default([]),
        deductions: Joi.array().items(deductionSchema).default([]),
        note: Joi.string().trim().max(500).allow('', null),
    }),
};

const bulkCreatePayroll = {
    body: Joi.object().keys({
        month: Joi.number().required().integer().min(1).max(12)
            .messages({ 'any.required': 'Tháng là bắt buộc' }),
        year: Joi.number().required().integer().min(2000).max(2100)
            .messages({ 'any.required': 'Năm là bắt buộc' }),
    }),
};

const getPayrolls = {
    query: Joi.object().keys({
        month: Joi.number().integer().min(1).max(12),
        year: Joi.number().integer().min(2000).max(2100),
        status: Joi.string().valid('draft', 'confirmed', 'paid', 'cancelled'),
        employeeId: Joi.string().custom(objectId),
        projectId: Joi.string().custom(objectId),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        sortBy: Joi.string().pattern(/^[a-zA-Z.]+:(asc|desc)$/).default('createdAt:desc')
            .messages({ 'string.pattern.base': 'Format sortBy: field:asc hoặc field:desc' }),
    }),
};

const getPayroll = {
    params: Joi.object().keys({
        payrollId: Joi.string().required().custom(objectId)
            .messages({ 'any.required': 'ID phiếu lương là bắt buộc' }),
    }),
};

const getPayrollsByEmployee = {
    params: Joi.object().keys({
        employeeId: Joi.string().required().custom(objectId)
            .messages({ 'any.required': 'ID nhân viên là bắt buộc' }),
    }),
};

const getPayrollsByPeriod = {
    query: Joi.object().keys({
        month: Joi.number().required().integer().min(1).max(12)
            .messages({ 'any.required': 'Tháng là bắt buộc' }),
        year: Joi.number().required().integer().min(2000).max(2100)
            .messages({ 'any.required': 'Năm là bắt buộc' }),
    }),
};

const updatePayroll = {
    params: Joi.object().keys({
        payrollId: Joi.string().required().custom(objectId)
            .messages({ 'any.required': 'ID phiếu lương là bắt buộc' }),
    }),
    body: Joi.object()
        .keys({
            bonuses: Joi.array().items(bonusSchema),
            deductions: Joi.array().items(deductionSchema),
            dependents: Joi.number().integer().min(0),
            note: Joi.string().trim().max(500).allow('', null),
        })
        .min(1)
        .messages({ 'object.min': 'Phải cập nhật ít nhất một trường' }),
};

const confirmPayroll = {
    params: Joi.object().keys({
        payrollId: Joi.string().required().custom(objectId)
            .messages({ 'any.required': 'ID phiếu lương là bắt buộc' }),
    }),
};

const bulkConfirmPayroll = {
    body: Joi.object().keys({
        month: Joi.number().required().integer().min(1).max(12)
            .messages({ 'any.required': 'Tháng là bắt buộc' }),
        year: Joi.number().required().integer().min(2000).max(2100)
            .messages({ 'any.required': 'Năm là bắt buộc' }),
    }),
};

const markAsPaid = {
    params: Joi.object().keys({
        payrollId: Joi.string().required().custom(objectId)
            .messages({ 'any.required': 'ID phiếu lương là bắt buộc' }),
    }),
    body: Joi.object().keys({
        method: Joi.string().valid('bank_transfer', 'cash').default('bank_transfer'),
        reference: Joi.string().trim().max(100).allow('', null),
    }),
};

const cancelPayroll = {
    params: Joi.object().keys({
        payrollId: Joi.string().required().custom(objectId)
            .messages({ 'any.required': 'ID phiếu lương là bắt buộc' }),
    }),
};

const getPeriodStats = {
    query: Joi.object().keys({
        month: Joi.number().required().integer().min(1).max(12)
            .messages({ 'any.required': 'Tháng là bắt buộc' }),
        year: Joi.number().required().integer().min(2000).max(2100)
            .messages({ 'any.required': 'Năm là bắt buộc' }),
    }),
};

module.exports = {
    createPayroll,
    bulkCreatePayroll,
    getPayrolls,
    getPayroll,
    getPayrollsByEmployee,
    getPayrollsByPeriod,
    updatePayroll,
    confirmPayroll,
    bulkConfirmPayroll,
    markAsPaid,
    cancelPayroll,
    getPeriodStats,
};