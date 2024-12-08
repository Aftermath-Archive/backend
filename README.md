# Aftermath Archive - backend

Welcome to the backend API for Aftermath Archive, an Incident Management web application.

This backend is hosted on Render and integrates with the frontend hosted on Netlify.

It utilizes a MongoDB database, managed through MongoDB Atlas, to store and retrieve application data.

-   Frontend URL: `aftermath-archive.xyz`
-   Backend URL: `api.aftermath-archive.xyz`

## API Documentation

API endpoint documentation is [available here.](https://api.aftermath-archive.xyz/api-docs/)

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

// TODO

-   refactor checkIncidentPresence to middleware
