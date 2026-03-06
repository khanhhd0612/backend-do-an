const ApiError = require('../utils/ApiError');
const Department = require('../models/department.model');
const Employee = require('../models/employee.model');
/**
 * Tạo phòng ban mới
 */
const createDepartment = async (body, createdBy) => {
    if (await Department.isCodeTaken(body.departmentCode)) {
        throw new ApiError(400, 'Mã phòng ban đã tồn tại');
    }

    if (await Department.isNameTaken(body.departmentName)) {
        throw new ApiError(400, 'Tên phòng ban đã tồn tại');
    }

    // Kiểm tra manager tồn tại nếu có truyền vào
    if (body.manager) {
        const managerExists = await Employee.findById(body.manager);
        if (!managerExists) {
            throw new ApiError(404, 'Trưởng phòng không tồn tại');
        }
        if (managerExists.status !== 'active') {
            throw new ApiError(400, 'Trưởng phòng phải đang hoạt động');
        }
    }

    const department = await Department.create({ ...body, createdBy });
    return department;
};

/**
 * Lấy danh sách phòng ban có phân trang
 */
const queryDepartments = async (filter, options) => {
    const departments = await Department.paginate(filter, {
        ...options,
        populate: 'manager'
    });
    return departments;
};

/**
 * Lấy phòng ban theo ID
 */
const getDepartmentById = async (departmentId) => {
    const department = await Department.findById(departmentId).populate(
        'manager',
        'fullName employeeCode position profileImage'
    );

    if (!department) {
        throw new ApiError(404, 'Không tìm thấy phòng ban');
    }

    return department;
};

/**
 * Cập nhật thông tin phòng ban
 */
const updateDepartmentById = async (departmentId, updateBody) => {
    const department = await getDepartmentById(departmentId);

    if (updateBody.departmentCode && (await Department.isCodeTaken(updateBody.departmentCode, departmentId))) {
        throw new ApiError(400, 'Mã phòng ban đã tồn tại');
    }

    if (updateBody.departmentName && (await Department.isNameTaken(updateBody.departmentName, departmentId))) {
        throw new ApiError(400, 'Tên phòng ban đã tồn tại');
    }

    if (updateBody.manager) {
        const managerExists = await Employee.findById(updateBody.manager);
        if (!managerExists) {
            throw new ApiError(404, 'Trưởng phòng không tồn tại');
        }
        if (managerExists.status !== 'active') {
            throw new ApiError(400, 'Trưởng phòng phải đang hoạt động');
        }
    }

    Object.assign(department, updateBody);
    await department.save();
    return department;
};

/**
 * Xoá phòng ban 
 */
const deleteDepartmentById = async (departmentId) => {
    const department = await getDepartmentById(departmentId);

    //kiểm tra còn nhân viên không
    const employeeCount = await Employee.countDocuments({
        department: departmentId,
        status: { $ne: 'terminated' }
    });

    if (employeeCount > 0) {
        throw new ApiError(
            400,
            `Không thể xoá phòng ban đang có ${employeeCount} nhân viên`
        );
    }

    await department.deleteOne();
    return department;
};

/**
 * Gán / gỡ trưởng phòng
 */
const assignManager = async (departmentId, managerId) => {
    const department = await getDepartmentById(departmentId);

    if (managerId === null) {
        department.manager = null;
        await department.save();
        return department;
    }

    const employee = await Employee.findById(managerId);
    if (!employee) {
        throw new ApiError(404, 'Nhân viên không tồn tại');
    }
    if (employee.status !== 'active') {
        throw new ApiError(400, 'Trưởng phòng phải đang hoạt động');
    }

    // Kiểm tra employee thuộc phòng ban này
    if (employee.department.toString() !== departmentId.toString()) {
        throw new ApiError(400, 'Trưởng phòng phải thuộc phòng ban này');
    }

    department.manager = managerId;
    await department.save();
    return department.populate('manager', 'fullName employeeCode position profileImage');
};

/**
 * Lấy danh sách nhân viên trong phòng ban
 */
const getEmployeesByDepartment = async (departmentId, filter = {}, options = {}) => {
    await getDepartmentById(departmentId);

    const employees = await Employee.paginate(
        { department: departmentId, ...filter },
        options
    );

    return employees;
};

module.exports = {
    createDepartment,
    queryDepartments,
    getDepartmentById,
    updateDepartmentById,
    deleteDepartmentById,
    assignManager,
    getEmployeesByDepartment
};