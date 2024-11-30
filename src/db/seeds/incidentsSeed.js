const { User } = require('../../models/userModel'); 
const { Incident } = require('../../models/incidentModel');

async function seedIncidents() {
    // Assign user IDs for incidents
    const users = await User.find();

    const adminUserId = users.find((user) => user.role === 'Admin')._id;
    const teamMemberUserId = users.find(
        (user) => user.role === 'TeamMember'
    )._id;

    // Seed Incidents
    const incidents = [
        // Incident 1 - Production Server Outage
        {
            title: 'Production Server Outage',
            description:
                'Critical issue with the production server causing downtime.',
            environment: 'Production',
            createdBy: adminUserId,
            status: 'Open',
            assignedTo: teamMemberUserId,
            severity: 'Critical',
            tags: ['server', 'outage', 'critical'],
            relatedLinks: ['https://www.apple.com/au/support/systemstatus/'],
            caseDiscussion: [
                {
                    message:
                        'Initial investigation points to a database connection issue.',
                    author: adminUserId,
                },
                {
                    message: 'Assigning to team for resolution.',
                    author: adminUserId,
                },
            ],
        },

        // Incident 2 - Staging API Response Delay
        {
            title: 'Staging API Response Delay',
            description:
                'The staging API is experiencing delays in response times, affecting testing.',
            environment: 'Staging',
            createdBy: teamMemberUserId,
            status: 'In Progress',
            assignedTo: adminUserId,
            severity: 'High',
            tags: ['API', 'performance', 'staging'],
            relatedLinks: ['https://status.atlassian.com/'],
            caseDiscussion: [
                {
                    message:
                        'Performance testing in progress to identify bottlenecks.',
                    author: teamMemberUserId,
                },
            ],
        },
    ];

    await Incident.insertMany(incidents);
    console.log('Incidents created successfully.');
}

module.exports = seedIncidents;
