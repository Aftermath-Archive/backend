const express = require('express');
const app = express();
const cors = require('cors');

// CORS options
let corsOptions = {
    origin: [
        'http://localhost:3000', // CRA local
        'http://localhost:5173', // vite local
        'http://aftermath-archive.xyz', // production
        'https://aftermath-archive.xyz', // production - https
    ],
    optionsSuccessStatus: 200,
};

// Middleware setup
app.use(express.json());
app.use(cors(corsOptions)); // CORS middleware
app.use(express.urlencoded({ extended: true }));

// Handle CORS preflight requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin); // Dynamically allow the requesting origin
    res.header(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS'
    );
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200); // Respond with HTTP 200 for preflight requests
    }
    next();
});

/**
 * swagger configuration
 */
const { specs, swaggerUi } = require('./swagger');
// swagger init
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * passport configuration
 */
const passport = require('passport');
require('./config/passport');

// passport init
app.use(passport.initialize());

// homepage route to confirm server running
app.get('/', (request, response) => {
    response.json({
        message: 'Hello, world!',
    });
});

/**
 * Import Routes
 */
// incident routes
const incidentRoutes = require('./routes/incidentRoutes');
app.use('/incidents', incidentRoutes);

// auth routes
const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

// user routes
const userRoutes = require('./routes/userRoutes');
app.use('/users', userRoutes);

module.exports = {
    app,
};
