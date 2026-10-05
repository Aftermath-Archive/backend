// CI supplies a dedicated ephemeral MongoDB service. Local runs skip this suite
// unless an explicitly named test database is supplied; never use application DBs.
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { User } = require('../models/userModel');
const { Incident } = require('../models/incidentModel');
const { PostMortem } = require('../models/postmortemModel');
const { createApp } = require('../server');
const request = require('./helpers/requestApp');

const url = process.env.INTEGRATION_DATABASE_URL;
const describeDatabase = url ? describe : describe.skip;
describeDatabase('Security routes with disposable MongoDB', () => {
    let app, member, other, admin, memberToken, adminToken, incidentId;
    const password = 'StrongPass123!';
    beforeAll(async () => {
        // Intentionally refuse even a configured URL if its DB is not marked test.
        if (
            !/^mongodb:\/\/127\.0\.0\.1:27017\/aftermath_[a-z_]+_test$/.test(
                url
            )
        ) {
            throw new Error(
                'Integration tests require a dedicated local aftermath_*_test database.'
            );
        }
        process.env.JWT_SECRET_KEY =
            'disposable-integration-test-secret-at-least-32-bytes';
        await mongoose.connect(url, { serverSelectionTimeoutMS: 10000 });
        await Promise.all([User.init(), Incident.init(), PostMortem.init()]);
        app = createApp({ NODE_ENV: 'test' });
        member = await User.create({
            username: 'member',
            email: 'member@example.com',
            password: await bcrypt.hash(password, 12),
        });
        other = await User.create({
            username: 'other',
            email: 'other@example.com',
            password: await bcrypt.hash(password, 12),
        });
        admin = await User.create({
            username: 'admin',
            email: 'admin@example.com',
            role: 'Admin',
            password: await bcrypt.hash(password, 12),
        });
        const login = async (username) =>
            (
                await request(app)
                    .post('/auth/login')
                    .send({ username, password })
            ).body.token;
        memberToken = await login('member');
        adminToken = await login('admin');
        const response = await request(app)
            .post('/incidents')
            .set('Authorization', `Bearer ${memberToken}`)
            .send({
                title: 'Live database incident',
                description: 'Integration outage',
                environment: 'Production',
            });
        if (response.status !== 201)
            throw new Error('Integration incident creation failed.');
        incidentId = response.body._id;
    }, 30000);
    afterAll(async () => {
        if (
            mongoose.connection.readyState === 1 &&
            /^aftermath_[a-z_]+_test$/.test(mongoose.connection.name)
        ) {
            await mongoose.connection.dropDatabase();
        }
        await mongoose.disconnect();
    });
    test('passwords are excluded from default queries and all account responses', async () => {
        expect((await User.findById(member._id)).password).toBeUndefined();
        const response = await request(app)
            .get('/users')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(response.status).toBe(200);
        expect(response.body.users).toHaveLength(3);
        for (const user of response.body.users) {
            expect(user.password).toBeUndefined();
            expect(user.tokenVersion).toBeUndefined();
        }
    });
    test('member edits work; anonymous/operator/privilege writes fail without data changes', async () => {
        expect(
            (
                await request(app)
                    .patch(`/incidents/${incidentId}`)
                    .send({ title: 'anonymous' })
            ).status
        ).toBe(401);
        expect(
            (
                await request(app)
                    .patch(`/incidents/${incidentId}`)
                    .set('Authorization', `Bearer ${memberToken}`)
                    .send({ $set: { createdBy: String(admin._id) } })
            ).status
        ).toBe(400);
        expect(
            (
                await request(app)
                    .patch(`/users/${member._id}`)
                    .set('Authorization', `Bearer ${memberToken}`)
                    .send({ role: 'Admin' })
            ).status
        ).toBe(400);
        const edited = await request(app)
            .patch(`/incidents/${incidentId}`)
            .set('Authorization', `Bearer ${memberToken}`)
            .send({ title: 'Safe edit', status: 'Resolved' });
        expect(edited.status).toBe(200);
        expect(edited.body.createdBy).toBe(String(member._id));
        expect(edited.body.updatedBy).toBe(String(member._id));
        expect(edited.body.resolvedAt).toBeDefined();
        expect((await User.findById(member._id)).role).toBe('TeamMember');
    });
    test('admin-only incident deletion cascades report cleanup', async () => {
        const report = await request(app)
            .post('/post-mortems')
            .set('Authorization', `Bearer ${memberToken}`)
            .send({ incidentId, rootCause: 'Timeout', impact: 'Offline' });
        expect(report.status).toBe(201);
        expect(
            (
                await request(app)
                    .delete(`/post-mortems/${report.body._id}`)
                    .set('Authorization', `Bearer ${memberToken}`)
            ).status
        ).toBe(403);
        expect(
            (
                await request(app)
                    .delete(`/incidents/${incidentId}`)
                    .set('Authorization', `Bearer ${memberToken}`)
            ).status
        ).toBe(403);
        expect(
            (
                await request(app)
                    .delete(`/incidents/${incidentId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
            ).status
        ).toBe(200);
        expect(await Incident.findById(incidentId)).toBeNull();
        expect(await PostMortem.findById(report.body._id)).toBeNull();
    });
    test('a real password change hashes correctly and invalidates prior tokens', async () => {
        const replacement = 'Replacement123!';
        const response = await request(app)
            .patch(`/users/${member._id}`)
            .set('Authorization', `Bearer ${memberToken}`)
            .send({ currentPassword: password, password: replacement });
        expect(response.status).toBe(200);
        const stored = await User.findById(member._id).select(
            '+password +tokenVersion'
        );
        expect(await bcrypt.compare(replacement, stored.password)).toBe(true);
        expect(stored.tokenVersion).toBe(1);
        expect(
            (
                await request(app)
                    .get(`/users/${member._id}`)
                    .set('Authorization', `Bearer ${memberToken}`)
            ).status
        ).toBe(403);
        const login = await request(app)
            .post('/auth/login')
            .send({ username: 'member', password: replacement });
        expect(login.status).toBe(200);
        expect(
            (
                await request(app)
                    .get(`/users/${member._id}`)
                    .set('Authorization', `Bearer ${login.body.token}`)
            ).status
        ).toBe(200);
    });
    test('deactivated accounts cannot reuse tokens or log in', async () => {
        const login = await request(app)
            .post('/auth/login')
            .send({ username: 'other', password });
        expect(
            (
                await request(app)
                    .delete(`/users/${other._id}`)
                    .set('Authorization', `Bearer ${adminToken}`)
            ).status
        ).toBe(200);
        expect(
            (
                await request(app)
                    .get(`/users/${other._id}`)
                    .set('Authorization', `Bearer ${login.body.token}`)
            ).status
        ).toBe(403);
        expect(
            (
                await request(app)
                    .post('/auth/login')
                    .send({ username: 'other', password })
            ).status
        ).toBe(400);
    });
});
