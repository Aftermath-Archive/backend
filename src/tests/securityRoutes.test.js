jest.mock('../models/userModel', () => ({
    User: {
        findOne: jest.fn(),
        findById: jest.fn(),
        find: jest.fn(),
        countDocuments: jest.fn(),
        create: jest.fn(),
        findOneAndUpdate: jest.fn(),
    },
}));
jest.mock('../models/incidentModel', () => ({
    Incident: {
        create: jest.fn(),
        countDocuments: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        findOneAndUpdate: jest.fn(),
        findOneAndDelete: jest.fn(),
    },
}));
jest.mock('../models/postmortemModel', () => ({
    PostMortem: { findOneAndDelete: jest.fn() },
}));
jest.mock('bcrypt', () => ({ compare: jest.fn(), hash: jest.fn() }));
jest.mock('../utils/logError');
process.env.JWT_SECRET_KEY = 'security-test-secret-with-at-least-32-bytes';
const request = require('./helpers/requestApp');
const { createApp } = require('../server');
const { User } = require('../models/userModel');
const { Incident } = require('../models/incidentModel');
const { PostMortem } = require('../models/postmortemModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { generateJWT } = require('../functions/jwtFunctions');
const userId = '507f1f77bcf86cd799439013';
const otherId = '507f1f77bcf86cd799439014';
const incidentId = '507f1f77bcf86cd799439011';
const validIncident = {
    title: 'Outage',
    description: 'Unavailable',
    environment: 'Production',
};
const validUser = {
    username: 'member',
    email: 'member@example.com',
    password: 'StrongPass123!',
};
let app, user, query;
const authed = (method, url, version = 0) =>
    request(app)
        [method](url)
        .set('Authorization', `Bearer ${generateJWT(userId, version)}`);
beforeEach(() => {
    jest.resetAllMocks();
    app = createApp({ NODE_ENV: 'test' });
    user = {
        _id: userId,
        username: 'member',
        email: 'private@example.com',
        role: 'TeamMember',
        isActive: true,
        password: 'private-hash',
        tokenVersion: 0,
        oauthId: 'private-oauth',
        save: jest.fn().mockResolvedValue(undefined),
    };
    User.findById.mockResolvedValue(user);
    User.findOne.mockResolvedValue(user);
    User.findOneAndUpdate.mockResolvedValue(user);
    User.create.mockResolvedValue(user);
    User.countDocuments.mockResolvedValue(1);
    query = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([user]),
    };
    User.find.mockReturnValue(query);
    Incident.find.mockReturnValue(query);
    Incident.findOne.mockResolvedValue({ _id: incidentId });
    Incident.create.mockResolvedValue({ _id: incidentId });
    Incident.countDocuments.mockResolvedValue(0);
    Incident.findOneAndUpdate.mockResolvedValue({ _id: incidentId });
    Incident.findOneAndDelete.mockResolvedValue({ _id: incidentId });
    PostMortem.findOneAndDelete.mockResolvedValue(null);
    bcrypt.compare.mockResolvedValue(true);
    bcrypt.hash.mockResolvedValue('new-bcrypt-hash');
});

test.each([
    ['get', '/users'],
    ['get', `/users/${userId}`],
    ['patch', `/users/${userId}`],
    ['delete', `/users/${userId}`],
    ['post', '/incidents'],
    ['patch', `/incidents/${incidentId}`],
    ['delete', `/incidents/${incidentId}`],
    ['post', `/incidents/${incidentId}/discussion`],
])(
    'anonymous %s %s cannot access protected operations',
    async (method, url) => {
        const result = await request(app)[method](url).send(validIncident);
        expect(result.status).toBe(401);
        expect(User.findOneAndUpdate).not.toHaveBeenCalled();
        expect(Incident.findOneAndUpdate).not.toHaveBeenCalled();
        expect(Incident.findOneAndDelete).not.toHaveBeenCalled();
    }
);
test.each(['patch', 'delete'])(
    'a member cannot %s another account',
    async (method) => {
        expect(
            (
                await authed(method, `/users/${otherId}`).send({
                    username: 'updated',
                })
            ).status
        ).toBe(403);
        expect(User.findOneAndUpdate).not.toHaveBeenCalled();
        expect(User.findOne).not.toHaveBeenCalled();
    }
);
test('a member cannot list accounts or delete incidents', async () => {
    expect((await authed('get', '/users')).status).toBe(403);
    expect((await authed('delete', `/incidents/${incidentId}`)).status).toBe(
        403
    );
    expect(User.find).not.toHaveBeenCalled();
    expect(Incident.findOneAndDelete).not.toHaveBeenCalled();
});
test('a forged role claim cannot override the database role', async () => {
    const token = jwt.sign(
        { id: userId, role: 'Admin' },
        process.env.JWT_SECRET_KEY,
        { expiresIn: 60 }
    );
    expect(
        (
            await request(app)
                .delete(`/incidents/${incidentId}`)
                .set('Authorization', `Bearer ${token}`)
        ).status
    ).toBe(403);
});
test('active admins can list accounts and delete incidents with report cleanup', async () => {
    user.role = 'Admin';
    const list = await authed('get', '/users').query({ page: 2, limit: 5 });
    expect(list.status).toBe(200);
    expect(list.body.users[0]).not.toHaveProperty('password');
    expect(list.body.users[0]).not.toHaveProperty('tokenVersion');
    expect(list.body.users[0]).not.toHaveProperty('oauthId');
    expect(query.skip).toHaveBeenCalledWith(5);
    expect(query.limit).toHaveBeenCalledWith(5);
    expect((await authed('delete', `/incidents/${incidentId}`)).status).toBe(
        200
    );
    expect(PostMortem.findOneAndDelete).toHaveBeenCalledWith({ incidentId });
});
test('another member profile exposes only public display fields', async () => {
    const response = await authed('get', `/users/${otherId}`);
    expect(response.status).toBe(200);
    expect(Object.keys(response.body).sort()).toEqual([
        '_id',
        'profile',
        'username',
    ]);
});
test.each(['get', 'patch', 'delete'])(
    'invalid user IDs fail before target queries (%s)',
    async (method) => {
        expect(
            (
                await authed(method, '/users/invalid').send({
                    username: 'updated',
                })
            ).status
        ).toBe(400);
        expect(User.findOne).not.toHaveBeenCalled();
        expect(User.findOneAndUpdate).not.toHaveBeenCalled();
    }
);
test.each([
    { role: 'Admin' },
    { isActive: true },
    { deletedAt: null },
    { tokenVersion: 0 },
    { $set: { role: 'Admin' } },
    { 'profile.fullName': 'injected' },
    { username: { $ne: null } },
    { email: ['x@y.com'] },
    { profile: { oauthId: 'injected' } },
    { profile: { avatarUrl: 'javascript:alert(1)' } },
    { password: 'StrongPass123!' },
    { password: 'StrongPass123!', currentPassword: ['old'] },
    { password: 'A1!' + 'a'.repeat(70), currentPassword: 'old' },
])('account update rejects unsafe data %#', async (data) => {
    const response = await authed('patch', `/users/${userId}`).send(data);
    expect(response.status).toBe(400);
    expect(User.findOneAndUpdate).not.toHaveBeenCalled();
    expect(JSON.stringify(response.body)).not.toContain('StrongPass123!');
});
test('self profile edits use validated $set fields and safe responses', async () => {
    const response = await authed('patch', `/users/${userId}`).send({
        username: ' new-name ',
        profile: { fullName: ' New Name ' },
    });
    expect(response.status).toBe(200);
    expect(User.findOneAndUpdate.mock.calls[0][1]).toEqual({
        $set: { username: 'new-name', 'profile.fullName': 'New Name' },
    });
    expect(response.body).not.toHaveProperty('password');
});
test('password changes verify current credentials, hash and invalidate old tokens', async () => {
    const response = await authed('patch', `/users/${userId}`).send({
        currentPassword: 'OldPass123!',
        password: 'StrongPass123!',
    });
    expect(response.status).toBe(200);
    expect(bcrypt.compare).toHaveBeenCalledWith('OldPass123!', 'private-hash');
    expect(bcrypt.hash).toHaveBeenCalledWith('StrongPass123!', 12);
    expect(User.findOneAndUpdate.mock.calls[0][1]).toEqual({
        $set: { password: 'new-bcrypt-hash' },
        $inc: { tokenVersion: 1 },
    });
    user.tokenVersion = 1;
    expect(
        (
            await authed('patch', `/incidents/${incidentId}`).send({
                title: 'Updated',
            })
        ).status
    ).toBe(403);
    expect(
        (
            await authed('patch', `/incidents/${incidentId}`, 1).send({
                title: 'Updated',
            })
        ).status
    ).toBe(200);
});
test('wrong current password and admin resets of other accounts are rejected', async () => {
    bcrypt.compare.mockResolvedValue(false);
    expect(
        (
            await authed('patch', `/users/${userId}`).send({
                currentPassword: 'Wrong123!',
                password: 'StrongPass123!',
            })
        ).status
    ).toBe(400);
    user.role = 'Admin';
    expect(
        (
            await authed('patch', `/users/${otherId}`).send({
                currentPassword: 'Wrong123!',
                password: 'StrongPass123!',
            })
        ).status
    ).toBe(403);
    expect(User.findOneAndUpdate).not.toHaveBeenCalled();
});
test('deactivation is atomic and immediately denies authentication', async () => {
    expect((await authed('delete', `/users/${userId}`)).status).toBe(200);
    expect(User.findOneAndUpdate.mock.calls[0][0]).toEqual({
        _id: userId,
        isActive: true,
    });
    expect(User.findOneAndUpdate.mock.calls[0][1].$inc).toEqual({
        tokenVersion: 1,
    });
    user.isActive = false;
    expect(
        (
            await authed('patch', `/incidents/${incidentId}`).send({
                title: 'Updated',
            })
        ).status
    ).toBe(403);
});
test.each([
    { username: { $ne: null }, email: 'x@y.com', password: 'StrongPass123!' },
    { ...validUser, email: ['x@y.com'] },
    { ...validUser, role: 'Admin' },
    { ...validUser, isActive: false },
    { ...validUser, password: ['StrongPass123!'] },
    { ...validUser, password: 'A1!' + 'a'.repeat(70) },
    { ...validUser, username: 'a' },
])(
    'registration rejects unsafe data %# before any query/hash',
    async (data) => {
        const response = await request(app).post('/auth/register').send(data);
        expect(response.status).toBe(400);
        expect(User.create).not.toHaveBeenCalled();
        expect(bcrypt.hash).not.toHaveBeenCalled();
    }
);
test('registration fixes privilege defaults and never returns a password', async () => {
    const response = await request(app).post('/auth/register').send(validUser);
    expect(response.status).toBe(201);
    expect(User.create).toHaveBeenCalledWith({
        ...validUser,
        password: 'new-bcrypt-hash',
        role: 'TeamMember',
        isActive: true,
    });
    expect(response.body).not.toHaveProperty('password');
});
test.each([
    { title: { $gt: '' } },
    { description: ['text'] },
    { severity: ['High'] },
    { tags: { $ne: null } },
    { tags: ['x'.repeat(65)] },
    { tags: Array(11).fill('tag') },
    { assignedTo: { $ne: null } },
    { relatedIncidents: ['invalid'] },
    { relatedLinks: ['javascript:alert(1)'] },
    { createdBy: otherId },
    { updatedBy: otherId },
    { resolvedAt: '2020-01-01' },
    { caseDiscussion: [] },
    { $unset: { title: 1 } },
    { 'title.$ne': 'injected' },
    { title: 'x'.repeat(201) },
])('incident create/update rejects unsafe data %#', async (data) => {
    expect(
        (await authed('post', '/incidents').send({ ...validIncident, ...data }))
            .status
    ).toBe(400);
    expect(
        (await authed('patch', `/incidents/${incidentId}`).send(data)).status
    ).toBe(400);
    expect(Incident.create).not.toHaveBeenCalled();
    expect(Incident.findOneAndUpdate).not.toHaveBeenCalled();
});
test('incident attribution and resolution date are server-derived', async () => {
    expect(
        (await authed('post', '/incidents').send(validIncident)).status
    ).toBe(201);
    expect(Incident.create.mock.calls[0][0].createdBy).toBe(userId);
    const response = await authed('patch', `/incidents/${incidentId}`).send({
        status: 'Resolved',
        assignedTo: '',
    });
    expect(response.status).toBe(200);
    expect(Incident.findOneAndUpdate.mock.calls[0][1]).toEqual({
        $set: {
            status: 'Resolved',
            assignedTo: null,
            updatedBy: userId,
            resolvedAt: expect.any(Date),
        },
    });
});
test.each([
    { page: '-1' },
    { page: '10001' },
    { limit: '101' },
    { limit: '1abc' },
    { search: ['one', 'two'] },
    { 'title[$ne]': 'x' },
    { status: ['Open', 'Closed'] },
    { severity: 'Invalid' },
    { search: 'x'.repeat(201) },
])('unsafe query %# fails before querying', async (data) => {
    expect(
        (await request(app).get('/incidents/search').query(data)).status
    ).toBe(400);
    expect(Incident.find).not.toHaveBeenCalled();
});
test('public incident searches escape regex and paginate the database query', async () => {
    const response = await request(app)
        .get('/incidents/search')
        .query({ search: '(a+)+$', page: 3, limit: 5 });
    expect(response.status).toBe(200);
    expect(Incident.find.mock.calls[0][0].$or[0].title.$regex).toBe(
        '\\(a\\+\\)\\+\\$'
    );
    expect(query.skip).toHaveBeenCalledWith(10);
    expect(query.limit).toHaveBeenCalledWith(5);
});
test('safe 404/500 and validation/conflict responses are JSON', async () => {
    expect((await request(app).get('/missing')).status).toBe(404);
    Incident.findOne.mockResolvedValue(null);
    expect((await request(app).get(`/incidents/${incidentId}`)).status).toBe(
        404
    );
    Incident.findOne.mockRejectedValue(
        new Error('private database credentials')
    );
    const response = await request(app).get(`/incidents/${incidentId}`);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'Internal server error' });
    User.create.mockRejectedValue({
        code: 11000,
        message: 'private email/password',
    });
    expect(
        (await request(app).post('/auth/register').send(validUser)).status
    ).toBe(409);
});
test('Helmet headers and exact CORS policy cover normal/error/preflight responses', async () => {
    const allowed = await request(app)
        .get('/')
        .set('Origin', 'http://localhost:5173');
    expect(allowed.headers['access-control-allow-origin']).toBe(
        'http://localhost:5173'
    );
    expect(allowed.headers['x-content-type-options']).toBe('nosniff');
    expect(allowed.headers['x-powered-by']).toBeUndefined();
    expect(allowed.headers['content-security-policy']).toBeDefined();
    const blocked = await request(app)
        .get('/')
        .set('Origin', 'https://attacker.example');
    expect(blocked.status).toBe(403);
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
    expect(blocked.headers['x-content-type-options']).toBe('nosniff');
    const preflight = await request(app)
        .options('/incidents')
        .set('Origin', 'https://attacker.example')
        .set('Access-Control-Request-Method', 'PATCH');
    expect(preflight.status).toBe(403);
    expect(preflight.headers['access-control-allow-origin']).toBeUndefined();
});
test('malformed JSON and oversized bodies have safe responses', async () => {
    const malformed = await request(app)
        .post('/auth/login')
        .sendRaw('{"password":"PRIVATE",');
    expect(malformed.status).toBe(400);
    expect(malformed.body).toEqual({ message: 'Invalid JSON body.' });
    expect(
        (
            await request(app)
                .post('/auth/login')
                .send({ password: 'x'.repeat(70000) })
        ).status
    ).toBe(413);
    expect(
        (await request(app).post('/auth/login').send(['not-an-object'])).status
    ).toBe(400);
});
test('login throttling returns 429 and cannot be bypassed by untrusted forwarding headers', async () => {
    app = createApp({ NODE_ENV: 'test' }, { login: { limit: 2 } });
    for (let attempt = 0; attempt < 2; attempt++) {
        expect((await request(app).post('/auth/login').send({})).status).toBe(
            400
        );
    }
    const blocked = await request(app)
        .post('/auth/login')
        .set('X-Forwarded-For', '203.0.113.99')
        .send({});
    expect(blocked.status).toBe(429);
    expect(blocked.headers['retry-after']).toBeDefined();
    expect(blocked.headers.ratelimit).toBeDefined();
});
test('IPv6 addresses within one subnet share the auth quota', async () => {
    app = createApp({ NODE_ENV: 'test' }, { login: { limit: 1 } });
    expect(
        (
            await request(app)
                .post('/auth/login')
                .ip('2001:db8:abcd:1200::1')
                .send({})
        ).status
    ).toBe(400);
    expect(
        (
            await request(app)
                .post('/auth/login')
                .ip('2001:db8:abcd:1200::2')
                .send({})
        ).status
    ).toBe(429);
});
