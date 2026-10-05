const { User } = require('../../models/userModel');
const bcrypt = require('bcrypt');

async function seedUsers() {
    const users = [
        {
            username: 'adminUser',
            email: 'admin@test.com',
            password: 'Pass123!',
            role: 'Admin',
        },
        {
            username: 'teamUser',
            email: 'team@test.com',
            password: 'Pass123!',
            role: 'TeamMember',
        },
    ];

    await User.insertMany(
        await Promise.all(
            users.map(async (user) => ({
                ...user,
                password: await bcrypt.hash(user.password, 12),
            }))
        )
    );
    console.log('Users seeded successfully.');
}

module.exports = seedUsers;
