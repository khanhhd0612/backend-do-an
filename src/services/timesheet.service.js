const Timesheet = require('../models/timesheet.model');
const ApiError = require('../utils/ApiError');

const getTimesheetById = async (id) => {
    const timesheet = await Timesheet.findById(id)
        .populate('employee', 'fullName employeeCode department')
        .populate('project', 'projectName projectCode')
        .populate('approvedBy', 'fullName email')
        .populate('createdBy', 'fullName email');

    if (!timesheet) throw new ApiError(404, 'Không tìm thấy timesheet');
    return timesheet;
};

const checkDuplicate = async (employeeId, projectId, date, excludeId = null) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const query = {
        employee: employeeId,
        project: projectId,
        date: { $gte: startOfDay, $lte: endOfDay },
    };
    if (excludeId) query._id = { $ne: excludeId };

    const exists = await Timesheet.findOne(query);
    if (exists) throw new ApiError(400, 'Timesheet ngày này đã tồn tại cho nhân viên và dự án này');
};

/**
 * Tạo timesheet mới
 * @param {Object}   data
 * @param {ObjectId} createdBy
 */
const createTimesheet = async (data, createdBy) => {
    await checkDuplicate(data.employee, data.project, data.date);

    if (data.checkIn?.time && data.checkOut?.time) {
        if (new Date(data.checkOut.time) <= new Date(data.checkIn.time))
            throw new ApiError(400, 'Thời gian check-out phải sau check-in');
    }

    const totalHours = (data.hours?.regular || 0) + (data.hours?.overtime || 0) + (data.hours?.night || 0);
    if (totalHours > 24)
        throw new ApiError(400, 'Tổng giờ làm không thể vượt quá 24h/ngày');

    return Timesheet.create({ ...data, createdBy });
};

/**
 * Lấy danh sách timesheet (filter + pagination)
 * @param {Object} filter  - { employeeId, projectId, status, startDate, endDate, dayType }
 * @param {Object} options - { page, limit, sortBy }
 */
const getTimesheets = async (filter = {}, options = {}) => {
    const query = {};

    if (filter.employeeId) query.employee = filter.employeeId;
    if (filter.projectId) query.project = filter.projectId;
    if (filter.status) query.status = filter.status;
    if (filter.dayType) query.dayType = filter.dayType;

    if (filter.startDate || filter.endDate) {
        query.date = {};
        if (filter.startDate) query.date.$gte = new Date(filter.startDate);
        if (filter.endDate) query.date.$lte = new Date(filter.endDate);
    }

    return Timesheet.paginate(query, {
        page: options.page || 1,
        limit: options.limit || 10,
        sortBy: options.sortBy || 'date:desc',
        populate: [
            {
                path: 'employee',
                select: 'fullName employeeCode'
            }, {
                path: 'project',
                select: 'projectCode projectName'
            }
        ],
    });
};

/**
 * Lấy timesheet theo ID
 * @param {ObjectId} id
 */
const getTimesheet = async (id) => {
    return getTimesheetById(id);
};

/**
 * Cập nhật timesheet (chỉ khi draft hoặc rejected)
 * @param {ObjectId} id
 * @param {Object}   updateData
 * @param {ObjectId} requesterId  - người thực hiện
 */
const updateTimesheet = async (id, updateData, requesterId) => {
    const timesheet = await getTimesheetById(id);

    if (!['draft', 'rejected'].includes(timesheet.status))
        throw new ApiError(400, 'Chỉ có thể sửa timesheet ở trạng thái draft hoặc rejected');

    if (updateData.date || updateData.employee || updateData.project) {
        await checkDuplicate(
            updateData.employee || timesheet.employee._id,
            updateData.project || timesheet.project._id,
            updateData.date || timesheet.date,
            id
        );
    }

    if (updateData.checkIn?.time && updateData.checkOut?.time) {
        if (new Date(updateData.checkOut.time) <= new Date(updateData.checkIn.time))
            throw new ApiError(400, 'Thời gian check-out phải sau check-in');
    }

    const totalHours =
        (updateData.hours?.regular ?? timesheet.hours.regular) +
        (updateData.hours?.overtime ?? timesheet.hours.overtime) +
        (updateData.hours?.night ?? timesheet.hours.night);
    if (totalHours > 24)
        throw new ApiError(400, 'Tổng giờ làm không thể vượt quá 24h/ngày');

    // Nếu bị reject trước đó → reset về draft khi sửa
    if (timesheet.status === 'rejected') {
        updateData.status = 'draft';
        updateData.rejectedReason = '';
        updateData.approvedBy = null;
        updateData.approvedAt = null;
    }

    Object.assign(timesheet, updateData);
    await timesheet.save();
    return timesheet;
};

/**
 * Xoá timesheet (chỉ khi draft)
 * @param {ObjectId} id
 */
const deleteTimesheet = async (id) => {
    const timesheet = await getTimesheetById(id);

    if (timesheet.status !== 'draft')
        throw new ApiError(400, 'Chỉ có thể xoá timesheet ở trạng thái draft');

    await timesheet.deleteOne();
    return timesheet;
};

/**
 * Check-in
 * @param {ObjectId} id
 * @param {Object}   location - { lat, lng }
 */
const checkIn = async (id, location) => {
    const timesheet = await getTimesheetById(id);
    await timesheet.checkInNow(location);
    return timesheet;
};

/**
 * Check-out
 * @param {ObjectId} id
 * @param {Object}   location - { lat, lng }
 */
const checkOut = async (id, location) => {
    const timesheet = await getTimesheetById(id);
    await timesheet.checkOutNow(location);
    return timesheet;
};

/**
 * Employee submit timesheet để duyệt
 * @param {ObjectId} id
 */
const submitTimesheet = async (id) => {
    const timesheet = await getTimesheetById(id);
    await timesheet.submit();
    return timesheet;
};

/**
 * Supervisor duyệt timesheet
 * @param {ObjectId} id
 * @param {ObjectId} approverId
 */
const approveTimesheet = async (id, approverId) => {
    const timesheet = await getTimesheetById(id);
    await timesheet.approve(approverId);
    return timesheet;
};

/**
 * Supervisor từ chối timesheet
 * @param {ObjectId} id
 * @param {ObjectId} approverId
 * @param {String}   reason
 */
const rejectTimesheet = async (id, approverId, reason) => {
    if (!reason) throw new ApiError(400, 'Lý do từ chối là bắt buộc');
    const timesheet = await getTimesheetById(id);
    await timesheet.reject(approverId, reason);
    return timesheet;
};

/**
 * Duyệt hàng loạt
 * @param {Array}    ids
 * @param {ObjectId} approverId
 */
const bulkApprove = async (ids, approverId) => {
    const results = { success: [], failed: [] };

    await Promise.all(
        ids.map(async (id) => {
            try {
                const timesheet = await getTimesheetById(id);
                await timesheet.approve(approverId);
                results.success.push(id);
            } catch (err) {
                results.failed.push({ id, reason: err.message });
            }
        })
    );

    return results;
};

/**
 * Lấy timesheet của 1 nhân viên trong khoảng thời gian
 * @param {ObjectId} employeeId
 * @param {Date}     startDate
 * @param {Date}     endDate
 */
const getTimesheetsByEmployee = async (employeeId, startDate, endDate) => {
    return Timesheet.findByEmployee(employeeId, startDate, endDate);
};

/**
 * Lấy timesheet của 1 dự án
 * @param {ObjectId} projectId
 * @param {Date}     startDate
 * @param {Date}     endDate
 */
const getTimesheetsByProject = async (projectId, startDate, endDate) => {
    return Timesheet.findByProject(projectId, startDate, endDate);
};

/**
 * Lấy danh sách chờ duyệt
 * @param {ObjectId} projectId - lọc theo dự án (optional)
 */
const getPendingApproval = async (projectId) => {
    return Timesheet.findPendingApproval(projectId);
};

/**
 * Tổng hợp giờ làm của 1 nhân viên
 * @param {ObjectId} employeeId
 * @param {Date}     startDate
 * @param {Date}     endDate
 */
const getEmployeeSummary = async (employeeId, startDate, endDate) => {
    return Timesheet.getSummaryByEmployee(employeeId, startDate, endDate);
};

/**
 * Thống kê tổng quan theo tháng/dự án
 * @param {Object} filter - { projectId, month, year }
 */
const getTimesheetStats = async (filter = {}) => {
    const match = {};

    if (filter.projectId) match.project = new (require('mongoose').Types.ObjectId)(filter.projectId);

    if (filter.month && filter.year) {
        const start = new Date(filter.year, filter.month - 1, 1);
        const end = new Date(filter.year, filter.month, 0, 23, 59, 59);
        match.date = { $gte: start, $lte: end };
    }

    const [byStatus, hoursSummary, byDayType] = await Promise.all([
        Timesheet.aggregate([
            { $match: match },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),

        Timesheet.aggregate([
            { $match: { ...match, status: 'approved' } },
            {
                $group: {
                    _id: null,
                    totalRegular: { $sum: '$hours.regular' },
                    totalOvertime: { $sum: '$hours.overtime' },
                    totalNight: { $sum: '$hours.night' },
                },
            },
        ]),

        Timesheet.aggregate([
            { $match: match },
            { $group: { _id: '$dayType', count: { $sum: 1 } } },
        ]),
    ]);

    return {
        byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
        hours: hoursSummary[0] || { totalRegular: 0, totalOvertime: 0, totalNight: 0 },
        byDayType: Object.fromEntries(byDayType.map((d) => [d._id, d.count])),
    };
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
    getPendingApproval,
    getEmployeeSummary,
    getTimesheetStats,
};