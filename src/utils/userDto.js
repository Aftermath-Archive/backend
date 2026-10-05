function userDto(user, directory = false) {
    const data = typeof user.toObject === 'function' ? user.toObject() : user;
    const result = {
        _id: data._id,
        username: data.username,
        profile: {
            fullName: data.profile?.fullName || '',
            avatarUrl: data.profile?.avatarUrl || '',
        },
    };
    if (!directory) {
        for (const field of [
            'email',
            'role',
            'isActive',
            'createdAt',
            'updatedAt',
        ]) {
            if (data[field] !== undefined) result[field] = data[field];
        }
    }
    return result;
}
const safeUserProjection = {
    username: 1,
    email: 1,
    role: 1,
    isActive: 1,
    profile: 1,
    createdAt: 1,
    updatedAt: 1,
};
module.exports = { userDto, safeUserProjection };
