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


## Docker Compose Deployment Repo:
https://github.com/Aftermath-Archive/docker-deployment
## API Documentation

API endpoint documentation is [available here.](https://api.aftermath-archive.xyz/api-docs/)

For a local server, open `http://localhost:8080/api-docs/` (or use your configured `PORT`).

### Post-mortem API

The `feature/postmortem-api` branch provides creation, listing/search, retrieval,
partial updates, and deletion at `/post-mortems`. Reads are public; writes require
the existing JWT bearer token. Each incident can have one post-mortem.

See the [post-mortem frontend integration guide](docs/post-mortems.md) for payloads,
response shapes, filtering, validation, lifecycle rules, and the required unique
index for existing databases. The current frontend has no post-mortem screens or
API client; this guide defines the contract for implementing them.

## Coder Academy 

For students, or teachers who are viewing this repo in the context of the Coder Academy final assignment I have created a separate branch 'project-submission' [available here.](https://github.com/Aftermath-Archive/backend/tree/project-submission)

This branch captures the projects state at time of submission while future work is undergone on the project. 

## Deployment Guide

This guide outlines the steps to deploy the backend of the Aftermath Archive application to a production environment. The backend is built using Node.js and Express, and it can be deployed to a cloud hosting provider such as AWS, Heroku, Render, or DigitalOcean.

### Prerequisites

1. Node.js: Ensure you have Node.js 26.x (use `nvm install` and `nvm use` with the included `.nvmrc`) installed.
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

For development, run `npm run dev`. This uses Node's built-in watch mode to
restart the server when imported application files change.

Use `npm ci` for installs and `npm run lint` plus
`npm test -- --runInBand --coverage=false` for validation. Husky uses
`.husky/pre-commit` for staged lint and `.husky/pre-push` for tests. Production
and CI installs skip hook initialization; application/native install scripts
still run. PR CI also builds the production image and checks its non-root
runtime, secret exclusions and native bcrypt.

The Docker image runs as the `node` user. Supply private configuration at runtime
using environment variables or your deployment's secret mechanism; local `.env`,
Git metadata and private key files are excluded from the build context.

### Demo reset workflow

Automatic daily resets are disabled. The manual workflow only accepts confirmed
runs from `main`, uses the GitHub `demo` environment, and serializes resets.
Before using it, configure an environment secret `DEMO_DATABASE_URL` and variable
`DEMO_DATABASE_NAME`. The name must end in `_demo` (for example,
`aftermath_demo`) and exactly match the URL's database path. Use a dedicated
demo database and credentials limited to it. The workflow no longer uses the
general `DATABASE_URL` repository secret, and fails before dropping data when
the target check fails. Existing connection/seed failure reporting still needs
the separate backend reliability work.

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

#### Option 2: Docker
##### Prerequisites
1. Confirm Docker Installed
    Download available for [Docker for Mac, Windows, and Linux.](https://docs.docker.com/get-started/get-docker/) 

2. Cloud Hosting (Optional)

    If deploying to a cloud service, ensure you have an instance/server on platforms such as: 
    - AWS EC2
    - Azure Virtual Machine 
    - Google Cloud Platform Compute Engine 
    - Digital Ocean
    - Render 
    - Railway 
    - etc 

##### Deploy with Docker Image
1. Build the Docker Image

    Run the` following command in the root of the backend project:
    ```
    docker build -t aftermath-archive-backend .
    ````

2. Run the container locally

    To test the container on your local machine, run:
    ```
    docker run --env-file .env -p 4000:4000 aftermath-archive-backend
    ```
    - `--env-file .env`: Loads the environment variables from .env.
    - `-p 4000:4000`: Maps port 4000 of the container to 4000 on your local machine.

#### Option 3: Docker Compose
For easier setup, a `docker-compose.yml` file for both front and backend is [available here.](https://github.com/Aftermath-Archive/docker-deployment)

### Common Issues and Solutions

#### Database Connection Errors:

-   Double-check the `DATABASE_URL` environment variable and ensure the database allows connections from the server.

#### CORS Errors:

-   Configure CORS in the server.js file.

By following these steps, you will have a fully deployed and functional backend for the Aftermath Archive application.

## 🔐 Authentication with Passport.js

Login returns `{ message, token }`. Access tokens use HS256, contain the user's
MongoDB ID in the `id` claim, and expire after 24 hours. Send
`Authorization: Bearer <token>` on protected requests. Both the JWT middleware
and Passport require a valid signature, expiry, user ID, and an active account.
Discussion authors are taken from the authenticated account. Logout still
requires the client to discard its token; server-side token revocation is not
implemented.

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
