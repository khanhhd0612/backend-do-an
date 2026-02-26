const Payroll = require('../models/payroll.model');
const Timesheet = require('../models/timesheet.model');
const Employee = require('../models/employee.model');
const ApiError = require('../utils/ApiError');

const getPayrollById = async (id) => {
    const payroll = await Payroll.findById(id)
        .populate('employee', 'fullName employeeCode department salary bankAccount')
        .populate('project', 'projectName projectCode')
        .populate('confirmedBy', 'fullName email')
        .populate('createdBy', 'fullName email');

    if (!payroll) throw new ApiError(404, 'Không tìm thấy phiếu lương');
    return payroll;
};

const getPeriodDates = (month, year) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    return { startDate, endDate };
};

// Tổng hợp timesheet đã approved trong kỳ lương
const aggregateTimesheets = async (employeeId, startDate, endDate) => {
    const result = await Timesheet.aggregate([
        {
            $match: {
                employee: new (require('mongoose').Types.ObjectId)(employeeId),
                status: 'approved',
                date: { $gte: startDate, $lte: endDate },
            },
        },
        {
            $group: {
                _id: null,
                actualDays: { $sum: { $cond: [{ $in: ['$dayType', ['normal', 'weekend', 'holiday']] }, 1, 0] } },
                absentDays: { $sum: { $cond: [{ $eq: ['$dayType', 'absent'] }, 1, 0] } },
                leaveDays: { $sum: { $cond: [{ $eq: ['$dayType', 'leave'] }, 1, 0] } },
                regularHours: { $sum: '$hours.regular' },
                overtimeHours: { $sum: '$hours.overtime' },
                nightHours: { $sum: '$hours.night' },
            },
        },
    ]);

    return result[0] || {
        actualDays: 0, absentDays: 0, leaveDays: 0,
        regularHours: 0, overtimeHours: 0, nightHours: 0,
    };
};

/**
 * Tạo phiếu lương cho 1 nhân viên
 * @param {Object}   data      - { employeeId, month, year, projectId, dependents, bonuses, deductions, note }
 * @param {ObjectId} createdBy
 */
const createPayroll = async (data, createdBy) => {
    const { employeeId, month, year, projectId, dependents = 0, bonuses = [], deductions = [], note } = data;

    // Kiểm tra đã có phiếu lương kỳ này chưa
    const existing = await Payroll.findOne({
        employee: employeeId,
        'period.month': month,
        'period.year': year,
    });
    if (existing) throw new ApiError(400, `Phiếu lương tháng ${month}/${year} đã tồn tại`);

    // Lấy thông tin nhân viên
    const employee = await Employee.findById(employeeId);
    if (!employee) throw new ApiError(404, 'Không tìm thấy nhân viên');
    if (employee.status !== 'active')
        throw new ApiError(400, 'Nhân viên không đang hoạt động');

    // Tổng hợp timesheet
    const { startDate, endDate } = getPeriodDates(month, year);
    const timesheetData = await aggregateTimesheets(employeeId, startDate, endDate);

    // Tạo phiếu lương
    const payroll = new Payroll({
        employee: employeeId,
        project: projectId || null,
        period: { month, year, startDate, endDate },
        workDays: {
            standard: 26,
            actual: timesheetData.actualDays,
            absent: timesheetData.absentDays,
            leave: timesheetData.leaveDays,
        },
        hours: {
            regular: timesheetData.regularHours,
            overtime: timesheetData.overtimeHours,
            night: timesheetData.nightHours,
        },
        basicSalary: employee.salary.basicSalary,
        allowance: employee.salary.allowance,
        personalIncomeTax: { dependents, dependentAmount: dependents * 4400000 },
        bonuses,
        deductions,
        note,
        createdBy,
    });

    // Tính lương
    payroll.calculate();
    await payroll.save();
    return payroll;
};

/**
 * Tạo phiếu lương hàng loạt cho tất cả nhân viên active trong kỳ
 * @param {Number}   month
 * @param {Number}   year
 * @param {ObjectId} createdBy
 */
const bulkCreatePayroll = async (month, year, createdBy) => {
    const employees = await Employee.find({ status: 'active' }).select('_id salary');
    const results = { success: [], failed: [] };

    await Promise.all(
        employees.map(async (emp) => {
            try {
                const payroll = await createPayroll(
                    { employeeId: emp._id, month, year },
                    createdBy
                );
                results.success.push({ employeeId: emp._id, payrollId: payroll._id });
            } catch (err) {
                results.failed.push({ employeeId: emp._id, reason: err.message });
            }
        })
    );

    return results;
};

/**
 * Danh sách phiếu lương (filter + pagination)
 * @param {Object} filter  - { month, year, status, employeeId, projectId }
 * @param {Object} options - { page, limit, sortBy }
 */
const getPayrolls = async (filter = {}, options = {}) => {
    const query = {};

    if (filter.month) query['period.month'] = Number(filter.month);
    if (filter.year) query['period.year'] = Number(filter.year);
    if (filter.status) query.status = filter.status;
    if (filter.employeeId) query.employee = filter.employeeId;
    if (filter.projectId) query.project = filter.projectId;

    return Payroll.paginate(query, {
        page: options.page || 1,
        limit: options.limit || 10,
        sortBy: options.sortBy || 'createdAt:desc',
        populate: {
            path: 'employee',
            select: 'fullName employeeCode department'
        },
    });
};

/**
 * Chi tiết phiếu lương
 * @param {ObjectId} id
 */
const getPayroll = async (id) => {
    return getPayrollById(id);
};

/**
 * Lịch sử lương nhân viên
 * @param {ObjectId} employeeId
 */
const getPayrollsByEmployee = async (employeeId) => {
    return Payroll.findByEmployee(employeeId);
};

/**
 * Danh sách phiếu lương theo kỳ
 * @param {Number} month
 * @param {Number} year
 */
const getPayrollsByPeriod = async (month, year) => {
    return Payroll.findByPeriod(month, year);
};

/**
 * Cập nhật phiếu lương (chỉ khi draft)
 * @param {ObjectId} id
 * @param {Object}   updateData - { bonuses, deductions, note, dependents }
 */
const updatePayroll = async (id, updateData) => {
    const payroll = await getPayrollById(id);

    if (payroll.status !== 'draft')
        throw new ApiError(400, 'Chỉ có thể sửa phiếu lương ở trạng thái draft');

    if (updateData.bonuses !== undefined) payroll.bonuses = updateData.bonuses;
    if (updateData.deductions !== undefined) payroll.deductions = updateData.deductions;
    if (updateData.note !== undefined) payroll.note = updateData.note;

    if (updateData.dependents !== undefined) {
        payroll.personalIncomeTax.dependents = updateData.dependents;
        payroll.personalIncomeTax.dependentAmount = updateData.dependents * 4400000;
    }

    // Tính lại lương
    payroll.calculate();
    await payroll.save();
    return payroll;
};

/**
 * Tính lại lương (khi timesheet thay đổi)
 * @param {ObjectId} id
 */
const recalculatePayroll = async (id) => {
    const payroll = await getPayrollById(id);

    if (!['draft', 'confirmed'].includes(payroll.status))
        throw new ApiError(400, 'Không thể tính lại phiếu lương đã thanh toán');

    const { startDate, endDate } = getPeriodDates(payroll.period.month, payroll.period.year);
    const timesheetData = await aggregateTimesheets(payroll.employee._id, startDate, endDate);

    payroll.workDays.actual = timesheetData.actualDays;
    payroll.workDays.absent = timesheetData.absentDays;
    payroll.workDays.leave = timesheetData.leaveDays;
    payroll.hours.regular = timesheetData.regularHours;
    payroll.hours.overtime = timesheetData.overtimeHours;
    payroll.hours.night = timesheetData.nightHours;

    payroll.calculate();
    await payroll.save();
    return payroll;
};

/**
 * Xác nhận phiếu lương (draft → confirmed)
 * @param {ObjectId} id
 * @param {ObjectId} userId
 */
const confirmPayroll = async (id, userId) => {
    const payroll = await getPayrollById(id);
    await payroll.confirm(userId);
    return payroll;
};

/**
 * Xác nhận hàng loạt theo kỳ
 * @param {Number}   month
 * @param {Number}   year
 * @param {ObjectId} userId
 */
const bulkConfirmPayroll = async (month, year, userId) => {
    const payrolls = await Payroll.find({
        'period.month': month,
        'period.year': year,
        status: 'draft',
    });

    const results = { success: [], failed: [] };
    await Promise.all(
        payrolls.map(async (p) => {
            try {
                await p.confirm(userId);
                results.success.push(p._id);
            } catch (err) {
                results.failed.push({ id: p._id, reason: err.message });
            }
        })
    );
    return results;
};

/**
 * Đánh dấu đã thanh toán (confirmed → paid)
 * @param {ObjectId} id
 * @param {String}   method    - bank_transfer | cash
 * @param {String}   reference - mã giao dịch
 */
const markAsPaid = async (id, method, reference) => {
    const payroll = await getPayrollById(id);
    await payroll.markAsPaid(method, reference);
    return payroll;
};

/**
 * Huỷ phiếu lương
 * @param {ObjectId} id
 */
const cancelPayroll = async (id) => {
    const payroll = await getPayrollById(id);

    if (payroll.status === 'paid')
        throw new ApiError(400, 'Không thể huỷ phiếu lương đã thanh toán');

    payroll.status = 'cancelled';
    await payroll.save();
    return payroll;
};

/**
 * Thống kê tổng chi phí lương theo kỳ
 * @param {Number} month
 * @param {Number} year
 */
const getPeriodStats = async (month, year) => {
    return Payroll.getPeriodStats(month, year);
};

module.exports = {
    createPayroll,
    bulkCreatePayroll,
    getPayrolls,
    getPayroll,
    getPayrollsByEmployee,
    getPayrollsByPeriod,
    updatePayroll,
    recalculatePayroll,
    confirmPayroll,
    bulkConfirmPayroll,
    markAsPaid,
    cancelPayroll,
    getPeriodStats,
};