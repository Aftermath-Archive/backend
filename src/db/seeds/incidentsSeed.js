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
            incidentAutoId: 'INC-2021-0001',
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
            incidentAutoId: 'INC-2021-0002',
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

        // Incident 3 - Login Page Error
        {
            title: 'Login Page Error',
            incidentAutoId: 'INC-2021-0003',
            description:
                'Users are unable to log in due to a JavaScript error on the login page.',
            environment: 'Production',
            createdBy: adminUserId,
            status: 'Resolved',
            assignedTo: teamMemberUserId,
            severity: 'Medium',
            tags: ['frontend', 'login', 'bug'],
            relatedLinks: [
                'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Errors',
            ],
            caseDiscussion: [
                {
                    message:
                        'Identified the issue with the authentication script.',
                    author: teamMemberUserId,
                },
                {
                    message:
                        'Deployed the fix to production. Monitoring for any further issues.',
                    author: adminUserId,
                },
            ],
        },

        // Incident 4 - Database Backup Failure
        {
            title: 'Database Backup Failure',
            incidentAutoId: 'INC-2021-0004',
            description:
                'Scheduled database backups are failing, risking data loss.',
            environment: 'Production',
            createdBy: teamMemberUserId,
            status: 'Closed',
            assignedTo: adminUserId,
            severity: 'High',
            tags: ['database', 'backup', 'maintenance'],
            relatedLinks: [
                'https://www.postgresql.org/docs/current/backup.html',
            ],
            caseDiscussion: [
                {
                    message: 'Backup scripts are throwing timeout errors.',
                    author: teamMemberUserId,
                },
                {
                    message:
                        'Increased timeout settings and rerunning the backup manually.',
                    author: adminUserId,
                },
                {
                    message:
                        'Backup completed successfully. Investigating root cause.',
                    author: adminUserId,
                },
            ],
        },

        // Incident 5 - Email Service Interruption
        {
            title: 'Email Service Interruption',
            incidentAutoId: 'INC-2021-0005',
            description:
                'Users are not receiving confirmation emails after registration.',
            environment: 'Production',
            createdBy: adminUserId,
            status: 'In Progress',
            assignedTo: teamMemberUserId,
            severity: 'High',
            tags: ['email', 'notification', 'bug'],
            relatedLinks: ['https://status.mailgun.com/'],
            caseDiscussion: [
                {
                    message:
                        'SMTP server seems to be rejecting connections intermittently.',
                    author: teamMemberUserId,
                },
                {
                    message: 'Contacting the SMTP provider for more insights.',
                    author: adminUserId,
                },
            ],
        },

        // Incident 6 - Mobile App Crash on Launch
        {
            title: 'Mobile App Crash on Launch',
            incidentAutoId: 'INC-2021-0006',
            description:
                'The mobile application crashes immediately upon launch on iOS devices.',
            environment: 'Production',
            createdBy: teamMemberUserId,
            status: 'Resolved',
            assignedTo: adminUserId,
            severity: 'Critical',
            tags: ['mobile', 'crash', 'iOS'],
            relatedLinks: ['https://developer.apple.com/documentation'],
            caseDiscussion: [
                {
                    message:
                        'Crash logs indicate an issue with the latest update.',
                    author: teamMemberUserId,
                },
                {
                    message:
                        'Reverted to the previous stable version. Monitoring feedback.',
                    author: adminUserId,
                },
            ],
        },

        // Incident 7 - Payment Gateway Timeout
        {
            title: 'Payment Gateway Timeout',
            incidentAutoId: 'INC-2021-0007',
            description:
                'Customers are experiencing timeouts when attempting to process payments.',
            environment: 'Production',
            createdBy: adminUserId,
            status: 'Open',
            assignedTo: teamMemberUserId,
            severity: 'Critical',
            tags: ['payment', 'gateway', 'timeout'],
            relatedLinks: ['https://status.paypal.com/'],
            caseDiscussion: [
                {
                    message:
                        'Initial checks show no issues with our integration.',
                    author: teamMemberUserId,
                },
            ],
        },

        // Incident 8 - DNS Resolution Issues
        {
            title: 'DNS Resolution Issues',
            incidentAutoId: 'INC-2021-0008',
            description:
                'Intermittent DNS resolution failures affecting site accessibility.',
            environment: 'Staging',
            createdBy: teamMemberUserId,
            status: 'Resolved',
            assignedTo: adminUserId,
            severity: 'Medium',
            tags: ['DNS', 'network', 'accessibility'],
            relatedLinks: [
                'https://www.cloudflare.com/learning/dns/what-is-dns/',
            ],
            caseDiscussion: [
                {
                    message:
                        'Noticed increased DNS queries dropping intermittently.',
                    author: teamMemberUserId,
                },
                {
                    message:
                        'Contacted DNS provider; issue has been resolved on their end.',
                    author: adminUserId,
                },
            ],
        },

        // Incident 9 - User Data Synchronization Delay
        {
            title: 'User Data Synchronization Delay',
            incidentAutoId: 'INC-2021-0009',
            description:
                'Delays observed in synchronizing user data across services.',
            environment: 'Production',
            createdBy: adminUserId,
            status: 'Closed',
            assignedTo: teamMemberUserId,
            severity: 'Low',
            tags: ['synchronization', 'data', 'performance'],
            relatedLinks: ['https://www.sync.com/help/'],
            caseDiscussion: [
                {
                    message:
                        'Data sync processes are running slower than expected.',
                    author: teamMemberUserId,
                },
                {
                    message:
                        'Optimized database queries to improve synchronization speed.',
                    author: adminUserId,
                },
                {
                    message:
                        'Monitoring shows synchronization delays have been resolved.',
                    author: teamMemberUserId,
                },
            ],
        },

        // Incident 10 - Unauthorized Access Attempt Detected
        {
            title: 'Unauthorized Access Attempt Detected',
            incidentAutoId: 'INC-2021-0010',
            description:
                'Multiple unauthorized access attempts detected from a single IP address.',
            environment: 'Production',
            createdBy: adminUserId,
            status: 'Resolved',
            assignedTo: teamMemberUserId,
            severity: 'High',
            tags: ['security', 'access', 'threat'],
            relatedLinks: ['https://owasp.org/www-project-top-ten/'],
            caseDiscussion: [
                {
                    message:
                        'Detected multiple failed login attempts from IP 192.168.1.100.',
                    author: teamMemberUserId,
                },
                {
                    message:
                        'Blocked the IP address and initiated a security review.',
                    author: adminUserId,
                },
                {
                    message:
                        'No further unauthorized attempts detected. Implementing rate limiting.',
                    author: teamMemberUserId,
                },
            ],
        },
    ];

    await Incident.insertMany(incidents);
    console.log('Incidents created successfully.');
}

module.exports = seedIncidents;
