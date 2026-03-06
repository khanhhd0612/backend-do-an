const Project = require('../models/project.model');
const ApiError = require('../utils/ApiError');

/**
 * Tạo dự án mới
 * @param {Object} projectBody - Dữ liệu dự án
 * @returns {Promise<Project>}
 */
const createProject = async (projectBody) => {
    if (await Project.isProjectCodeTaken(projectBody.projectCode)) {
        throw new ApiError(400, 'Mã dự án đã tồn tại');
    }

    const project = await Project.create(projectBody);
    return project;
};

/**
 * Lấy dự án theo ID
 * @param {string} projectId - ID dự án
 * @returns {Promise<Project>}
 */
const getProjectById = async (projectId) => {
    const project = await Project.findById(projectId)
        .populate('team.employee', 'fullName position phone')
        .populate('createdBy', 'name email');

    if (!project) {
        throw new ApiError(404, 'Dự án không tồn tại');
    }

    return project;
};

/**
 * Lấy tất cả dự án (có filter & pagination)
 * @param {Object} filter - Bộ lọc (status, city, ...)
 * @param {Object} options - Pagination (page, limit, sort)
 * @returns {Promise<Object>} - { results, page, limit, totalResults, totalPages }
 */
const getAllProjects = async (filter, options) => {
    const projects = await Project.paginate(filter, options);
    return projects;
};

/**
 * Lấy dự án theo trạng thái
 * @param {string} status - Trạng thái (planning, in_progress, completed, ...)
 * @param {Object} options - Pagination
 * @returns {Promise<Object>}
 */
const getProjectsByStatus = async (status, options) => {
    const validStatus = ['planning', 'in_progress', 'completed', 'paused', 'cancelled'];
    if (!validStatus.includes(status)) {
        throw new ApiError(400, 'Trạng thái không hợp lệ');
    }

    const projects = await Project.paginate({ status }, options);
    return projects;
};

/**
 * Lấy dự án theo quản lý dự án
 * @param {string} managerId - ID quản lý
 * @param {Object} options - Pagination
 * @returns {Promise<Object>}
 */
const getProjectsByManager = async (managerId, options) => {
    const projects = await Project.paginate({ projectManager: managerId }, options);

    if (projects.results.length === 0) {
        throw new ApiError(400, 'Quản lý này không có dự án nào');
    }

    return projects;
};

/**
 * Lấy dự án đang thực hiện (active)
 * @param {Object} options - Pagination
 * @returns {Promise<Object>}
 */
const getActiveProjects = async (options = {}) => {
    const defaultOptions = {
        page: options.page || 1,
        limit: options.limit || 10,
        sortBy: options.sortBy || 'createdAt:desc'
    };

    const projects = await Project.paginate({ status: 'in_progress' }, defaultOptions);
    return projects;
};

/**
 * Lấy dự án sắp deadline (< 30 ngày)
 * @param {Object} options - Pagination
 * @returns {Promise<Object>}
 */
const getUpcomingDeadlines = async (options = {}) => {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const defaultOptions = {
        page: options.page || 1,
        limit: options.limit || 10,
        sortBy: options.sortBy || 'endDate:asc'
    };

    const projects = await Project.paginate(
        {
            endDate: { $lte: thirtyDaysFromNow },
            status: { $in: ['planning', 'in_progress'] }
        },
        defaultOptions
    );

    return projects;
};

/**
 * Lấy dự án theo thành phố
 * @param {string} city - Tên thành phố
 * @param {Object} options - Pagination
 * @returns {Promise<Object>}
 */
const getProjectsByCity = async (city, options = {}) => {
    const defaultOptions = {
        page: options.page || 1,
        limit: options.limit || 10,
        sortBy: options.sortBy || 'createdAt:desc'
    };

    const projects = await Project.paginate({ 'location.city': city }, defaultOptions);
    return projects;
};

/**
 * Cập nhật dự án
 * @param {string} projectId - ID dự án
 * @param {Object} updateBody - Dữ liệu cập nhật
 * @returns {Promise<Project>}
 */
const updateProjectById = async (projectId, updateBody) => {
    let project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, 'Dự án không tồn tại');
    }

    // Kiểm tra mã dự án nếu thay đổi
    if (updateBody.projectCode && updateBody.projectCode !== project.projectCode) {
        if (await Project.isProjectCodeTaken(updateBody.projectCode, projectId)) {
            throw new ApiError(400, 'Mã dự án đã tồn tại');
        }
    }

    // Kiểm tra end date > start date
    if (updateBody.endDate && updateBody.startDate) {
        if (updateBody.endDate <= updateBody.startDate) {
            throw new ApiError(400, 'Ngày kết thúc phải sau ngày bắt đầu');
        }
    } else if (updateBody.endDate && updateBody.endDate <= project.startDate) {
        throw new ApiError(400, 'Ngày kết thúc phải sau ngày bắt đầu');
    }

    Object.assign(project, updateBody);
    await project.save();
    return project;
};

/**
 * Cập nhật tiến độ dự án
 * @param {string} projectId - ID dự án
 * @param {number} percentage - % tiến độ (0-100)
 * @returns {Promise<Project>}
 */
const updateProgress = async (projectId, percentage) => {
    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, 'Dự án không tồn tại');
    }

    if (!Number.isInteger(percentage) || percentage < 0 || percentage > 100) {
        throw new ApiError(400, 'Tiến độ phải là số nguyên từ 0-100');
    }

    await project.updateProgress(percentage);
    return project;
};

/**
 * Cập nhật chi phí thực tế
 * @param {string} projectId - ID dự án
 * @param {number} amount - Số tiền
 * @returns {Promise<Project>}
 */
const updateActualExpense = async (projectId, amount) => {
    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, 'Dự án không tồn tại');
    }

    if (!Number.isInteger(amount) || amount < 0) {
        throw new ApiError(400, 'Chi phí phải là số dương');
    }

    await project.updateActualExpense(amount);
    return project;
};

/**
 * Cập nhật trạng thái dự án
 * @param {string} projectId - ID dự án
 * @param {string} status - Trạng thái mới
 * @returns {Promise<Project>}
 */
const updateProjectStatus = async (projectId, status) => {
    const validStatus = ['planning', 'in_progress', 'completed', 'paused', 'cancelled'];
    if (!validStatus.includes(status)) {
        throw new ApiError(400, 'Trạng thái không hợp lệ');
    }

    const project = await Project.findByIdAndUpdate(
        projectId,
        { status },
        { new: true, runValidators: true }
    );

    if (!project) {
        throw new ApiError(404, 'Dự án không tồn tại');
    }

    return project;
};

/**
 * Xóa dự án
 * @param {string} projectId - ID dự án
 * @returns {Promise<Project>}
 */
const deleteProjectById = async (projectId) => {
    const project = await Project.findByIdAndDelete(projectId);

    if (!project) {
        throw new ApiError(404, 'Dự án không tồn tại');
    }

    return project;
};

/**
 * Thêm nhân viên vào dự án
 * @param {string} projectId - ID dự án
 * @param {string} employeeId - ID nhân viên
 * @param {string} role - Vai trò
 * @returns {Promise<Project>}
 */
const addTeamMember = async (projectId, employeeId, role) => {
    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, 'Dự án không tồn tại');
    }

    await project.addTeamMember(employeeId, role);
    return project;
};

/**
 * Xóa nhân viên khỏi dự án
 * @param {string} projectId - ID dự án
 * @param {string} employeeId - ID nhân viên
 * @returns {Promise<Project>}
 */
const removeTeamMember = async (projectId, employeeId) => {
    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, 'Dự án không tồn tại');
    }

    const memberExists = project.team.some(
        m => m.employee.toString() === employeeId.toString()
    );
    if (!memberExists) {
        throw new ApiError(404, 'Nhân viên không trong dự án');
    }

    await project.removeTeamMember(employeeId);
    return project;
};

/**
 * Lấy danh sách nhân viên của dự án
 * @param {string} projectId - ID dự án
 * @returns {Promise<Array>}
 */
const getProjectTeamMembers = async (projectId) => {
    const project = await Project.findById(projectId).populate(
        'team.employee',
        'name position phone email'
    );

    if (!project) {
        throw new ApiError(404, 'Dự án không tồn tại');
    }

    return project.team;
};

/**
 * Thêm giai đoạn
 * @param {string} projectId - ID dự án
 * @param {Object} stageData - Dữ liệu giai đoạn
 * @returns {Promise<Project>}
 */
const addStage = async (projectId, stageData) => {
    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, 'Dự án không tồn tại');
    }

    await project.addStage(stageData);
    return project;
};

/**
 * Cập nhật giai đoạn
 * @param {string} projectId - ID dự án
 * @param {number} stageIndex - Index giai đoạn
 * @param {Object} updateData - Dữ liệu cập nhật
 * @returns {Promise<Project>}
 */
const updateStage = async (projectId, stageIndex, updateData) => {
    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, 'Dự án không tồn tại');
    }

    if (stageIndex < 0 || stageIndex >= project.stages.length) {
        throw new ApiError(404, 'Giai đoạn không tồn tại');
    }

    await project.updateStage(stageIndex, updateData);
    return project;
};

/**
 * Hoàn thành giai đoạn
 * @param {string} projectId - ID dự án
 * @param {number} stageIndex - Index giai đoạn
 * @returns {Promise<Project>}
 */
const completeStage = async (projectId, stageIndex) => {
    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, 'Dự án không tồn tại');
    }

    if (stageIndex < 0 || stageIndex >= project.stages.length) {
        throw new ApiError(404, 'Giai đoạn không tồn tại');
    }

    await project.completeStage(stageIndex);
    return project;
};

/**
 * Xóa giai đoạn
 * @param {string} projectId - ID dự án
 * @param {number} stageIndex - Index giai đoạn
 * @returns {Promise<Project>}
 */
const removeStage = async (projectId, stageIndex) => {
    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, 'Dự án không tồn tại');
    }

    if (stageIndex < 0 || stageIndex >= project.stages.length) {
        throw new ApiError(404, 'Giai đoạn không tồn tại');
    }

    project.stages.splice(stageIndex, 1);
    await project.save();
    return project;
};

/**
 * Lấy tất cả giai đoạn của dự án
 * @param {string} projectId - ID dự án
 * @returns {Promise<Array>}
 */
const getProjectStages = async (projectId) => {
    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, 'Dự án không tồn tại');
    }

    return project.stages;
};

/**
 * Lấy thống kê dự án
 * @param {string} projectId - ID dự án
 * @returns {Promise<Object>}
 */
const getProjectStats = async (projectId) => {
    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, 'Dự án không tồn tại');
    }

    const completedStages = project.stages.filter(s => s.status === 'completed').length;
    const totalStages = project.stages.length;

    return {
        projectCode: project.projectCode,
        projectName: project.projectName,
        status: project.status,
        progress: project.progress.percentage,
        stagesCompleted: completedStages,
        stagesTotalCount: totalStages,
        teamMembersCount: project.team.length,
        budgetInfo: {
            estimated: project.budget.estimatedBudget,
            approved: project.budget.approvedBudget,
            spent: project.budget.actualExpense,
            remaining: project.budget.approvedBudget - project.budget.actualExpense,
            percentageUsed: ((project.budget.actualExpense / project.budget.approvedBudget) * 100).toFixed(2)
        },
        timeline: {
            startDate: project.startDate,
            endDate: project.endDate,
            daysRemaining: project.daysRemaining,
            status: project.daysRemaining > 0 ? 'on-track' : 'overdue'
        }
    };
};

/**
 * Lấy danh sách dự án theo nhiều tiêu chí
 * @param {Object} criteria - Tiêu chí tìm kiếm
 * @param {Object} options - Pagination
 * @returns {Promise<Object>}
 */
const searchProjects = async (criteria, options = {}) => {
    const filter = {};

    if (criteria.status) {
        filter.status = criteria.status;
    }
    if (criteria.city) {
        filter['location.city'] = criteria.city;
    }
   
    if (criteria.keyword) {
        filter.$or = [
            { projectName: { $regex: criteria.keyword, $options: 'i' } },
            { projectCode: { $regex: criteria.keyword, $options: 'i' } },
            { description: { $regex: criteria.keyword, $options: 'i' } }
        ];
    }

    const defaultOptions = {
        page: options.page || 1,
        limit: options.limit || 10,
        sortBy: options.sortBy || 'createdAt:desc'
    };

    const projects = await Project.paginate(filter, defaultOptions);
    return projects;
};

module.exports = {
    createProject,
    getProjectById,
    getAllProjects,
    getProjectsByStatus,
    getProjectsByManager,
    getActiveProjects,
    getUpcomingDeadlines,
    getProjectsByCity,
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
    getProjectStats,
    searchProjects
};