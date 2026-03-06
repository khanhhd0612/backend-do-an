const catchAsync = require('../utils/catchAsync');
const pick = require('../utils/pick');
const departmentService = require('../services/department.service');

const createDepartment = catchAsync(async (req, res) => {
    const department = await departmentService.createDepartment(req.body, req.user.id);
    res.status(201).json({
        success: true,
        message: 'Tạo phòng ban thành công',
        data: department
    });
});

const getDepartments = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['departmentName', 'status']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);

    if (filter.departmentName) {
        filter.departmentName = { $regex: filter.departmentName, $options: 'i' };
    }

    const result = await departmentService.queryDepartments(filter, options);
    res.status(200).json({
        success: true,
        message: 'Lấy danh sách phòng ban thành công',
        data: result
    });
});

const getDepartment = catchAsync(async (req, res) => {
    const department = await departmentService.getDepartmentById(req.params.departmentId);
    res.status(200).json({
        success: true,
        message: 'Lấy thông tin phòng ban thành công',
        data: department
    });
});

const updateDepartment = catchAsync(async (req, res) => {
    const department = await departmentService.updateDepartmentById(req.params.departmentId, req.body);
    res.status(200).json({
        success: true,
        message: 'Cập nhật phòng ban thành công',
        data: department
    });
});

const deleteDepartment = catchAsync(async (req, res) => {
    await departmentService.deleteDepartmentById(req.params.departmentId);
    res.status(200).json({
        success: true,
        message: 'Xoá phòng ban thành công'
    });
});

const assignManager = catchAsync(async (req, res) => {
    const department = await departmentService.assignManager(
        req.params.departmentId,
        req.body.managerId
    );
    res.status(200).json({
        success: true,
        message: req.body.managerId ? 'Gán trưởng phòng thành công' : 'Gỡ trưởng phòng thành công',
        data: department
    });
});

const getEmployeesByDepartment = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['status']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);

    const result = await departmentService.getEmployeesByDepartment(
        req.params.departmentId,
        filter,
        options
    );

    res.status(200).json({
        success: true,
        message: 'Lấy danh sách nhân viên thành công',
        data: result
    });
});

module.exports = {
    createDepartment,
    getDepartments,
    getDepartment,
    updateDepartment,
    deleteDepartment,
    assignManager,
    getEmployeesByDepartment
};