const { User } = require('../models/userModel');
const bcrypt = require('bcrypt');
const { registrationInput } = require('../utils/inputValidation');
const { userDto } = require('../utils/userDto');
async function registerNewUserService(data) {
    const input = registrationInput(data);
    const password = await bcrypt.hash(input.password, 12);
    return userDto(
        await User.create({
            ...input,
            password,
            role: 'TeamMember',
            isActive: true,
        })
    );
}
module.exports = { registerNewUserService };
