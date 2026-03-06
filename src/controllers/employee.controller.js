const catchAsync = require('../utils/catchAsync');
const employeeService = require('../services/employee.service');
const pick = require('../utils/pick');

const createEmployee = catchAsync(async (req, res) => {
    const employee = await employeeService.createEmployee(req.body, req.user._id);
    res.status(201).json({
        success: true,
        message: 'Tạo nhân viên thành công',
        data: employee,
    });
});

const getEmployees = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['department', 'status', 'employmentType', 'employeeCode']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);

    const result = await employeeService.getEmployees(filter, options);

    res.status(200).json({
        success: true,
        data: result,
    });
});

const getEmployee = catchAsync(async (req, res) => {
    const employee = await employeeService.getEmployeeById(req.params.employeeId);
    res.status(200).json({
        success: true,
        data: employee,
    });
});

const updateEmployee = catchAsync(async (req, res) => {
    const employee = await employeeService.updateEmployee(req.params.employeeId, req.body);
    res.status(200).json({
        success: true,
        message: 'Cập nhật nhân viên thành công',
        data: employee,
    });
});

const deleteEmployee = catchAsync(async (req, res) => {
    await employeeService.deleteEmployee(req.params.employeeId);
    res.status(200).json({
        success: true,
        message: 'Đã chấm dứt hợp đồng nhân viên',
    });
});

const hardDeleteEmployee = catchAsync(async (req, res) => {
    await employeeService.hardDeleteEmployee(req.params.employeeId);
    res.status(200).json({
        success: true,
        message: 'Đã xoá nhân viên khỏi hệ thống',
    });
});

const updateEmployeeStatus = catchAsync(async (req, res) => {
    const employee = await employeeService.updateEmployeeStatus(
        req.params.employeeId,
        req.body.status
    );
    res.status(200).json({
        success: true,
        message: `Cập nhật trạng thái thành công`,
        data: { status: employee.status },
    });
});

const getEmployeesByDepartment = catchAsync(async (req, res) => {
    const employees = await employeeService.getEmployeesByDepartment(req.params.department);
    res.status(200).json({
        success: true,
        data: employees,
    });
});

const getEmployeeStats = catchAsync(async (req, res) => {
    const stats = await employeeService.getEmployeeStats();
    res.status(200).json({
        success: true,
        data: stats,
    });
});

const getSalaryInfo = catchAsync(async (req, res) => {
    const data = await employeeService.getSalaryInfo(req.params.employeeId);
    res.status(200).json({
        success: true,
        data,
    });
});

const updateSalary = catchAsync(async (req, res) => {
    const employee = await employeeService.updateSalary(
        req.params.employeeId,
        req.body.basicSalary,
        req.body.allowance
    );
    res.status(200).json({
        success: true,
        message: 'Cập nhật lương thành công',
        data: employee.salary,
    });
});

const addSkill = catchAsync(async (req, res) => {
    const employee = await employeeService.addSkill(req.params.employeeId, req.body);
    res.status(200).json({
        success: true,
        message: 'Thêm kỹ năng thành công',
        data: employee.skills,
    });
});

const updateSkill = catchAsync(async (req, res) => {
    const employee = await employeeService.updateSkill(
        req.params.employeeId,
        req.params.skillName,
        req.body
    );
    res.status(200).json({
        success: true,
        message: 'Cập nhật kỹ năng thành công',
        data: employee.skills,
    });
});

const removeSkill = catchAsync(async (req, res) => {
    const employee = await employeeService.removeSkill(
        req.params.employeeId,
        req.params.skillName
    );
    res.status(200).json({
        success: true,
        message: 'Xoá kỹ năng thành công',
        data: employee.skills,
    });
});

const addCertification = catchAsync(async (req, res) => {
    const employee = await employeeService.addCertification(req.params.employeeId, req.body);
    res.status(200).json({
        success: true,
        message: 'Thêm chứng chỉ thành công',
        data: employee.certifications,
    });
});

const removeCertification = catchAsync(async (req, res) => {
    const employee = await employeeService.removeCertification(
        req.params.employeeId,
        req.params.certName
    );
    res.status(200).json({
        success: true,
        message: 'Xoá chứng chỉ thành công',
        data: employee.certifications,
    });
});

const getExpiringCertifications = catchAsync(async (req, res) => {
    const data = await employeeService.getExpiringCertifications(req.query.days);
    res.status(200).json({
        success: true,
        data,
    });
});

const assignToProject = catchAsync(async (req, res) => {
    const employee = await employeeService.assignToProject(
        req.params.employeeId,
        req.body.projectId,
        req.body.role
    );
    res.status(200).json({
        success: true,
        message: 'Gán dự án thành công',
        data: employee.projectAssignments,
    });
});

const unassignFromProject = catchAsync(async (req, res) => {
    const employee = await employeeService.unassignFromProject(
        req.params.employeeId,
        req.params.projectId
    );
    res.status(200).json({
        success: true,
        message: 'Gỡ khỏi dự án thành công',
        data: employee.projectAssignments,
    });
});

const getActiveProjects = catchAsync(async (req, res) => {
    const projects = await employeeService.getActiveProjects(req.params.employeeId);
    res.status(200).json({
        success: true,
        data: projects,
    });
});

module.exports = {
    // CRUD
    createEmployee,
    getEmployees,
    getEmployee,
    updateEmployee,
    deleteEmployee,
    hardDeleteEmployee,
    // Trạng thái
    updateEmployeeStatus,
    getEmployeesByDepartment,
    getEmployeeStats,
    // Lương
    getSalaryInfo,
    updateSalary,
    // Kỹ năng
    addSkill,
    updateSkill,
    removeSkill,
    // Chứng chỉ
    addCertification,
    removeCertification,
    getExpiringCertifications,
    // Dự án
    assignToProject,
    unassignFromProject,
    getActiveProjects,
};