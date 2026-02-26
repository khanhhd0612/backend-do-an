const Employee = require('../models/employee.model');
const ApiError = require('../utils/ApiError');

const calcAge = (dob) => {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
};

const validateEmployeeData = async (data, excludeId = null) => {
    const [codeTaken, emailTaken, idNumberTaken] = await Promise.all([
        data.employeeCode ? Employee.isEmployeeCodeTaken(data.employeeCode, excludeId) : false,
        data.email ? Employee.isEmailTaken(data.email, excludeId) : false,
        data.idNumber ? Employee.isIdNumberTaken(data.idNumber, excludeId) : false,
    ]);

    if (codeTaken) throw new ApiError(400, 'Mã nhân viên đã tồn tại');
    if (emailTaken) throw new ApiError(400, 'Email đã tồn tại');
    if (idNumberTaken) throw new ApiError(400, 'Số CMND/CCCD đã tồn tại');

    if (data.dateOfBirth && calcAge(new Date(data.dateOfBirth)) < 18)
        throw new ApiError(400, 'Nhân viên phải đủ 18 tuổi');

    if (data.leaveDate && data.hireDate && new Date(data.leaveDate) <= new Date(data.hireDate))
        throw new ApiError(400, 'Ngày rời phải sau ngày vào làm');

    if (data.salary?.basicSalary < 0)
        throw new ApiError(400, 'Lương cơ bản không thể âm');

    if ((data.salary?.allowance ?? 0) < 0)
        throw new ApiError(400, 'Phụ cấp không thể âm');

    if (data.idIssuedDate && new Date(data.idIssuedDate) > new Date())
        throw new ApiError(400, 'Ngày cấp CMND/CCCD không hợp lệ');

    if (data.certifications?.length) {
        for (const cert of data.certifications) {
            if (cert.expiryDate && new Date(cert.expiryDate) <= new Date(cert.issueDate))
                throw new ApiError(
                    400,
                    `Chứng chỉ "${cert.certName}": ngày hết hạn phải sau ngày cấp`
                );
        }
    }
};

/**
 * Tạo nhân viên mới
 * @param {Object}   data
 * @param {ObjectId} createdBy
 */
const createEmployee = async (data, createdBy) => {
    await validateEmployeeData(data);
    return Employee.create({ ...data, createdBy });
};

/**
 * Lấy danh sách nhân viên (filter + pagination)
 * @param {Object} filter  - { keyword, department, status, employmentType }
 * @param {Object} options - { page, limit, sortBy }
 */
const getEmployees = async (filter, options = {}) => {
    return Employee.paginate(filter, {
        page: options.page || 1,
        limit: options.limit || 10,
        sortBy: options.sortBy || 'createdAt:desc',
        populate: {
            path: 'createdBy',
            select: 'name email'
        },
    });
};

/**
 * Lấy nhân viên theo ID
 * @param {ObjectId} id
 */
const getEmployeeById = async (id) => {
    const employee = await Employee.findById(id)
        .populate('projectAssignments.projectId', 'projectName status startDate endDate')
        .populate('createdBy', 'fullName email');

    if (!employee) throw new ApiError(404, 'Không tìm thấy nhân viên');
    return employee;
};

/**
 * Lấy nhân viên theo mã nhân viên
 * @param {String} employeeCode
 */
const getEmployeeByCode = async (employeeCode) => {
    const employee = await Employee.findOne({ employeeCode });
    if (!employee) throw new ApiError(404, 'Không tìm thấy nhân viên');
    return employee;
};

/**
 * Cập nhật thông tin nhân viên
 * @param {ObjectId} id
 * @param {Object}   updateData
 */
const updateEmployee = async (id, updateData) => {
    const employee = await getEmployeeById(id);

    await validateEmployeeData(updateData, id);

    if (updateData.leaveDate && !updateData.hireDate) {
        if (new Date(updateData.leaveDate) <= new Date(employee.hireDate))
            throw new ApiError(400, 'Ngày rời phải sau ngày vào làm');
    }

    ['createdBy', 'createdAt', 'updatedAt'].forEach((f) => delete updateData[f]);

    Object.assign(employee, updateData);
    await employee.save();
    return employee;
};

/**
 * Xoá mềm nhân viên → terminated, tự gỡ khỏi dự án active
 * @param {ObjectId} id
 */
const deleteEmployee = async (id) => {
    const employee = await getEmployeeById(id);

    if (employee.status === 'terminated')
        throw new ApiError(400, 'Nhân viên đã bị chấm dứt hợp đồng');

    employee.projectAssignments.forEach((a) => {
        if (a.status === 'active') {
            a.status = 'inactive';
            a.unassignedDate = new Date();
        }
    });

    employee.status = 'terminated';
    employee.leaveDate = employee.leaveDate || new Date();

    await employee.save();
    return employee;
};

/**
 * Xoá cứng chỉ admin / dev
 * @param {ObjectId} id
 */
const hardDeleteEmployee = async (id) => {
    const employee = await getEmployeeById(id);
    await employee.deleteOne();
    return employee;
};

/**
 * Cập nhật trạng thái nhân viên
 * @param {ObjectId} id
 * @param {String}   status - active | inactive | on_leave | terminated
 */
const updateEmployeeStatus = async (id, status) => {
    const employee = await getEmployeeById(id);
    await employee.updateStatus(status);
    return employee;
};

/**
 * Lấy nhân viên theo trạng thái
 * @param {String} status
 */
const getEmployeesByStatus = async (status) => {
    return Employee.findByStatus(status);
};

/**
 * Lấy nhân viên theo phòng ban
 * @param {String} department
 */
const getEmployeesByDepartment = async (department) => {
    return Employee.findByDepartment(department);
};

/**
 * Lấy tất cả nhân viên đang hoạt động
 */
const getActiveEmployees = async () => {
    return Employee.findActiveEmployees();
};

/**
 * Cập nhật lương nhân viên
 * @param {ObjectId} id
 * @param {Number}   basicSalary
 * @param {Number}   allowance
 */
const updateSalary = async (id, basicSalary, allowance = 0) => {
    const employee = await getEmployeeById(id);
    await employee.updateSalary(basicSalary, allowance);
    return employee;
};

/**
 * Lấy thông tin lương
 * @param {ObjectId} id
 */
const getSalaryInfo = async (id) => {
    const employee = await getEmployeeById(id);
    return {
        employeeCode: employee.employeeCode,
        fullName: employee.fullName,
        salary: employee.salary,
        totalSalary: employee.totalSalary,   // virtual
        paymentFrequency: employee.salary.paymentFrequency,
    };
};

/**
 * Thêm kỹ năng
 * @param {ObjectId} id
 * @param {Object}   skillData - { skillName, level, yearsOfExperience, certification }
 */
const addSkill = async (id, skillData) => {
    const employee = await getEmployeeById(id);

    const exists = employee.skills.some(
        (s) => s.skillName.toLowerCase() === skillData.skillName.toLowerCase()
    );
    if (exists) throw new ApiError(400, 'Kỹ năng đã tồn tại');

    await employee.addSkill(skillData);
    return employee;
};

/**
 * Cập nhật kỹ năng
 * @param {ObjectId} id
 * @param {String}   skillName
 * @param {Object}   newData
 */
const updateSkill = async (id, skillName, newData) => {
    const employee = await getEmployeeById(id);

    const skill = employee.skills.find(
        (s) => s.skillName.toLowerCase() === skillName.toLowerCase()
    );
    if (!skill) throw new ApiError(404, 'Không tìm thấy kỹ năng');

    Object.assign(skill, newData);
    await employee.save();
    return employee;
};

/**
 * Xoá kỹ năng
 * @param {ObjectId} id
 * @param {String}   skillName
 */
const removeSkill = async (id, skillName) => {
    const employee = await getEmployeeById(id);

    const exists = employee.skills.some(
        (s) => s.skillName.toLowerCase() === skillName.toLowerCase()
    );
    if (!exists) throw new ApiError(404, 'Không tìm thấy kỹ năng');

    await employee.removeSkill(skillName);
    return employee;
};

/**
 * Thêm chứng chỉ
 * @param {ObjectId} id
 * @param {Object}   certData - { certName, issuedBy, issueDate, expiryDate, documentUrl }
 */
const addCertification = async (id, certData) => {
    const employee = await getEmployeeById(id);

    if (certData.expiryDate && new Date(certData.expiryDate) <= new Date(certData.issueDate))
        throw new ApiError(400, 'Ngày hết hạn phải sau ngày cấp');

    const exists = employee.certifications.some(
        (c) => c.certName.toLowerCase() === certData.certName.toLowerCase()
    );
    if (exists) throw new ApiError(400, 'Chứng chỉ đã tồn tại');

    await employee.addCertification(certData);
    return employee;
};

/**
 * Xoá chứng chỉ
 * @param {ObjectId} id
 * @param {String}   certName
 */
const removeCertification = async (id, certName) => {
    const employee = await getEmployeeById(id);

    const exists = employee.certifications.some(
        (c) => c.certName.toLowerCase() === certName.toLowerCase()
    );
    if (!exists) throw new ApiError(404, 'Không tìm thấy chứng chỉ');

    await employee.removeCertification(certName);
    return employee;
};

/**
 * Lấy danh sách chứng chỉ sắp hết hạn
 * @param {Number} days - số ngày còn lại (mặc định 30)
 */
const getExpiringCertifications = async (days = 30) => {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    const employees = await Employee.find({
        'certifications.expiryDate': { $gte: now, $lte: future },
        status: 'active',
    }).select('fullName employeeCode certifications');

    // Flatten và chỉ trả về chứng chỉ sắp hết hạn
    return employees.flatMap((emp) =>
        emp.certifications
            .filter((c) => c.expiryDate && c.expiryDate >= now && c.expiryDate <= future)
            .map((c) => ({
                employeeId: emp._id,
                employeeCode: emp.employeeCode,
                fullName: emp.fullName,
                certName: c.certName,
                issuedBy: c.issuedBy,
                expiryDate: c.expiryDate,
                daysLeft: Math.ceil((c.expiryDate - now) / (1000 * 60 * 60 * 24)),
            }))
    ).sort((a, b) => a.daysLeft - b.daysLeft);
};

/**
 * Gán nhân viên vào dự án
 * @param {ObjectId} employeeId
 * @param {ObjectId} projectId
 * @param {String}   role
 */
const assignToProject = async (employeeId, projectId, role) => {
    const employee = await getEmployeeById(employeeId);

    if (employee.status !== 'active')
        throw new ApiError(400, 'Chỉ nhân viên đang hoạt động mới được gán dự án');

    await employee.assignToProject(projectId, role);
    return employee;
};

/**
 * Gỡ nhân viên khỏi dự án
 * @param {ObjectId} employeeId
 * @param {ObjectId} projectId
 */
const unassignFromProject = async (employeeId, projectId) => {
    const employee = await getEmployeeById(employeeId);
    await employee.unassignFromProject(projectId);
    return employee;
};

/**
 * Lấy danh sách dự án đang tham gia
 * @param {ObjectId} employeeId
 */
const getActiveProjects = async (employeeId) => {
    const employee = await getEmployeeById(employeeId);
    return employee.getActiveProjects();
};

/**
 * Tìm kiếm nhân viên theo keyword
 * @param {String} keyword
 */
const searchEmployees = async (keyword) => {
    const regex = new RegExp(keyword, 'i');
    return Employee.find({
        $or: [
            { fullName: regex },
            { employeeCode: regex },
            { email: regex },
            { phone: regex },
            { department: regex },
            { position: regex },
        ],
    }).limit(20);
};

/**
 * Thống kê tổng quan nhân viên
 */
const getEmployeeStats = async () => {
    const [total, byStatus, byDepartment, byEmploymentType] = await Promise.all([
        Employee.countDocuments(),

        Employee.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]),

        Employee.aggregate([
            { $match: { status: 'active' } },
            { $group: { _id: '$department', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]),

        Employee.aggregate([
            { $group: { _id: '$employmentType', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]),
    ]);

    return {
        total,
        byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
        byDepartment: Object.fromEntries(byDepartment.map((d) => [d._id, d.count])),
        byEmploymentType: Object.fromEntries(byEmploymentType.map((e) => [e._id, e.count])),
    };
};

module.exports = {
    createEmployee,
    getEmployees,
    getEmployeeById,
    getEmployeeByCode,
    updateEmployee,
    deleteEmployee,
    hardDeleteEmployee,

    // Trạng thái
    updateEmployeeStatus,
    getEmployeesByStatus,
    getEmployeesByDepartment,
    getActiveEmployees,

    // Lương
    updateSalary,
    getSalaryInfo,

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

    // Tìm kiếm & Thống kê
    searchEmployees,
    getEmployeeStats,
};