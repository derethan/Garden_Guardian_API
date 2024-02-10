/***************************************
 *  MySQL Database Connection
 * ************************************/
const dbQueryPromise = require("../db/dbConnect"); // Import dbconnect.js

/***************************************
 *  Define functions below to handle the routed requests
 *
 *  Each function requires the corresponding route in the userRoutes.js file
 *      - router.post('/login', userController.login);
 *
 * ************************************/

// Handle Password Hashing:
const crypto = require("crypto");

const hashPassword = (password) => {
  let salt = crypto.randomBytes(16).toString("hex");
  let iterations = 10000;
  let hash = crypto
    .pbkdf2Sync(password, salt, iterations, 64, "sha512")
    .toString("hex");

  return [salt, hash].join("$");
};

const verifyPassword = (password, storedPassword) => {
  const [salt, originalHash] = storedPassword.split("$");
  const iterations = 10000;
  const verifyHash = crypto
    .pbkdf2Sync(password, salt, iterations, 64, "sha512")
    .toString("hex");

  return originalHash === verifyHash;
};

// Register a new user
async function register(req, res) {
  // Extract the request data
  const { firstName, lastName, email, password } = req.body;

  // Hash Password
  const hashedPassword = hashPassword(password);

  try {
    // Submit the data to the database
    const sql =
      "INSERT INTO users (firstname, lastname, email, password) VALUES (?, ?, ?, ?)";
    const VALUES = [firstName, lastName, email, hashedPassword];

    await dbQueryPromise(sql, VALUES);

    res.status(201).json({ message: "User registered successfully" });
    console.log("User registered successfully");
  } catch (error) {
    console.error("There was an error updating the database", error);
    res.status(500).json({ message: "Registration failed" });
  }
}

// User login route
async function login(req, res) {
  // Implement user login logic, e.g., validate credentials.
  try {
    // Database operation here
    res.status(200).json({ message: "User logged in successfully" });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Login failed" });
  }
}

module.exports = {
  register,
  login,
};
