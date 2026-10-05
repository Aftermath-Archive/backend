const {
    findUserByQueryService,
    findAllUsersService,
    updateUserByQueryService,
    deleteUserByQueryService,
} = require('../services/userService');
const { userDto } = require('../utils/userDto');
async function handleGetAllUsers(req, res) {
    res.json(await findAllUsersService(req.pagination));
}
async function handleGetUserById(req, res) {
    const user = await findUserByQueryService({ _id: req.params.id });
    const directory =
        req.userId !== req.params.id.toLowerCase() && req.user.role !== 'Admin';
    res.json(userDto(user, directory));
}
async function handleUpdateUser(req, res) {
    const user = await updateUserByQueryService(
        { _id: req.params.id },
        req.validatedBody,
        req.userId
    );
    res.json(userDto(user));
}
async function handleDeleteUser(req, res) {
    res.json(userDto(await deleteUserByQueryService({ _id: req.params.id })));
}
module.exports = {
    handleGetAllUsers,
    handleGetUserById,
    handleUpdateUser,
    handleDeleteUser,
};
