const { describe, it: test, before, after } = require('node:test');
const assert = require('node:assert/strict');
// CI supplies a dedicated ephemeral MongoDB service. Local runs skip this suite
// unless an explicitly named test database is supplied; never use application DBs.
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { User } = require('../models/userModel');
const { Incident } = require('../models/incidentModel');
const { PostMortem } = require('../models/postmortemModel');
const { createApp } = require('../server');
const request = require('../tests/helpers/requestApp');

const url = process.env.INTEGRATION_DATABASE_URL;
const describeDatabase = url ? describe : describe.skip;
describeDatabase('Security routes with disposable MongoDB', () => {
    let app, member, other, admin, memberToken, adminToken, incidentId;
    const password = 'StrongPass123!';
    before(
        async () => {
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
            await Promise.all([
                User.init(),
                Incident.init(),
                PostMortem.init(),
            ]);
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
        },
        { timeout: 30000 }
    );
    after(async () => {
        if (
            mongoose.connection.readyState === 1 &&
            /^aftermath_[a-z_]+_test$/.test(mongoose.connection.name)
        ) {
            await mongoose.connection.dropDatabase();
        }
        await mongoose.disconnect();
    });
    test('passwords are excluded from default queries and all account responses', async () => {
        assert.equal((await User.findById(member._id)).password, undefined);
        const response = await request(app)
            .get('/users')
            .set('Authorization', `Bearer ${adminToken}`);
        assert.equal(response.status, 200);
        assert.equal(response.body.users.length, 3);
        for (const user of response.body.users) {
            assert.equal(user.password, undefined);
            assert.equal(user.tokenVersion, undefined);
        }
    });
    test('member edits work; anonymous/operator/privilege writes fail without data changes', async () => {
        assert.equal(
            (
                await request(app)
                    .patch(`/incidents/${incidentId}`)
                    .send({ title: 'anonymous' })
            ).status,
            401
        );
        assert.equal(
            (
                await request(app)
                    .patch(`/incidents/${incidentId}`)
                    .set('Authorization', `Bearer ${memberToken}`)
                    .send({ $set: { createdBy: String(admin._id) } })
            ).status,
            400
        );
        assert.equal(
            (
                await request(app)
                    .patch(`/users/${member._id}`)
                    .set('Authorization', `Bearer ${memberToken}`)
                    .send({ role: 'Admin' })
            ).status,
            400
        );
        const edited = await request(app)
            .patch(`/incidents/${incidentId}`)
            .set('Authorization', `Bearer ${memberToken}`)
            .send({ title: 'Safe edit', status: 'Resolved' });
        assert.equal(edited.status, 200);
        assert.equal(edited.body.createdBy, String(member._id));
        assert.equal(edited.body.updatedBy, String(member._id));
        assert.notEqual(edited.body.resolvedAt, undefined);
        assert.equal((await User.findById(member._id)).role, 'TeamMember');
    });
    test('admin-only incident deletion cascades report cleanup', async () => {
        const report = await request(app)
            .post('/post-mortems')
            .set('Authorization', `Bearer ${memberToken}`)
            .send({ incidentId, rootCause: 'Timeout', impact: 'Offline' });
        assert.equal(report.status, 201);
        assert.equal(
            (
                await request(app)
                    .delete(`/post-mortems/${report.body._id}`)
                    .set('Authorization', `Bearer ${memberToken}`)
            ).status,
            403
        );
        assert.equal(
            (
                await request(app)
                    .delete(`/incidents/${incidentId}`)
                    .set('Authorization', `Bearer ${memberToken}`)
            ).status,
            403
        );
        assert.equal(
            (
                await request(app)
                    .delete(`/incidents/${incidentId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
            ).status,
            200
        );
        assert.equal(await Incident.findById(incidentId), null);
        assert.equal(await PostMortem.findById(report.body._id), null);
    });
    test('a real password change hashes correctly and invalidates prior tokens', async () => {
        const replacement = 'Replacement123!';
        const response = await request(app)
            .patch(`/users/${member._id}`)
            .set('Authorization', `Bearer ${memberToken}`)
            .send({ currentPassword: password, password: replacement });
        assert.equal(response.status, 200);
        const stored = await User.findById(member._id).select(
            '+password +tokenVersion'
        );
        assert.equal(await bcrypt.compare(replacement, stored.password), true);
        assert.equal(stored.tokenVersion, 1);
        assert.equal(
            (
                await request(app)
                    .get(`/users/${member._id}`)
                    .set('Authorization', `Bearer ${memberToken}`)
            ).status,
            403
        );
        const login = await request(app)
            .post('/auth/login')
            .send({ username: 'member', password: replacement });
        assert.equal(login.status, 200);
        assert.equal(
            (
                await request(app)
                    .get(`/users/${member._id}`)
                    .set('Authorization', `Bearer ${login.body.token}`)
            ).status,
            200
        );
    });
    test('deactivated accounts cannot reuse tokens or log in', async () => {
        const login = await request(app)
            .post('/auth/login')
            .send({ username: 'other', password });
        assert.equal(
            (
                await request(app)
                    .delete(`/users/${other._id}`)
                    .set('Authorization', `Bearer ${adminToken}`)
            ).status,
            200
        );
        assert.equal(
            (
                await request(app)
                    .get(`/users/${other._id}`)
                    .set('Authorization', `Bearer ${login.body.token}`)
            ).status,
            403
        );
        assert.equal(
            (
                await request(app)
                    .post('/auth/login')
                    .send({ username: 'other', password })
            ).status,
            400
        );
    });
});
