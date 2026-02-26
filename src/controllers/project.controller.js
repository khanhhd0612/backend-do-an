const catchAsync = require('../utils/catchAsync');
const projectService = require('../services/project.service');
const pick = require('../utils/pick');

/**
 * Tạo dự án mới
 */
const createProject = catchAsync(async (req, res) => {
    const projectBody = {
        ...req.body,
        createdBy: req.user.id
    };

    const project = await projectService.createProject(projectBody);

    res.status(201).json({
        success: true,
        message: 'Tạo dự án thành công',
        data: project
    });
});

/**
 * Lấy chi tiết dự án
 */
const getProjectById = catchAsync(async (req, res) => {
    const project = await projectService.getProjectById(req.params.projectId);

    res.status(200).json({
        success: true,
        message: 'Lấy dự án thành công',
        data: project
    });
});

/**
 * Lấy danh sách dự án
 */
const getAllProjects = catchAsync(async (req, res) => {
    const filter = {};
    const options = pick(req.query, ['sortBy', 'limit', 'page']);

    if (req.query.status) {
        filter.status = req.query.status;
    }
    if (req.query.city) {
        filter['location.city'] = req.query.city;
    }
    if (req.query.managerId) {
        filter.projectManager = req.query.managerId;
    }
    if (req.query.keyword) {
        filter.$or = [
            { projectName: { $regex: req.query.keyword, $options: 'i' } },
            { projectCode: { $regex: req.query.keyword, $options: 'i' } }
        ];
    }

    const projects = await projectService.getAllProjects(filter, options);

    res.status(200).json({
        success: true,
        message: 'Lấy danh sách dự án thành công',
        data: projects
    });
});

/**
 * Lấy dự án theo trạng thái
 */
const getProjectsByStatus = catchAsync(async (req, res) => {
    const options = {
        page: req.query.page || 1,
        limit: req.query.limit || 10
    };

    const projects = await projectService.getProjectsByStatus(
        req.params.status,
        options
    );

    res.status(200).json({
        success: true,
        message: 'Lấy danh sách dự án thành công',
        data: projects
    });
});

/**
 * Lấy dự án theo quản lý
 */
const getProjectsByManager = catchAsync(async (req, res) => {
    const options = {
        page: req.query.page || 1,
        limit: req.query.limit || 10
    };

    const projects = await projectService.getProjectsByManager(
        req.params.managerId,
        options
    );

    res.status(200).json({
        success: true,
        message: 'Lấy danh sách dự án thành công',
        data: projects
    });
});

/**
 * Lấy dự án đang thực hiện
 */
const getActiveProjects = catchAsync(async (req, res) => {
    const options = {
        page: req.query.page || 1,
        limit: req.query.limit || 10
    };

    const projects = await projectService.getActiveProjects(options);

    res.status(200).json({
        success: true,
        message: 'Lấy danh sách dự án đang thực hiện thành công',
        data: projects
    });
});

/**
 * Lấy dự án sắp deadline
 */
const getUpcomingDeadlines = catchAsync(async (req, res) => {
    const options = {
        page: req.query.page || 1,
        limit: req.query.limit || 10
    };

    const projects = await projectService.getUpcomingDeadlines(options);

    res.status(200).json({
        success: true,
        message: 'Lấy danh sách dự án sắp deadline thành công',
        data: projects
    });
});

/**
 * Tìm kiếm dự án
 */
const searchProjects = catchAsync(async (req, res) => {
    const criteria = {
        status: req.query.status,
        city: req.query.city,
        managerId: req.query.managerId,
        keyword: req.query.keyword
    };
    const options = {
        page: req.query.page || 1,
        limit: req.query.limit || 10,
        sortBy: req.query.sortBy || 'createdAt:desc'
    };

    const projects = await projectService.searchProjects(criteria, options);

    res.status(200).json({
        success: true,
        message: 'Tìm kiếm dự án thành công',
        data: projects
    });
});

/**
 * Cập nhật dự án
 */
const updateProjectById = catchAsync(async (req, res) => {
    const project = await projectService.updateProjectById(
        req.params.projectId,
        req.body
    );

    res.status(200).json({
        success: true,
        message: 'Cập nhật dự án thành công',
        data: project
    });
});

/**
 * Cập nhật tiến độ dự án
 */
const updateProgress = catchAsync(async (req, res) => {
    const { percentage } = req.body;

    const project = await projectService.updateProgress(
        req.params.projectId,
        percentage
    );

    res.status(200).json({
        success: true,
        message: 'Cập nhật tiến độ thành công',
        data: project
    });
});

/**
 * Cập nhật chi phí thực tế
 */
const updateActualExpense = catchAsync(async (req, res) => {
    const { amount } = req.body;

    const project = await projectService.updateActualExpense(
        req.params.projectId,
        amount
    );

    res.status(200).json({
        success: true,
        message: 'Cập nhật chi phí thành công',
        data: project
    });
});

/**
 * Cập nhật trạng thái dự án
 */
const updateProjectStatus = catchAsync(async (req, res) => {
    const { status } = req.body;

    const project = await projectService.updateProjectStatus(
        req.params.projectId,
        status
    );

    res.status(200).json({
        success: true,
        message: 'Cập nhật trạng thái dự án thành công',
        data: project
    });
});

/**
 * Xóa dự án
 */
const deleteProjectById = catchAsync(async (req, res) => {
    const project = await projectService.deleteProjectById(req.params.projectId);

    res.status(200).json({
        success: true,
        message: 'Xóa dự án thành công',
        data: project
    });
});

/**
 * Thêm nhân viên vào dự án
 */
const addTeamMember = catchAsync(async (req, res) => {
    const { employeeId, role } = req.body;

    const project = await projectService.addTeamMember(
        req.params.projectId,
        employeeId,
        role
    );

    res.status(201).json({
        success: true,
        message: 'Thêm nhân viên vào dự án thành công',
        data: project
    });
});

/**
 * Xóa nhân viên khỏi dự án
 */
const removeTeamMember = catchAsync(async (req, res) => {
    const project = await projectService.removeTeamMember(
        req.params.projectId,
        req.params.employeeId
    );

    res.status(200).json({
        success: true,
        message: 'Xóa nhân viên khỏi dự án thành công',
        data: project
    });
});

/**
 * Lấy danh sách nhân viên của dự án
 */
const getProjectTeamMembers = catchAsync(async (req, res) => {
    const members = await projectService.getProjectTeamMembers(
        req.params.projectId
    );

    res.status(200).json({
        success: true,
        message: 'Lấy danh sách nhân viên thành công',
        data: members
    });
});

/**
 * Thêm giai đoạn
 */
const addStage = catchAsync(async (req, res) => {
    const project = await projectService.addStage(
        req.params.projectId,
        req.body
    );

    res.status(201).json({
        success: true,
        message: 'Thêm giai đoạn thành công',
        data: project
    });
});

/**
 * Cập nhật giai đoạn
 */
const updateStage = catchAsync(async (req, res) => {
    const project = await projectService.updateStage(
        req.params.projectId,
        req.params.stageIndex,
        req.body
    );

    res.status(200).json({
        success: true,
        message: 'Cập nhật giai đoạn thành công',
        data: project
    });
});

/**
 * Hoàn thành giai đoạn
 */
const completeStage = catchAsync(async (req, res) => {
    const project = await projectService.completeStage(
        req.params.projectId,
        req.params.stageIndex
    );

    res.status(200).json({
        success: true,
        message: 'Hoàn thành giai đoạn thành công',
        data: project
    });
});

/**
 * Xóa giai đoạn
 */
const removeStage = catchAsync(async (req, res) => {
    const project = await projectService.removeStage(
        req.params.projectId,
        req.params.stageIndex
    );

    res.status(200).json({
        success: true,
        message: 'Xóa giai đoạn thành công',
        data: project
    });
});

/**
 * Lấy danh sách giai đoạn
 */
const getProjectStages = catchAsync(async (req, res) => {
    const stages = await projectService.getProjectStages(req.params.projectId);

    res.status(200).json({
        success: true,
        message: 'Lấy danh sách giai đoạn thành công',
        data: stages
    });
});

/**
 * Lấy thống kê dự án
 */
const getProjectStats = catchAsync(async (req, res) => {
    const stats = await projectService.getProjectStats(req.params.projectId);

    res.status(200).json({
        success: true,
        message: 'Lấy thống kê dự án thành công',
        data: stats
    });
});

module.exports = {
    createProject,
    getProjectById,
    getAllProjects,
    getProjectsByStatus,
    getProjectsByManager,
    getActiveProjects,
    getUpcomingDeadlines,
    searchProjects,
    updateProjectById,
    updateProgress,
    updateActualExpense,
    updateProjectStatus,
    deleteProjectById,
    addTeamMember,
    removeTeamMember,
    getProjectTeamMembers,
    addStage,
    updateStage,
    completeStage,
    removeStage,
    getProjectStages,
    getProjectStats
};