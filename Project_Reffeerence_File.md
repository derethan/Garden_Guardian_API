# Project Reference File

## Project Overview

**Name**: Garden Guardian API  
**Version**: 1.0.0  
**Description**: This API handles communication between Arduino hardware and the server, as well as facilitating interactions between the main frontend application and the server. It is designed to support IoT device interactions, providing endpoints for data exchange and control.

## Directory Structure

- **index.js**: The main entry point of the application.
- **LICENSE**: Contains the licensing information for the project.
- **package.json**: Lists the project's dependencies and scripts.
- **README.md**: Provides an overview and instructions for the project.
- **controllers/**: Contains various controllers for handling different aspects of the API.
  - `aiController.js`
  - `dataController.js`
  - `rootaiController.js`
  - `sensorController.js`
  - `sensorDBFunctions.js`
  - `userController.js`
- **db/**: Contains database connection files.
  - `dbConnect.js`
  - `influxConnect.js`
- **routes/**: Defines the API routes.
  - `aiRoutes.js`
  - `dataRoutes.js`
  - `rootaiRoutes.js`
  - `sensorRoutes.js`
  - `userRoutes.js`
- **tests/**: Contains test files for the application.
  - `controllers/dataController.test.js`

## Key Files and Their Roles

- **index.js**: The main file that starts the application.
- **controllers/**: Houses the logic for handling requests and responses.
- **db/**: Manages database connections and interactions.
- **routes/**: Maps HTTP requests to the appropriate controller functions.

## Dependencies

The project relies on several key dependencies:

- **@influxdata/influxdb-client**: For interacting with InfluxDB.
- **axios**: For making HTTP requests.
- **crypto**: For cryptographic functions.
- **dotenv**: For loading environment variables.
- **express**: A web framework for building the API.
- **jsonwebtoken**: For handling JSON Web Tokens.
- **moment**: For date and time manipulation.
- **mysql2**: For MySQL database interactions.
- **nodemon**: For automatically restarting the server during development.
- **openai**: For integrating with OpenAI's API.
- **util**: For utility functions.

## Usage Instructions

To run the application, use the following scripts:

- **Start the application**: `npm start` (uses nodemon for development)
- **Run the application**: `npm run` (uses node directly)
- **Test the application**: `npm test` (runs tests using Jest)

## Repository Information

- **Repository URL**: [GitHub Repository](https://github.com/derethan/Garden_Guardian_API)
- **Issues**: [Report Issues](https://github.com/derethan/Garden_Guardian_API/issues)
- **Homepage**: [Project Homepage](https://github.com/derethan/Garden_Guardian_API#readme)
