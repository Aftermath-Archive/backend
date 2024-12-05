const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Aftermath Archive Backend API',
            version: '1.0.0',
            description:
                'An Express API with Swagger documentation for Aftermath Archive',
        },
        servers: [
            {
                url: 'http://localhost:8080',
                description: 'Local server',
            },
            {
                url: 'https://backend-1ggt.onrender.com',
                description: 'Deployed server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: [__dirname + '/routes/*.js'], // Using absolute path to routes as relative broke
};

const specs = swaggerJsdoc(options);

module.exports = {
    specs,
    swaggerUi,
};
