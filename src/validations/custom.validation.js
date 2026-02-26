const ApiError = require('../utils/ApiError');

const password = (value, helpers) => {
    if (value.length < 8) {
        throw new ApiError(400, 'Mật khẩu phải có ít nhất 8 ký tự');
    }

    if (!/[a-zA-Z]/.test(value)) {
        throw new ApiError(400, 'Mật khẩu phải chứa ít nhất một chữ cái');
    }

    if (!/\d/.test(value)) {
        throw new ApiError(400, 'Mật khẩu phải chứa ít nhất một chữ số');
    }

    if (/\s/.test(value)) {
        throw new ApiError(400, 'Mật khẩu không được chứa khoảng trắng');
    }

    return value;
};

const email = (value, helpers) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(value)) {
        throw new ApiError(400, 'Email không hợp lệ');
    }

    if (value.length > 254) {
        throw new ApiError(400, 'Email quá dài');
    }

    return value;
};

const username = (value, helpers) => {
    if (!/^[a-zA-Z0-9_]{3,50}$/.test(value)) {
        throw new ApiError(400, 'Tên đăng nhập chỉ chứa chữ, số và dấu gạch dưới, 3-50 ký tự');
    }

    if (/^_|_$/.test(value)) {
        throw new ApiError(400, 'Tên đăng nhập không được bắt đầu hoặc kết thúc bằng dấu gạch dưới');
    }

    return value;
};

const phone = (value, helpers) => {
    const cleanPhone = value.replace(/\s/g, '');

    if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(cleanPhone)) {
        throw new ApiError(400, 'Số điện thoại Việt Nam không hợp lệ (bắt đầu 03, 05, 07, 08, 09, 10 chữ số)');
    }

    return cleanPhone;
};

const url = (value, helpers) => {
    try {
        new URL(value);
        return value;
    } catch (err) {
        throw new ApiError(400, 'URL không hợp lệ');
    }
};

const objectId = (value, helpers) => {
    if (!/^[0-9a-fA-F]{24}$/.test(value)) {
        throw new ApiError(400, 'ID không hợp lệ');
    }
    return value;
};

const projectCode = (value, helpers) => {
    if (!/^PRJ-\d{4}-\d{3}$/.test(value)) {
        throw new ApiError(400, 'Mã dự án phải theo format: PRJ-YYYY-XXX (ví dụ: PRJ-2026-001)');
    }
    return value;
};

const projectStatus = (value, helpers) => {
    const validStatus = ['planning', 'in_progress', 'completed', 'paused', 'cancelled'];
    if (!validStatus.includes(value)) {
        throw new ApiError(400, 'Trạng thái dự án không hợp lệ');
    }
    return value;
};

const stageStatus = (value, helpers) => {
    const validStatus = ['pending', 'in_progress', 'completed', 'delayed'];
    if (!validStatus.includes(value)) {
        throw new ApiError(400, 'Trạng thái giai đoạn không hợp lệ');
    }
    return value;
};

const teamRole = (value, helpers) => {
    const validRoles = ['Project Manager', 'Engineer', 'Supervisor', 'Worker', 'Safety Officer'];
    if (!validRoles.includes(value)) {
        throw new ApiError(400, 'Vai trò không hợp lệ');
    }
    return value;
};

const currency = (value, helpers) => {
    const validCurrency = ['VND', 'USD', 'EUR'];
    if (!validCurrency.includes(value)) {
        throw new ApiError(400, 'Loại tiền không hợp lệ');
    }
    return value;
};

const userRole = (value, helpers) => {
    const validRoles = ['admin', 'manager', 'supervisor', 'employee'];
    if (!validRoles.includes(value)) {
        throw new ApiError(400, 'Role người dùng không hợp lệ');
    }
    return value;
};

module.exports = {
    password,
    email,
    username,
    phone,
    url,
    objectId,
    projectCode,
    projectStatus,
    stageStatus,
    teamRole,
    currency,
    userRole
};