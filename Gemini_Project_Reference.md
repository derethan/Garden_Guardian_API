# Garden Guardian API: Project Reference

## 1. Project Overview

*   **Project Name:** Garden Guardian API
*   **Version:** 1.0.0
*   **Description:** This API serves as the backend for the Garden Guardian project, a comprehensive agricultural IoT platform. It manages communication between the frontend application, IoT devices (like Arduino), and the databases.
*   **Author:** Andrew Patterson
*   **License:** ISC

## 2. Core Technologies

*   **Backend:** Node.js, Express.js
*   **Databases:**
    *   **MySQL:** For user and device data.
    *   **InfluxDB:** For time-series sensor data.
*   **IoT Communication:** Handles data from C/C++ based embedded devices.
*   **AI Integration:** Utilizes OpenAI for potential gardening assistance and recommendations.

## 3. Project Structure

```
C:/Users/andg_/Documents/www/GG Labs/app/Garden_Guardian_API/
├───index.js                  # Main application entry point
├───LICENSE                   # Project license file
├───package.json              # NPM dependencies and scripts
├───Project_Reffeerence_File.md # Original project reference
├───README.md                 # Project README
├───controllers/              # Request handling logic
│   ├───aiController.js       # Handles AI-related logic
│   ├───dataController.js     # Manages sensor data operations
│   ├───rootaiController.js   # Root AI controller
│   ├───sensorController.js   # Controls sensor devices
│   ├───sensorDBFunctions.js  # Helper functions for sensor DB
│   └───userController.js     # Manages user accounts and auth
├───db/                       # Database connection setup
│   ├───dbConnect.js          # MySQL connection
│   └───influxConnect.js      # InfluxDB connection
├───routes/                   # API route definitions
│   ├───aiRoutes.js           # Routes for AI features
│   ├───dataRoutes.js         # Routes for sensor data
│   ├───rootaiRoutes.js       # Root AI routes
│   ├───sensorRoutes.js       # Routes for sensor devices
│   └───userRoutes.js         # Routes for user management
├───sslcert/                  # SSL certificate storage
└───tests/                    # Test files
    └───controllers/
        └───dataController.test.js
```

## 4. API Endpoints (Routes)

The `routes` directory defines the main API endpoints:

*   `/api/ai`: Routes handled by `aiRoutes.js` for AI-powered features.
*   `/api/data`: Routes handled by `dataRoutes.js` for data retrieval and management.
*   `/api/rootai`: Routes handled by `rootaiRoutes.js`.
*   `/api/sensor`: Routes handled by `sensorRoutes.js` for sensor-related actions.
*   `/api/user`: Routes handled by `userRoutes.js` for user authentication and management.

## 5. Dependencies

### Production Dependencies:
*   `@influxdata/influxdb-client`: v1.33.2
*   `axios`: v1.6.8
*   `crypto`: v1.0.1
*   `dotenv`: v16.3.1
*   `express`: v4.18.2
*   `express-session`: v1.18.1
*   `jsonwebtoken`: v9.0.2
*   `moment`: v2.30.1
*   `mysql2`: v3.6.2
*   `nodemon`: v3.0.1
*   `openai`: v4.47.1
*   `util`: v0.12.5

### Development Dependencies:
*   `jest`: v29.7.0

## 6. Scripts

*   `npm test`: Runs the test suite using Jest.
*   `npm run`: Starts the application using `node index.js`.
*   `npm start`: Starts the application with `nodemon` for automatic restarts during development.

## 7. Repository

*   **URL:** [https://github.com/derethan/Garden_Guardian_API](https://github.com/derethan/Garden_Guardian_API)
*   **Issues:** [https://github.com/derethan/Garden_Guardian_API/issues](https://github.com/derethan/Garden_Guardian_API/issues)
