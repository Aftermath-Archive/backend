const { User } = require('../../models/userModel');

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

    await User.insertMany(users);
    console.log('Users seeded successfully.');
}

module.exports = seedUsers;
