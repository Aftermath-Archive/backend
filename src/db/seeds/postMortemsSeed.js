const { User } = require('../../models/userModel');
const { Incident } = require('../../models/incidentModel');
const { PostMortem } = require('../../models/postMortemModel');

async function seedPostMortems() {
    // Fetch seeded incidents and users
    const incidents = await Incident.find();
    const users = await User.find();

    if (incidents.length < 2 || users.length < 1) {
        console.error(
            'Not enough incidents or users available for seeding post-mortems.'
        );
        process.exit(1);
    }

    const adminUserId = users.find((user) => user.role === 'Admin')._id;

    // Post-Mortem Seed Data
    const postMortems = [
        // Post-mortem for the first incident
        {
            incidentId: incidents[0]._id,
            rootCause:
                'Database connection timeout due to misconfigured connection pool.',
            impact: 'Production services were unavailable for 3 hours, causing significant revenue loss.',
            actionItems: [
                {
                    description:
                        'Increase connection pool size in the database configuration.',
                    status: 'Completed',
                },
                {
                    description:
                        'Set up monitoring alerts for database connection saturation.',
                    status: 'In Progress',
                },
            ],
            lessonsLearned:
                'Ensure proper database configuration and proactive monitoring for critical systems.',
            createdBy: adminUserId,
        },

        // Post-mortem for the second incident
        {
            incidentId: incidents[1]._id, 
            rootCause:
                'API performance degradation caused by an inefficient query.',
            impact: 'Staging tests were delayed, impacting the timeline for a critical feature deployment.',
            actionItems: [
                {
                    description:
                        'Optimize the SQL query used in the API endpoint.',
                    status: 'Completed',
                },
                {
                    description:
                        'Perform load testing for all API endpoints regularly.',
                    status: 'Pending',
                },
            ],
            lessonsLearned:
                'Review and optimize SQL queries before deploying to staging.',
            createdBy: adminUserId,
        },
    ];

    // Insert post-mortems into the database
    await PostMortem.insertMany(postMortems);
    console.log('Post-Mortems seeded successfully.');
}

module.exports = seedPostMortems;
