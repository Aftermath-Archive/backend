const { isIP } = require('node:net');
function corsOrigins(env = process.env) {
    const configured = env.CORS_ORIGINS;
    if (!configured && env.NODE_ENV === 'production')
        throw new Error('CORS_ORIGINS must be configured in production.');
    const origins = (
        configured || 'http://localhost:3000,http://localhost:5173'
    )
        .split(',')
        .map((value) => value.trim());
    for (const origin of origins) {
        let url;
        try {
            url = new URL(origin);
        } catch {
            throw new Error('CORS_ORIGINS contains an invalid origin.');
        }
        if (
            !['http:', 'https:'].includes(url.protocol) ||
            url.origin !== origin
        )
            throw new Error('CORS_ORIGINS must contain exact HTTP(S) origins.');
        if (env.NODE_ENV === 'production' && url.protocol !== 'https:')
            throw new Error('Production CORS origins must use HTTPS.');
    }
    return origins;
}
function trustedProxies(env = process.env) {
    if (!env.TRUST_PROXY_CIDRS) return false;
    const values = env.TRUST_PROXY_CIDRS.split(',').map((value) =>
        value.trim()
    );
    for (const value of values) {
        const [address, prefix, extra] = value.split('/');
        const version = isIP(address);
        if (
            !version ||
            extra !== undefined ||
            (prefix !== undefined &&
                (!/^\d+$/.test(prefix) ||
                    Number(prefix) < 1 ||
                    Number(prefix) > (version === 4 ? 32 : 128)))
        ) {
            throw new Error(
                'TRUST_PROXY_CIDRS must contain explicit IP addresses or non-global CIDRs.'
            );
        }
    }
    return values;
}
function databaseUrl(env = process.env) {
    const value =
        env.DATABASE_URL ||
        (env.NODE_ENV !== 'production'
            ? 'mongodb://127.0.0.1:27017/aftermath'
            : '');
    if (typeof value !== 'string' || !/^mongodb(?:\+srv)?:\/\//.test(value))
        throw new Error('A MongoDB DATABASE_URL is required.');
    return value;
}
function runtimeConfig(env = process.env) {
    const port = env.PORT || '8080';
    if (!/^\d+$/.test(String(port)) || Number(port) < 1 || Number(port) > 65535)
        throw new Error('PORT must be between 1 and 65535.');
    if (
        typeof env.JWT_SECRET_KEY !== 'string' ||
        Buffer.byteLength(env.JWT_SECRET_KEY) < 32 ||
        /^(your_secret_key|change[-_]?me)/i.test(env.JWT_SECRET_KEY)
    ) {
        throw new Error(
            'JWT_SECRET_KEY must be a strong secret of at least 32 bytes.'
        );
    }
    corsOrigins(env);
    trustedProxies(env);
    return { port: Number(port), databaseUrl: databaseUrl(env) };
}
module.exports = { corsOrigins, trustedProxies, databaseUrl, runtimeConfig };
