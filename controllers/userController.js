/***************************************
 *  MySQL Database Connection
 * ************************************/
const dbQueryPromise = require("../db/dbConnect"); // Import dbconnect.js

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

// Check if email already exists
async function emailExists(email) {
  const sql = "SELECT * FROM users WHERE email = ?";
  const VALUES = [email];

  const result = await dbQueryPromise(sql, VALUES);

  return result.length > 0 ? true : false; // If the email exists, return true
}

const messages = {
  emailExists:
    "A user has already registered with this email address, Please enter another email address to continue.",
  registerSuccess: "User registered successfully",
  dbconnectError: "There was an error updating the database",  
};

// Register a new user
async function register(req, res) {
  // Extract the request data
  const { firstName, lastName, email, password } = req.body;

  // Hash Password
  const hashedPassword = hashPassword(password);

  // Check if the email already exists
  const emailAlreadyExists = await emailExists(email);

  if (emailAlreadyExists) {
    return res.status(409).json({ message: messages.emailExists });
  }

  // Attempt to register the user in the database
  try {
    const sql =
      "INSERT INTO users (firstname, lastname, email, password) VALUES (?, ?, ?, ?)";
    const VALUES = [firstName, lastName, email, hashedPassword];

    await dbQueryPromise(sql, VALUES);

    res.status(201).json({ message: messages.registerSuccess });
    console.log("User registered successfully");

  } catch (error) {
    console.error(dbconnectError, error);
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
