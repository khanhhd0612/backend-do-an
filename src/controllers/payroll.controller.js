const catchAsync = require('../utils/catchAsync');
const payrollService = require('../services/payroll.service');

const createPayroll = catchAsync(async (req, res) => {
    const payroll = await payrollService.createPayroll(req.body, req.user._id);
    res.status(201).json({
        success: true,
        message: 'Tạo phiếu lương thành công',
        data: payroll,
    });
});

const bulkCreatePayroll = catchAsync(async (req, res) => {
    const results = await payrollService.bulkCreatePayroll(
        req.body.month,
        req.body.year,
        req.user._id
    );
    res.status(201).json({
        success: true,
        message: `Tạo thành công ${results.success.length}, thất bại ${results.failed.length}`,
        data: results,
    });
});

const getPayrolls = catchAsync(async (req, res) => {
    const result = await payrollService.getPayrolls(req.query, req.query);
    res.status(200).json({ success: true, data: result });
});

const getPayroll = catchAsync(async (req, res) => {
    const payroll = await payrollService.getPayroll(req.params.payrollId);
    res.status(200).json({ success: true, data: payroll });
});

const getPayrollsByEmployee = catchAsync(async (req, res) => {
    const data = await payrollService.getPayrollsByEmployee(req.params.employeeId);
    res.status(200).json({ success: true, data });
});

const getPayrollsByPeriod = catchAsync(async (req, res) => {
    const data = await payrollService.getPayrollsByPeriod(req.query.month, req.query.year);
    res.status(200).json({ success: true, data });
});

const updatePayroll = catchAsync(async (req, res) => {
    const payroll = await payrollService.updatePayroll(req.params.payrollId, req.body);
    res.status(200).json({
        success: true,
        message: 'Cập nhật phiếu lương thành công',
        data: payroll,
    });
});

const recalculatePayroll = catchAsync(async (req, res) => {
    const payroll = await payrollService.recalculatePayroll(req.params.payrollId);
    res.status(200).json({
        success: true,
        message: 'Đã tính lại phiếu lương',
        data: payroll.summary,
    });
});

const confirmPayroll = catchAsync(async (req, res) => {
    const payroll = await payrollService.confirmPayroll(req.params.payrollId, req.user._id);
    res.status(200).json({
        success: true,
        message: 'Xác nhận phiếu lương thành công',
        data: { status: payroll.status, confirmedAt: payroll.confirmedAt },
    });
});

const bulkConfirmPayroll = catchAsync(async (req, res) => {
    const results = await payrollService.bulkConfirmPayroll(
        req.body.month,
        req.body.year,
        req.user._id
    );
    res.status(200).json({
        success: true,
        message: `Xác nhận thành công ${results.success.length}, thất bại ${results.failed.length}`,
        data: results,
    });
});

const markAsPaid = catchAsync(async (req, res) => {
    const payroll = await payrollService.markAsPaid(
        req.params.payrollId,
        req.body.method,
        req.body.reference
    );
    res.status(200).json({
        success: true,
        message: 'Đã đánh dấu thanh toán',
        data: { status: payroll.status, payment: payroll.payment },
    });
});

const cancelPayroll = catchAsync(async (req, res) => {
    await payrollService.cancelPayroll(req.params.payrollId);
    res.status(200).json({
        success: true,
        message: 'Đã huỷ phiếu lương',
    });
});

const getPeriodStats = catchAsync(async (req, res) => {
    const data = await payrollService.getPeriodStats(req.query.month, req.query.year);
    res.status(200).json({ success: true, data });
});

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