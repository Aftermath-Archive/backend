// Exercise the mounted API, controllers, validation, and services without a DB.
jest.mock('../models/postmortemModel', () => ({
    PostMortem: {
        exists: jest.fn(),
        create: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        findOneAndUpdate: jest.fn(),
        findOneAndDelete: jest.fn(),
        countDocuments: jest.fn(),
    },
}));
jest.mock('../models/incidentModel', () => ({
    Incident: {
        exists: jest.fn(),
        findOne: jest.fn(),
        findOneAndDelete: jest.fn(),
    },
}));
jest.mock('../utils/logError');

process.env.JWT_SECRET_KEY = 'post-mortem-test-secret';

const request = require('./helpers/requestApp');
const jwt = require('jsonwebtoken');
const { app } = require('../server');
const { specs } = require('../swagger');
const { PostMortem } = require('../models/postmortemModel');
const { Incident } = require('../models/incidentModel');
const {
    deletePostMortemByIncidentId,
} = require('../services/postMortemService');

const incidentId = '507f1f77bcf86cd799439011';
const reportId = '507f1f77bcf86cd799439012';
const userId = '507f1f77bcf86cd799439013';
const token = jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY);
const report = {
    _id: reportId,
    incidentId,
    createdBy: userId,
    rootCause: 'Connection pool exhausted',
    impact: 'API unavailable',
    lessonsLearned: '',
    actionItems: [],
};
const payload = {
    incidentId,
    rootCause: report.rootCause,
    impact: report.impact,
};

describe('Post-mortem API', () => {
    let findQuery;

    beforeEach(() => {
        jest.resetAllMocks();
        // The existing authentication middleware logs the decoded token.
        jest.spyOn(console, 'log').mockImplementation(() => {});
        Incident.exists.mockResolvedValue({ _id: incidentId });
        Incident.findOne.mockResolvedValue({ _id: incidentId });
        Incident.findOneAndDelete.mockResolvedValue({ _id: incidentId });
        PostMortem.exists.mockResolvedValue(null);
        PostMortem.create.mockResolvedValue(report);
        PostMortem.findOne.mockResolvedValue(report);
        PostMortem.findOneAndUpdate.mockResolvedValue(report);
        PostMortem.findOneAndDelete.mockResolvedValue(report);
        findQuery = {
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue([report]),
        };
        PostMortem.find.mockReturnValue(findQuery);
        PostMortem.countDocuments.mockResolvedValue(1);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('creates a report and uses the JWT creator, ignoring injected fields', async () => {
        const response = await request(app)
            .post('/post-mortems')
            .set('Authorization', `Bearer ${token}`)
            .send({
                ...payload,
                rootCause: '  Connection pool exhausted  ',
                createdBy: incidentId,
                _id: incidentId,
                $set: { impact: 'injected' },
            });

        expect(response.status).toBe(201);
        expect(response.body).toEqual(report);
        expect(Incident.exists).toHaveBeenCalledWith({ _id: incidentId });
        expect(PostMortem.create).toHaveBeenCalledWith({
            ...payload,
            createdBy: userId,
        });
    });

    test.each([
        ['POST', '/post-mortems', payload],
        ['PATCH', `/post-mortems/${reportId}`, { impact: 'Updated' }],
        ['DELETE', `/post-mortems/${reportId}`, {}],
    ])('%s requires a valid token', async (method, url, data) => {
        const missing = await request(app)
            [method.toLowerCase()](url)
            .send(data);
        expect(missing.status).toBe(401);
        const invalid = await request(app)
            [method.toLowerCase()](url)
            .set('Authorization', 'Bearer invalid')
            .send(data);
        expect(invalid.status).toBe(403);
        const expiredToken = jwt.sign(
            { id: userId },
            process.env.JWT_SECRET_KEY,
            { expiresIn: -1 }
        );
        const expired = await request(app)
            [method.toLowerCase()](url)
            .set('Authorization', `Bearer ${expiredToken}`)
            .send(data);
        expect(expired.status).toBe(403);
        expect(PostMortem.create).not.toHaveBeenCalled();
        expect(PostMortem.findOneAndUpdate).not.toHaveBeenCalled();
        expect(PostMortem.findOneAndDelete).not.toHaveBeenCalled();
    });

    test.each([
        {},
        { ...payload, incidentId: 'invalid' },
        { ...payload, incidentId: [incidentId] },
        { ...payload, rootCause: ' ' },
        { ...payload, impact: null },
        { ...payload, rootCause: 10 },
        { ...payload, lessonsLearned: null },
        { ...payload, actionItems: null },
        { ...payload, actionItems: {} },
        { ...payload, actionItems: [null] },
        { ...payload, actionItems: ['item'] },
        { ...payload, actionItems: [{}] },
        { ...payload, actionItems: [{ description: ' ' }] },
        {
            ...payload,
            actionItems: [{ description: 'Monitor', status: 'Invalid' }],
        },
        { ...payload, actionItems: [{ description: 'Monitor', status: null }] },
        {
            ...payload,
            actionItems: [{ description: 'Monitor', status: ['Pending'] }],
        },
    ])(
        'rejects invalid create input %# before accessing the database',
        async (data) => {
            const response = await request(app)
                .post('/post-mortems')
                .set('Authorization', `Bearer ${token}`)
                .send(data);
            expect(response.status).toBe(400);
            expect(response.body.errors.length).toBeGreaterThan(0);
            expect(Incident.exists).not.toHaveBeenCalled();
            expect(PostMortem.create).not.toHaveBeenCalled();
        }
    );

    test('returns 404 when the incident does not exist', async () => {
        Incident.exists.mockResolvedValue(null);
        const response = await request(app)
            .post('/post-mortems')
            .set('Authorization', `Bearer ${token}`)
            .send(payload);
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: 'Incident not found.' });
        expect(PostMortem.create).not.toHaveBeenCalled();
    });

    test('rejects a second report for the same incident', async () => {
        PostMortem.exists.mockResolvedValue({ _id: reportId });
        const response = await request(app)
            .post('/post-mortems')
            .set('Authorization', `Bearer ${token}`)
            .send(payload);
        expect(response.status).toBe(409);
        expect(PostMortem.create).not.toHaveBeenCalled();
    });

    test('handles a duplicate-key race as a conflict', async () => {
        PostMortem.create.mockRejectedValue({ code: 11000 });
        const response = await request(app)
            .post('/post-mortems')
            .set('Authorization', `Bearer ${token}`)
            .send(payload);
        expect(response.status).toBe(409);
    });

    test('lists reports with defaults and stable ordering', async () => {
        const response = await request(app).get('/post-mortems');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            total: 1,
            page: 1,
            limit: 10,
            postMortems: [report],
        });
        expect(findQuery.sort).toHaveBeenCalledWith({ createdAt: -1, _id: -1 });
        expect(findQuery.skip).toHaveBeenCalledWith(0);
        expect(findQuery.limit).toHaveBeenCalledWith(10);
    });

    test.each(['/post-mortems', '/post-mortems/search'])(
        'filters and paginates %s, treating regex syntax as literal text',
        async (url) => {
            const response = await request(app).get(url).query({
                incidentId,
                createdBy: userId,
                search: 'pool.*',
                rootCause: 'DB [timeout]',
                impact: 'API',
                lessonsLearned: 'Monitor',
                actionItemStatus: 'Pending',
                page: 2,
                limit: 5,
                unsupported: 'ignored',
            });
            expect(response.status).toBe(200);
            const filter = {
                incidentId,
                createdBy: userId,
                rootCause: { $regex: 'DB \\[timeout\\]', $options: 'i' },
                impact: { $regex: 'API', $options: 'i' },
                lessonsLearned: { $regex: 'Monitor', $options: 'i' },
                'actionItems.status': 'Pending',
                $or: [
                    'rootCause',
                    'impact',
                    'lessonsLearned',
                    'actionItems.description',
                ].map((field) => ({
                    [field]: { $regex: 'pool\\.\\*', $options: 'i' },
                })),
            };
            expect(PostMortem.find).toHaveBeenCalledWith(filter);
            expect(PostMortem.countDocuments).toHaveBeenCalledWith(filter);
            expect(findQuery.skip).toHaveBeenCalledWith(5);
            expect(findQuery.limit).toHaveBeenCalledWith(5);
            expect(response.body.page).toBe(2);
        }
    );

    test.each([
        { page: 0 },
        { page: -1 },
        { page: 'abc' },
        { page: '1.5' },
        { limit: 0 },
        { limit: 101 },
        { limit: 'abc' },
        { incidentId: 'invalid' },
        { createdBy: 'invalid' },
        { actionItemStatus: 'Invalid' },
        { search: ['one', 'two'] },
        { page: ['1', '2'] },
        { limit: ['1', '2'] },
        { incidentId: [incidentId, userId] },
        { createdBy: [userId, incidentId] },
        { actionItemStatus: ['Pending', 'Completed'] },
        { 'incidentId[$ne]': 'invalid' },
    ])('rejects invalid query %#', async (query) => {
        const response = await request(app)
            .get('/post-mortems/search')
            .query(query);
        expect(response.status).toBe(400);
        expect(PostMortem.find).not.toHaveBeenCalled();
    });

    test('an incident without a report returns an empty page', async () => {
        findQuery.limit.mockResolvedValue([]);
        PostMortem.countDocuments.mockResolvedValue(0);
        const response = await request(app)
            .get('/post-mortems')
            .query({ incidentId });
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            total: 0,
            page: 1,
            limit: 10,
            postMortems: [],
        });
    });

    test('retrieves a report by its own ID without authentication', async () => {
        const response = await request(app).get(`/post-mortems/${reportId}`);
        expect(response.status).toBe(200);
        expect(response.body).toEqual(report);
        expect(PostMortem.findOne).toHaveBeenCalledWith({ _id: reportId });
    });

    test.each(['get', 'patch', 'delete'])(
        'rejects an invalid ID for %s',
        async (method) => {
            const response = await request(app)
                [method]('/post-mortems/invalid')
                .set('Authorization', `Bearer ${token}`)
                .send({ impact: 'Updated' });
            expect(response.status).toBe(400);
            expect(response.body).toEqual({ message: 'Invalid ID format.' });
        }
    );

    test('partially updates reports, protecting attribution and linkage', async () => {
        const response = await request(app)
            .patch(`/post-mortems/${reportId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                impact: '  Updated  ',
                incidentId: userId,
                createdBy: incidentId,
                _id: incidentId,
                createdAt: '2000-01-01',
                $unset: { rootCause: 1 },
            });
        expect(response.status).toBe(200);
        expect(PostMortem.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: reportId },
            { $set: { impact: 'Updated' } },
            { new: true, runValidators: true }
        );
    });

    test('updates action items and strips unsupported nested fields', async () => {
        const response = await request(app)
            .patch(`/post-mortems/${reportId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                actionItems: [
                    {
                        description: '  Monitor  ',
                        status: 'Completed',
                        _id: incidentId,
                        owner: userId,
                    },
                    { description: 'Alert' },
                ],
            });
        expect(response.status).toBe(200);
        expect(PostMortem.findOneAndUpdate.mock.calls[0][1]).toEqual({
            $set: {
                actionItems: [
                    { description: 'Monitor', status: 'Completed' },
                    { description: 'Alert' },
                ],
            },
        });
    });

    test('allows clearing optional report fields', async () => {
        const response = await request(app)
            .patch(`/post-mortems/${reportId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ actionItems: [], lessonsLearned: '' });
        expect(response.status).toBe(200);
        expect(PostMortem.findOneAndUpdate.mock.calls[0][1]).toEqual({
            $set: { actionItems: [], lessonsLearned: '' },
        });
    });

    test.each([
        {},
        { createdBy: userId },
        { impact: ' ' },
        { actionItems: null },
        { actionItems: [{ description: 'Monitor', status: 'invalid' }] },
    ])('rejects invalid or empty updates %#', async (data) => {
        const response = await request(app)
            .patch(`/post-mortems/${reportId}`)
            .set('Authorization', `Bearer ${token}`)
            .send(data);
        expect(response.status).toBe(400);
        expect(PostMortem.findOneAndUpdate).not.toHaveBeenCalled();
    });

    test('deletes a report and returns the deleted document', async () => {
        const response = await request(app)
            .delete(`/post-mortems/${reportId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body).toEqual(report);
        expect(PostMortem.findOneAndDelete).toHaveBeenCalledWith({
            _id: reportId,
        });
        expect(Incident.exists).not.toHaveBeenCalled();
    });

    test.each([
        ['get', 'findOne'],
        ['patch', 'findOneAndUpdate'],
        ['delete', 'findOneAndDelete'],
    ])(
        'returns 404 for %s of a missing report',
        async (method, modelMethod) => {
            PostMortem[modelMethod].mockResolvedValue(null);
            const response = await request(app)
                [method](`/post-mortems/${reportId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ impact: 'Updated' });
            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                message: 'Post-mortem not found.',
            });
        }
    );

    test.each([
        ['post', '/post-mortems', 'create'],
        ['get', '/post-mortems', 'countDocuments'],
        ['get', `/post-mortems/${reportId}`, 'findOne'],
        ['patch', `/post-mortems/${reportId}`, 'findOneAndUpdate'],
        ['delete', `/post-mortems/${reportId}`, 'findOneAndDelete'],
    ])(
        'returns 500 for database errors during %s %s',
        async (method, url, modelMethod) => {
            PostMortem[modelMethod].mockRejectedValue(
                new Error('private database details')
            );
            const response = await request(app)
                [method](url)
                .set('Authorization', `Bearer ${token}`)
                .send(payload);
            expect(response.status).toBe(500);
            expect(response.body.message).not.toContain(
                'private database details'
            );
        }
    );

    test('maps schema validation errors to 400', async () => {
        PostMortem.create.mockRejectedValue({ name: 'ValidationError' });
        const response = await request(app)
            .post('/post-mortems')
            .set('Authorization', `Bearer ${token}`)
            .send(payload);
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: 'Invalid post-mortem data.' });
    });

    test('incident cleanup tolerates an absent post-mortem and reports DB failures', async () => {
        PostMortem.findOneAndDelete.mockResolvedValue(null);
        await expect(
            deletePostMortemByIncidentId(incidentId)
        ).resolves.toBeNull();
        expect(PostMortem.findOneAndDelete).toHaveBeenCalledWith({
            incidentId,
        });
        PostMortem.findOneAndDelete.mockRejectedValue(
            new Error('database failure')
        );
        await expect(
            deletePostMortemByIncidentId(incidentId)
        ).rejects.toMatchObject({ statusCode: 500 });
    });

    test('the incident deletion route also deletes its post-mortem', async () => {
        const response = await request(app).delete(`/incidents/${incidentId}`);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ _id: incidentId });
        expect(PostMortem.findOneAndDelete).toHaveBeenCalledWith({
            incidentId,
        });
    });

    test('incident deletion reports a post-mortem cleanup failure', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        PostMortem.findOneAndDelete.mockRejectedValue(
            new Error('database failure')
        );
        const response = await request(app).delete(`/incidents/${incidentId}`);
        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            message: 'Failed to delete post-mortem.',
        });
    });

    test('CORS preflight permits PATCH for the frontend', async () => {
        const response = await request(app)
            .options(`/post-mortems/${reportId}`)
            .set('Origin', 'http://localhost:5173')
            .set('Access-Control-Request-Method', 'PATCH');
        expect(response.status).toBe(200);
        expect(response.headers['access-control-allow-methods']).toContain(
            'PATCH'
        );
    });

    test('Swagger documents every route and resolves local component references', () => {
        expect(
            Object.keys(specs.paths).filter((path) =>
                path.startsWith('/post-mortems')
            )
        ).toEqual(
            expect.arrayContaining([
                '/post-mortems',
                '/post-mortems/search',
                '/post-mortems/{id}',
            ])
        );
        expect(specs.paths['/post-mortems'].get.security).toEqual([]);
        expect(specs.paths['/post-mortems'].post.security).toEqual([
            { bearerAuth: [] },
        ]);
        expect(specs.paths['/post-mortems/{id}'].patch).toBeDefined();
        expect(specs.paths['/post-mortems/{id}'].delete).toBeDefined();
        const references = [];
        function collectReferences(value) {
            if (!value || typeof value !== 'object') return;
            if (value.$ref) references.push(value.$ref);
            Object.values(value).forEach(collectReferences);
        }
        collectReferences(specs);
        for (const reference of references) {
            const target = reference
                .slice(2)
                .split('/')
                .reduce((node, key) => node?.[key], specs);
            expect(target).toBeDefined();
        }
    });
});
