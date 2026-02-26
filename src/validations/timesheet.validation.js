const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createTimesheet = {
    body: Joi.object().keys({
        employee: Joi.string()
            .required()
            .custom(objectId)
            .messages({ 'any.required': 'Nhân viên là bắt buộc' }),

        project: Joi.string()
            .required()
            .custom(objectId)
            .messages({ 'any.required': 'Dự án là bắt buộc' }),

        date: Joi.date()
            .required()
            .max('now')
            .messages({
                'any.required': 'Ngày chấm công là bắt buộc',
                'date.max': 'Ngày chấm công không được là tương lai',
            }),

        checkIn: Joi.object().keys({
            time: Joi.date().allow(null),
            note: Joi.string().trim().max(200).allow('', null),
            location: Joi.object().keys({
                lat: Joi.number().min(-90).max(90),
                lng: Joi.number().min(-180).max(180),
            }),
        }),

        checkOut: Joi.object().keys({
            time: Joi.date()
                .when('checkIn.time', {
                    is: Joi.date().required(),
                    then: Joi.date().greater(Joi.ref('checkIn.time')),
                    otherwise: Joi.date()
                })
                .allow(null)
                .messages({
                    'date.greater': 'Check-out phải sau check-in'
                }),
            note: Joi.string().trim().max(200).allow('', null),
            location: Joi.object().keys({
                lat: Joi.number().min(-90).max(90),
                lng: Joi.number().min(-180).max(180),
            }),
        }),

        hours: Joi.object().keys({
            regular: Joi.number().min(0).max(24).default(0),
            overtime: Joi.number().min(0).max(12).default(0),
            night: Joi.number().min(0).max(12).default(0),
        }),

        dayType: Joi.string()
            .valid('normal', 'weekend', 'holiday', 'absent', 'leave')
            .default('normal'),

        absence: Joi.object().keys({
            type: Joi.string().valid('annual_leave', 'sick_leave', 'unpaid_leave', 'other').allow(null),
            reason: Joi.string().trim().max(300).allow('', null),
            approved: Joi.boolean().default(false),
        }),

        workDescription: Joi.string()
            .trim()
            .max(500)
            .allow('', null)
            .messages({ 'string.max': 'Mô tả công việc không quá 500 ký tự' }),
    }),
};

const updateTimesheet = {
    params: Joi.object().keys({
        timesheetId: Joi.string()
            .required()
            .custom(objectId)
            .messages({ 'any.required': 'ID timesheet là bắt buộc' }),
    }),

    body: Joi.object()
        .keys({
            date: Joi.date()
                .max('now')
                .messages({ 'date.max': 'Ngày chấm công không được là tương lai' }),

            checkIn: Joi.object().keys({
                time: Joi.date().allow(null),
                note: Joi.string().trim().max(200).allow('', null),
                location: Joi.object().keys({
                    lat: Joi.number().min(-90).max(90),
                    lng: Joi.number().min(-180).max(180),
                }),
            }),

            checkOut: Joi.object().keys({
                time: Joi.date().allow(null),
                note: Joi.string().trim().max(200).allow('', null),
                location: Joi.object().keys({
                    lat: Joi.number().min(-90).max(90),
                    lng: Joi.number().min(-180).max(180),
                }),
            }),

            hours: Joi.object().keys({
                regular: Joi.number().min(0).max(24),
                overtime: Joi.number().min(0).max(12),
                night: Joi.number().min(0).max(12),
            }),

            dayType: Joi.string().valid('normal', 'weekend', 'holiday', 'absent', 'leave'),

            absence: Joi.object().keys({
                type: Joi.string().valid('annual_leave', 'sick_leave', 'unpaid_leave', 'other').allow(null),
                reason: Joi.string().trim().max(300).allow('', null),
                approved: Joi.boolean(),
            }),

            workDescription: Joi.string().trim().max(500).allow('', null),
        })
        .min(1)
        .messages({ 'object.min': 'Phải cập nhật ít nhất một trường' }),
};

const getTimesheet = {
    params: Joi.object().keys({
        timesheetId: Joi.string()
            .required()
            .custom(objectId)
            .messages({
                'any.required': 'ID timesheet là bắt buộc',
                'any.invalid': 'ID timesheet không hợp lệ',
            }),
    }),
};

const deleteTimesheet = {
    params: Joi.object().keys({
        timesheetId: Joi.string()
            .required()
            .custom(objectId)
            .messages({ 'any.required': 'ID timesheet là bắt buộc' }),
    }),
};

const getTimesheets = {
    query: Joi.object().keys({
        employeeId: Joi.string().custom(objectId),
        projectId: Joi.string().custom(objectId),
        status: Joi.string().valid('draft', 'submitted', 'approved', 'rejected'),
        dayType: Joi.string().valid('normal', 'weekend', 'holiday', 'absent', 'leave'),
        startDate: Joi.date().messages({ 'date.base': 'Ngày bắt đầu không hợp lệ' }),
        endDate: Joi.date().min(Joi.ref('startDate')).messages({
            'date.base': 'Ngày kết thúc không hợp lệ',
            'date.min': 'Ngày kết thúc phải sau ngày bắt đầu',
        }),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        sortBy: Joi.string().pattern(/^[a-zA-Z]+:(asc|desc)$/).default('date:desc')
            .messages({ 'string.pattern.base': 'Format sortBy: field:asc hoặc field:desc' }),
    }),
};

const checkIn = {
    params: Joi.object().keys({
        timesheetId: Joi.string().required().custom(objectId),
    }),
    body: Joi.object().keys({
        location: Joi.object().keys({
            lat: Joi.number().min(-90).max(90),
            lng: Joi.number().min(-180).max(180),
        }),
        note: Joi.string().trim().max(200).allow('', null),
    }),
};

const checkOut = {
    params: Joi.object().keys({
        timesheetId: Joi.string().required().custom(objectId),
    }),
    body: Joi.object().keys({
        location: Joi.object().keys({
            lat: Joi.number().min(-90).max(90),
            lng: Joi.number().min(-180).max(180),
        }),
        note: Joi.string().trim().max(200).allow('', null),
    }),
};

const submitTimesheet = {
    params: Joi.object().keys({
        timesheetId: Joi.string().required().custom(objectId)
            .messages({ 'any.required': 'ID timesheet là bắt buộc' }),
    }),
};

const approveTimesheet = {
    params: Joi.object().keys({
        timesheetId: Joi.string().required().custom(objectId)
            .messages({ 'any.required': 'ID timesheet là bắt buộc' }),
    }),
};

const rejectTimesheet = {
    params: Joi.object().keys({
        timesheetId: Joi.string().required().custom(objectId)
            .messages({ 'any.required': 'ID timesheet là bắt buộc' }),
    }),
    body: Joi.object().keys({
        reason: Joi.string()
            .required()
            .trim()
            .min(5)
            .max(300)
            .messages({
                'any.required': 'Lý do từ chối là bắt buộc',
                'string.min': 'Lý do phải ít nhất 5 ký tự',
                'string.max': 'Lý do không quá 300 ký tự',
            }),
    }),
};

const bulkApprove = {
    body: Joi.object().keys({
        ids: Joi.array()
            .items(Joi.string().custom(objectId))
            .min(1)
            .required()
            .messages({
                'any.required': 'Danh sách ID là bắt buộc',
                'array.min': 'Phải có ít nhất 1 timesheet',
            }),
    }),
};

const getTimesheetsByEmployee = {
    params: Joi.object().keys({
        employeeId: Joi.string().required().custom(objectId)
            .messages({ 'any.required': 'ID nhân viên là bắt buộc' }),
    }),
    query: Joi.object().keys({
        startDate: Joi.date(),
        endDate: Joi.date().min(Joi.ref('startDate')),
    }),
};

const getTimesheetsByProject = {
    params: Joi.object().keys({
        projectId: Joi.string().required().custom(objectId)
            .messages({ 'any.required': 'ID dự án là bắt buộc' }),
    }),
    query: Joi.object().keys({
        startDate: Joi.date(),
        endDate: Joi.date().min(Joi.ref('startDate')),
    }),
};

const getEmployeeSummary = {
    params: Joi.object().keys({
        employeeId: Joi.string().required().custom(objectId)
            .messages({ 'any.required': 'ID nhân viên là bắt buộc' }),
    }),
    query: Joi.object().keys({
        startDate: Joi.date(),
        endDate: Joi.date().min(Joi.ref('startDate')),
    }),
};

const getTimesheetStats = {
    query: Joi.object().keys({
        projectId: Joi.string().custom(objectId),
        month: Joi.number().integer().min(1).max(12)
            .messages({ 'number.min': 'Tháng từ 1-12', 'number.max': 'Tháng từ 1-12' }),
        year: Joi.number().integer().min(2000).max(2100),
    }),
};

module.exports = {
    createTimesheet,
    getTimesheets,
    getTimesheet,
    updateTimesheet,
    deleteTimesheet,
    checkIn,
    checkOut,
    submitTimesheet,
    approveTimesheet,
    rejectTimesheet,
    bulkApprove,
    getTimesheetsByEmployee,
    getTimesheetsByProject,
    getEmployeeSummary,
    getTimesheetStats,
};