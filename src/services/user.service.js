const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');

const getUserById = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, 'User không tồn tại');
    }
    
    return user;
}

module.exports = {
    getUserById
}