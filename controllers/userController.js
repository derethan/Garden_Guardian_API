
/***************************************
 *  MySQL Database Connection
 * ************************************/
const dbQueryPromise = require('../db/dbConnect'); // Import dbconnect.js


/***************************************
 *  Define functions below to handle the routed requests
 *
 *  Each function requires the corresponding route in the userRoutes.js file
 *      - router.post('/login', userController.login);
 *
 * ************************************/

// Handle Password Hashing:
const crypto = require('crypto');

const hashPassword = (password) => {
}


// Register a new user
async function register(req, res) {

  console.log(req.body);

  // Extract the request data
  const { username, email, password } = req.body;

  // Hash Password

  try {
      // Database operation here
      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Registration failed' });
    }
  }

  async function login(req, res) {
    // Implement user login logic, e.g., validate credentials.
    try {
      // Database operation here
      res.status(200).json({ message: 'User logged in successfully' });
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Login failed' });
    }
  }
  
  module.exports = {
    register,
    login
  };