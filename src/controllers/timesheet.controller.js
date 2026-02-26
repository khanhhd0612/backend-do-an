const catchAsync = require('../utils/catchAsync');
const timesheetService = require('../services/timesheet.service');
const pick = require('../utils/pick');

const createTimesheet = catchAsync(async (req, res) => {
    const timesheet = await timesheetService.createTimesheet(req.body, req.user._id);
    res.status(201).json({
        success: true,
        message: 'Tạo timesheet thành công',
        data: timesheet,
    });
});

const getTimesheets = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['employeeId', 'projectId', 'status', 'dayType', 'startDate', 'endDate']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);

    const result = await timesheetService.getTimesheets(filter,options);

    res.status(200).json({ success: true, data: result });
});

const getTimesheet = catchAsync(async (req, res) => {
    const timesheet = await timesheetService.getTimesheet(req.params.timesheetId);
    res.status(200).json({ success: true, data: timesheet });
});

const updateTimesheet = catchAsync(async (req, res) => {
    const timesheet = await timesheetService.updateTimesheet(
        req.params.timesheetId,
        req.body,
        req.user._id
    );
    res.status(200).json({
        success: true,
        message: 'Cập nhật timesheet thành công',
        data: timesheet,
    });
});

const deleteTimesheet = catchAsync(async (req, res) => {
    await timesheetService.deleteTimesheet(req.params.timesheetId);
    res.status(200).json({
        success: true,
        message: 'Xoá timesheet thành công',
    });
});

const checkIn = catchAsync(async (req, res) => {
    const timesheet = await timesheetService.checkIn(req.params.timesheetId, req.body.location);
    res.status(200).json({
        success: true,
        message: 'Check-in thành công',
        data: { checkIn: timesheet.checkIn },
    });
});

const checkOut = catchAsync(async (req, res) => {
    const timesheet = await timesheetService.checkOut(req.params.timesheetId, req.body.location);
    res.status(200).json({
        success: true,
        message: 'Check-out thành công',
        data: { checkOut: timesheet.checkOut, hours: timesheet.hours },
    });
});

const submitTimesheet = catchAsync(async (req, res) => {
    const timesheet = await timesheetService.submitTimesheet(req.params.timesheetId);
    res.status(200).json({
        success: true,
        message: 'Đã gửi timesheet để duyệt',
        data: { status: timesheet.status, submittedAt: timesheet.submittedAt },
    });
});

const approveTimesheet = catchAsync(async (req, res) => {
    const timesheet = await timesheetService.approveTimesheet(req.params.timesheetId, req.user._id);
    res.status(200).json({
        success: true,
        message: 'Duyệt timesheet thành công',
        data: { status: timesheet.status, approvedAt: timesheet.approvedAt },
    });
});

const rejectTimesheet = catchAsync(async (req, res) => {
    const timesheet = await timesheetService.rejectTimesheet(
        req.params.timesheetId,
        req.user._id,
        req.body.reason
    );
    res.status(200).json({
        success: true,
        message: 'Đã từ chối timesheet',
        data: { status: timesheet.status, rejectedReason: timesheet.rejectedReason },
    });
});

const bulkApprove = catchAsync(async (req, res) => {
    const results = await timesheetService.bulkApprove(req.body.ids, req.user._id);
    res.status(200).json({
        success: true,
        message: `Duyệt thành công ${results.success.length}, thất bại ${results.failed.length}`,
        data: results,
    });
});

const getTimesheetsByEmployee = catchAsync(async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await timesheetService.getTimesheetsByEmployee(
        req.params.employeeId,
        startDate,
        endDate
    );
    res.status(200).json({ success: true, data });
});

const getTimesheetsByProject = catchAsync(async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await timesheetService.getTimesheetsByProject(
        req.params.projectId,
        startDate,
        endDate
    );
    res.status(200).json({ success: true, data });
});

const getPendingApproval = catchAsync(async (req, res) => {
    const data = await timesheetService.getPendingApproval(req.query.projectId);
    res.status(200).json({ success: true, data });
});

const getEmployeeSummary = catchAsync(async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await timesheetService.getEmployeeSummary(
        req.params.employeeId,
        startDate,
        endDate
    );
    res.status(200).json({ success: true, data });
});

const getTimesheetStats = catchAsync(async (req, res) => {
    const data = await timesheetService.getTimesheetStats(req.query);
    res.status(200).json({ success: true, data });
});

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