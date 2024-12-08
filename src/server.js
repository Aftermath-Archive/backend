const express = require('express');
const app = express();

const cors = require('cors');
let corsOptions = {
    origin: [
        'http://localhost:3000', // CRA local
        'http://localhost:5173', // vite local
        'http://aftermath-archive.xyz/', // production
    ],
    optionsSuccessStatus: 200,
};

// middleware setup
app.use(express.json());
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));

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
