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

// swagger init for documentation
const { specs, swaggerUi } = require('./swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// homepage route to confirm server running
app.get('/', (request, response) => {
    response.json({
        message: 'Hello, world!',
    });
});

// incident routes
const incidentRoutes = require('./routes/incidentRoutes');
app.use('/incidents', incidentRoutes);

module.exports = {
    app,
};
