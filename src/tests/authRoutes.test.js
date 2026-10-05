jest.mock('../models/userModel', () => ({
    User: { findOne: jest.fn(), findById: jest.fn() },
}));
jest.mock('../models/incidentModel', () => ({
    Incident: { findOne: jest.fn(), findOneAndUpdate: jest.fn() },
}));
jest.mock('bcrypt', () => ({ compare: jest.fn() }));
jest.mock('../utils/logError');

process.env.JWT_SECRET_KEY = 'isolated-auth-route-test-secret';

const request = require('./helpers/requestApp');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { app } = require('../server');
const { User } = require('../models/userModel');
const { Incident } = require('../models/incidentModel');
const { generateJWT } = require('../functions/jwtFunctions');

const userId = '507f1f77bcf86cd799439013';
const incidentId = '507f1f77bcf86cd799439011';
const credentials = { username: 'test-user', password: 'test-password' };

describe('JWT authentication across API routes', () => {
    let user;

    beforeEach(() => {
        jest.resetAllMocks();
        user = {
            _id: userId,
            isActive: true,
            password: 'fake-hash',
            save: jest.fn().mockResolvedValue(undefined),
        };
        User.findOne.mockResolvedValue(user);
        User.findById.mockResolvedValue(user);
        bcrypt.compare.mockResolvedValue(true);
        Incident.findOne.mockResolvedValue({ _id: incidentId });
        Incident.findOneAndUpdate.mockResolvedValue({ _id: incidentId });
    });

    test('a login token works for writes and shared-middleware logout', async () => {
        const login = await request(app).post('/auth/login').send(credentials);
        expect(login.status).toBe(200);
        expect(login.body.message).toBe('Logged in successfully');
        const payload = jwt.verify(
            login.body.token,
            process.env.JWT_SECRET_KEY
        );
        expect(payload.id).toBe(userId);
        expect(payload.exp - payload.iat).toBe(86400);
        const discussion = await request(app)
            .post(`/incidents/${incidentId}/discussion`)
            .set('Authorization', `Bearer ${login.body.token}`)
            .send({ message: '  Confirmed  ', author: incidentId });
        expect(discussion.status).toBe(200);
        expect(Incident.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: incidentId },
            {
                $push: {
                    caseDiscussion: { message: 'Confirmed', author: userId },
                },
            },
            { new: true, runValidators: true }
        );
        const logout = await request(app)
            .get('/auth/logout')
            .set('Authorization', `Bearer ${login.body.token}`);
        expect(logout.status).toBe(200);
    });

    test.each([
        {},
        { username: { $ne: null }, password: 'test-password' },
        { username: 'test-user', password: 123 },
    ])(
        'rejects malformed credentials before querying users %#',
        async (body) => {
            const response = await request(app).post('/auth/login').send(body);
            expect(response.status).toBe(400);
            expect(User.findOne).not.toHaveBeenCalled();
        }
    );

    test.each(['missing', 'inactive', 'wrong-password'])(
        'rejects %s users with the same login response',
        async (condition) => {
            if (condition === 'missing') User.findOne.mockResolvedValue(null);
            if (condition === 'inactive') user.isActive = false;
            if (condition === 'wrong-password')
                bcrypt.compare.mockResolvedValue(false);
            const response = await request(app)
                .post('/auth/login')
                .send(credentials);
            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'Invalid username or password',
            });
            expect(user.save).not.toHaveBeenCalled();
        }
    );

    test.each([false, null])(
        'rejects an inactive or missing account %#',
        async (active) => {
            const token = generateJWT(userId);
            User.findById.mockResolvedValue(
                active === null ? null : { ...user, isActive: false }
            );
            const discussion = await request(app)
                .post(`/incidents/${incidentId}/discussion`)
                .set('Authorization', `Bearer ${token}`)
                .send({ message: 'Blocked' });
            expect(discussion.status).toBe(403);
            expect(Incident.findOneAndUpdate).not.toHaveBeenCalled();
            const logout = await request(app)
                .get('/auth/logout')
                .set('Authorization', `Bearer ${token}`);
            expect(logout.status).toBe(403);
        }
    );

    test.each(['Basic', 'Bearer extra'])(
        'rejects malformed authorization %#',
        async (scheme) => {
            const response = await request(app)
                .post(`/incidents/${incidentId}/discussion`)
                .set('Authorization', `${scheme} ${generateJWT(userId)}`)
                .send({ message: 'Blocked' });
            expect(response.status).toBe(403);
            expect(User.findById).not.toHaveBeenCalled();
        }
    );

    test('requires authentication on discussions', async () => {
        const response = await request(app)
            .post(`/incidents/${incidentId}/discussion`)
            .send({ message: 'Blocked', author: userId });
        expect(response.status).toBe(401);
        expect(Incident.findOneAndUpdate).not.toHaveBeenCalled();
    });

    test.each([
        [{ id: userId }, {}],
        [{ id: 'invalid' }, { expiresIn: 60 }],
        [{ id: userId }, { algorithm: 'HS384', expiresIn: 60 }],
        [{ id: userId }, { expiresIn: -1 }],
    ])(
        'enforces the same claims and algorithms on logout %#',
        async (payload, options) => {
            const token = jwt.sign(
                payload,
                process.env.JWT_SECRET_KEY,
                options
            );
            const response = await request(app)
                .get('/auth/logout')
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(403);
            expect(User.findById).not.toHaveBeenCalled();
        }
    );

    test('returns a controlled error if the authentication database lookup fails', async () => {
        User.findById.mockRejectedValue(new Error('private database details'));
        const response = await request(app)
            .post(`/incidents/${incidentId}/discussion`)
            .set('Authorization', `Bearer ${generateJWT(userId)}`)
            .send({ message: 'Blocked' });
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: 'Internal server error' });
        expect(Incident.findOneAndUpdate).not.toHaveBeenCalled();
    });
});
