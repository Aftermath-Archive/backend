const { User } = require('../models/userModel');
const bcrypt = require('bcrypt');
const AppError = require('../utils/AppError');
const { userUpdateInput } = require('../utils/inputValidation');
const { safeUserProjection, userDto } = require('../utils/userDto');
async function findUserByQueryService(query, projection = safeUserProjection) {
    const user = await User.findOne(query, projection);
    if (!user) throw new AppError('User not found.', 404);
    return user;
}
async function findAllUsersService({ page, limit }) {
    const users = await User.find({}, safeUserProjection)
        .sort({ _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit);
    const total = await User.countDocuments();
    return { total, page, limit, users: users.map((user) => userDto(user)) };
}
async function updateUserByQueryService(query, data, actorId) {
    const input = userUpdateInput(data);
    const update = {};
    for (const field of ['username', 'email'])
        if (input[field] !== undefined) update[field] = input[field];
    if (input.profile)
        for (const [key, value] of Object.entries(input.profile))
            update[`profile.${key}`] = value;
    const changes = { $set: update };
    if (input.password !== undefined) {
        if (String(query._id).toLowerCase() !== actorId)
            throw new AppError(
                'Password changes are restricted to your own account.',
                403
            );
        const user = await User.findOne(query, '+password');
        if (!user) throw new AppError('User not found.', 404);
        if (!(await bcrypt.compare(input.currentPassword, user.password)))
            throw new AppError('Current password is incorrect.', 400);
        update.password = await bcrypt.hash(input.password, 12);
        changes.$inc = { tokenVersion: 1 };
    }
    const user = await User.findOneAndUpdate(query, changes, {
        new: true,
        runValidators: true,
        projection: safeUserProjection,
    });
    if (!user) throw new AppError('User not found.', 404);
    return user;
}
async function deleteUserByQueryService(query) {
    const user = await User.findOneAndUpdate(
        { ...query, isActive: true },
        {
            $set: { isActive: false, deletedAt: new Date() },
            $inc: { tokenVersion: 1 },
        },
        { new: true, runValidators: true, projection: safeUserProjection }
    );
    if (!user) throw new AppError('Active user not found.', 404);
    return user;
}
module.exports = {
    findUserByQueryService,
    findAllUsersService,
    updateUserByQueryService,
    deleteUserByQueryService,
};
