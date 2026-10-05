const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { corsOrigins, trustedProxies } = require('./config/runtime');
const { plainObject } = require('./utils/inputValidation');
const AppError = require('./utils/AppError');
const errorHandler = require('./middlewares/errorHandlerMiddleware');
const validateQuery = require('./middlewares/validateQueryMiddleware');
const { specs, swaggerUi } = require('./swagger');
const createRateLimits = require('./middlewares/rateLimitMiddleware');
function createApp(env = process.env, rateLimitOptions = {}) {
    const app = express();
    const origins = corsOrigins(env);
    app.disable('x-powered-by');
    app.set('trust proxy', trustedProxies(env));
    app.set('query parser', 'simple');
    app.use(
        helmet({
            strictTransportSecurity:
                env.NODE_ENV === 'production' ? undefined : false,
            contentSecurityPolicy: {
                directives: {
                    upgradeInsecureRequests:
                        env.NODE_ENV === 'production' ? [] : null,
                },
            },
        })
    );
    app.use(
        cors({
            origin(origin, callback) {
                callback(
                    origin && !origins.includes(origin)
                        ? new AppError('Origin is not allowed.', 403)
                        : null,
                    origin || false
                );
            },
            methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            optionsSuccessStatus: 200,
        })
    );
    const limits = createRateLimits(rateLimitOptions);
    app.use(limits.api);
    app.post('/auth/login', limits.login);
    app.post('/auth/register', limits.register);
    app.use(express.json({ limit: '64kb' }));
    app.patch('/users/:id', (req, res, next) => {
        if (req.body?.password !== undefined)
            return limits.password(req, res, next);
        next();
    });
    app.use((req, res, next) => {
        if (['POST', 'PATCH'].includes(req.method) && !plainObject(req.body))
            return next(new AppError('A JSON object body is required.', 400));
        next();
    });
    app.use(validateQuery);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
    app.get('/', (req, res) => res.json({ message: 'Hello, world!' }));
    app.get('/health/ready', (req, res) => {
        const ready = require('mongoose').connection.readyState === 1;
        res.status(ready ? 200 : 503).json({ ready });
    });
    app.use('/incidents', require('./routes/incidentRoutes'));
    app.use('/post-mortems', require('./routes/postMortemRoutes'));
    app.use('/auth', require('./routes/authRoutes'));
    app.use('/users', require('./routes/userRoutes'));
    app.use((req, res) =>
        res.status(404).json({ message: 'Route not found.' })
    );
    app.use(errorHandler);
    return app;
}
const app = createApp();
module.exports = { app, createApp };
