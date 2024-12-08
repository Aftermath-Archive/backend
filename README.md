# Aftermath Archive - backend

Welcome to the backend API for Aftermath Archive, an Incident Management web application.

This backend is hosted on Render and integrates with the frontend hosted on Netlify.

It utilizes a MongoDB database, managed through MongoDB Atlas, to store and retrieve application data.

-   Frontend URL: `aftermath-archive.xyz`
-   Backend URL: `api.aftermath-archive.xyz`

## API Documentation

API endpoint documentation is [available here.](https://api.aftermath-archive.xyz/api-docs/)

## 🔐 Authentication with Passport.js

This application uses Passport.js for handling authentication. The core configuration for Passport is located in `src/config/passport.js`, where strategies are defined. By default, the app is configured to support local authentication (username and password).

Passport makes it easy to integrate additional authentication strategies such as Google, GitHub, Facebook, Twitter, and more. You can add your own strategies by modifying the passport.js file and installing the relevant Passport strategy packages. For a full list of supported strategies and documentation, visit [the official Passport.js website.](https://www.passportjs.org/)

If you want to extend the app to support OAuth or Single Sign-On (SSO), Passport provides a flexible way to scale authentication without rewriting core logic.

// TODO

-   refactor checkIncidentPresence to middleware
