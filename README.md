# Aftermath Archive - backend

Welcome to the backend API for Aftermath Archive, an Incident Management web application.

This backend is hosted on Render and integrates with the frontend hosted on Netlify.

It utilizes a MongoDB database, managed through MongoDB Atlas, to store and retrieve application data.

-   Frontend URL: `aftermath-archive.xyz`
-   Backend URL: `api.aftermath-archive.xyz`

## Demo Deployment:

https://aftermath-archive.xyz

## Frontend Repo:

https://github.com/Aftermath-Archive/frontend

## API Documentation

API endpoint documentation is [available here.](https://api.aftermath-archive.xyz/api-docs/)

## Coder Academy 

For students, or teachers who are viewing this repo in the context of the Coder Academy final assignment I have created a separate branch 'project-submission' [available here.](https://github.com/Aftermath-Archive/backend/tree/project-submission)

This branch captures the projects state at time of submission while future work is undergone on the project. 

## Deployment Guide

This guide outlines the steps to deploy the backend of the Aftermath Archive application to a production environment. The backend is built using Node.js and Express, and it can be deployed to a cloud hosting provider such as AWS, Heroku, Render, or DigitalOcean.

### Prerequisites

1. Node.js: Ensure you have Node.js (version 16.x or higher) installed.
2. Backend Source Code: Access to the GitHub repository containing the backend code.
3. Cloud Hosting Account: An account with a hosting provider like Heroku, AWS, Render, or DigitalOcean.
4. Database: Ensure your MongoDB database is accessible (e.g., MongoDB Atlas or a self-hosted MongoDB instance).
5. Environment Variables: Have the necessary environment variables ready, such as database connection strings, JWT secrets, and API keys.

### Steps to Deploy

#### 1. Clone the Repository

```
git clone https://github.com/Aftermath-Archive/backend
cd backend
```

#### 2. Install Dependencies

Run the following command to install the required dependencies:

```
npm install
```

#### 3. Configure Environment Variables

Create a .env file in the root directory based on the existing `.env.example` and define the required variables:

```
DATABASE_URL=your-mongodb-connection-string
JWT_SECRET_KEY=your-jwt-secret
```

Note: Replace the placeholder values with actual values.

#### 4. Test the Application Locally

Start the backend server to ensure it works as expected:

npm run start

Visit `http://localhost:PORT` in your browser or use an API client like Postman or Bruno to test endpoints.

### Steps for Deployment

#### Option 1: Deploy to Render

1. Create an account and log in to Render.
2. Click New Web Service and connect your GitHub repository.
3. Configure the service:

    - Environment: Node.js
    - Build Command: npm install
    - Start Command: npm run start

4. Add environment variables in the “Environment” section.
5. Deploy the application. Render will build and start your backend automatically.

### Common Issues and Solutions

#### Database Connection Errors:

-   Double-check the DATABASE_URL environment variable and ensure the database allows connections from the server.

#### CORS Errors:

-   Configure CORS in the server.js file.

By following these steps, you will have a fully deployed and functional backend for the Aftermath Archive application.

## 🔐 Authentication with Passport.js

This application uses Passport.js for handling authentication. The core configuration for Passport is located in `src/config/passport.js`, where strategies are defined. By default, the app is configured to support JWT authentication.

Passport makes it easy to integrate additional authentication strategies such as Google, GitHub, Facebook, Twitter, and more. You can add your own strategies by modifying the passport.js file and installing the relevant Passport strategy packages. For a full list of supported strategies and documentation, visit [the official Passport.js website.](https://www.passportjs.org/)

If you want to extend the app to support OAuth or Single Sign-On (SSO), Passport provides a flexible way to scale authentication without rewriting core logic.

## Future Enhancements

### 🔄 Implement JWT Refresh Tokens

To enhance the security and user experience, we plan to implement a refresh token strategy. This will allow:

-   **Short-lived Access Tokens** (e.g., 15 minutes) for improved security.
-   **Long-lived Refresh Tokens** (e.g., 7 days) to issue new access tokens without requiring the user to log in again.
-   **Token Rotation** to mitigate the risk of compromised refresh tokens.

This enhancement would involve:

1. Issuing refresh tokens during login.
2. Creating a `/refresh-token` endpoint to generate new access tokens.
3. Securely storing refresh tokens and invalidating them upon logout.

This feature is beyond the current project scope but would improve scalability and security for production use.
