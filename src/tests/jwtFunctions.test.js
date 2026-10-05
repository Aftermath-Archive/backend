const jwt = require('jsonwebtoken');
const {
    generateJWT,
    verifyJWT,
    extractBearerToken,
} = require('../functions/jwtFunctions');

const userId = '507f1f77bcf86cd799439013';
const secret = 'isolated-jwt-function-test-secret';

describe('Access tokens', () => {
    let originalSecret;

    beforeEach(() => {
        originalSecret = process.env.JWT_SECRET_KEY;
        process.env.JWT_SECRET_KEY = secret;
    });

    afterEach(() => {
        if (originalSecret === undefined) delete process.env.JWT_SECRET_KEY;
        else process.env.JWT_SECRET_KEY = originalSecret;
    });

    test('issues HS256 tokens with the existing id claim and 24-hour expiry', () => {
        const token = generateJWT(userId);
        const decoded = jwt.decode(token, { complete: true });
        expect(decoded.header.alg).toBe('HS256');
        expect(decoded.payload.id).toBe(userId);
        expect(decoded.payload.exp - decoded.payload.iat).toBe(86400);
        expect(verifyJWT(token).id).toBe(userId);
    });

    test('accepts an existing login token with a valid id and expiry', () => {
        const token = jwt.sign({ id: userId }, secret, { expiresIn: '24h' });
        expect(verifyJWT(token).id).toBe(userId);
    });

    test.each([
        [{ id: userId }, { expiresIn: -1 }],
        [{ id: userId }, { expiresIn: 60, algorithm: 'HS384' }],
        [{ id: userId }, {}],
        [{ userId }, { expiresIn: 60 }],
        [{ id: 'not-a-user-id' }, { expiresIn: 60 }],
        [{ id: { $ne: null } }, { expiresIn: 60 }],
    ])('rejects expired, unsupported, or malformed tokens %#', (payload, options) => {
        expect(() => verifyJWT(jwt.sign(payload, secret, options))).toThrow();
    });

    test('rejects wrong signatures and unsigned tokens', () => {
        const wrongKey = jwt.sign({ id: userId }, 'other-secret', { expiresIn: 60 });
        const unsigned = jwt.sign({ id: userId }, null, { algorithm: 'none', expiresIn: 60 });
        expect(() => verifyJWT(wrongKey)).toThrow();
        expect(() => verifyJWT(unsigned)).toThrow();
    });

    test('rejects invalid signing identities and a missing secret', () => {
        expect(() => generateJWT(undefined)).toThrow('valid user ID');
        delete process.env.JWT_SECRET_KEY;
        expect(() => generateJWT(userId)).toThrow('JWT_SECRET_KEY');
    });

    test('reads the configured secret when called instead of caching it at import', () => {
        process.env.JWT_SECRET_KEY = 'replacement-test-secret';
        const token = generateJWT(userId);
        expect(jwt.verify(token, 'replacement-test-secret').id).toBe(userId);
        expect(() => jwt.verify(token, secret)).toThrow();
    });

    test.each([
        ['Bearer abc.def.ghi', 'abc.def.ghi'],
        ['bearer abc.def.ghi', 'abc.def.ghi'],
        [' Bearer  abc.def.ghi ', 'abc.def.ghi'],
        ['Basic abc.def.ghi', null],
        ['Bearer', null],
        ['Bearer one two', null],
        [undefined, null],
    ])('extracts bearer headers %#', (header, expected) => {
        expect(extractBearerToken(header)).toBe(expected);
    });
});
