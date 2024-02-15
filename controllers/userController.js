/***************************************
 *  User Controller
 * ************************************/

const jwt = require("jsonwebtoken");

const messages = {
  emailExists:
    "A user has already registered with this email address, Please enter another email address to continue.",
  noEmailExists: "No account is registered with this email address",
  registerSuccess: "User registered successfully",
  loginSuccess: "User logged in successfully",
  dbconnectError: "There was an error updating the database",
};

/***************************************
 *  MySQL Database Connection
 * ************************************/
const dbQueryPromise = require("../db/dbConnect"); // Import dbconnect.js

/***************************************
 *  Password Hashing and Verification
 * ************************************/
const crypto = require("crypto");

const hashPassword = (password) => {
  let salt = crypto.randomBytes(16).toString("hex");
  let iterations = 10000;
  let hash = crypto
    .pbkdf2Sync(password, salt, iterations, 64, "sha512")
    .toString("hex");

  return [salt, hash].join("$");
};

/***************************************
 *  Data Verification Functions
 * ************************************/
const verifyPassword = (password, storedPassword) => {
  const [salt, originalHash] = storedPassword.split("$"); // Split the stored password into salt and hash
  const iterations = 10000;
  const verifyHash = crypto
    .pbkdf2Sync(password, salt, iterations, 64, "sha512")
    .toString("hex");

  return originalHash === verifyHash; // If the hashes match, return true, else return false
};

// Check if email already exists
async function emailExists(email) {
  const sql = "SELECT * FROM users WHERE email = ?";
  const VALUES = [email];

  const result = await dbQueryPromise(sql, VALUES);

  return result.length > 0 ? true : false; // If the email exists, return true, else return false
}

async function getUser(email) {
  const sql = "SELECT * FROM users WHERE email = ?";
  const VALUES = [email];

  return dbQueryPromise(sql, VALUES);
}

async function updateTimestamp(email) {
  const sql = "UPDATE users SET last_login = NOW() WHERE email = ?";
  const VALUES = [email];

  return dbQueryPromise(sql, VALUES);
}

/***************************************
 *  User Registration Route
 **************************************/
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
    console.error(messages.dbconnectError, error);
    res.status(500).json({ message: "Registration failed" });
  }
}

/***************************************
 *  User Login Route
 **************************************/

async function login(req, res) {
  const { email, password } = req.body;

  // If the email does not exist, return an error
  const emailAlreadyExists = await emailExists(email);
  if (!emailAlreadyExists) {
    console.log(messages.noEmailExists);
    return res.status(409).json({ message: messages.noEmailExists });
  }

  try {
    // Get the user from the database
    const user = await getUser(email);
    const userName = user[0].firstname + " " + user[0].lastname;

    // Verify the password with the stored password
    const storedPassword = user[0].password;
    const passwordIsValid = verifyPassword(password, storedPassword);

    // If the password is invalid, return an error
    if (!passwordIsValid) {
      console.log("Invalid password");
      return res.status(401).json({ message: "Invalid password" });
    }

    // Update the last login timestamp
    try {
      await updateTimestamp(email);
    } catch (error) {
      console.error(messages.dbconnectError, error);
      res.status(500).json({ message: messages.dbconnectError });
    }

    // Generate a token placeholder
    const token = jwt.sign({ id: user[0].id }, process.env.TOKEN_SECRET, {
      expiresIn: "1h",
    });

    // Return the data to the client
    res.status(201).json({
      token: token,
      user: {
        id: user[0].id,
        name: userName,
        email: user[0].email,
      },
      message: messages.loginSuccess,
    });

    console.log(email, "Logged in successfully at: " + new Date());
  } catch (error) {
    console.error(messages.dbconnectError, error);
    res.status(500).json({ message: "Login failed" });
  }
}


/***************************************
 *  Protected Route handler
 **************************************/
async function protectedRoute(req, res) {



    res.json({ message: 'Protected route accessed successfully' });
}

function verifyToken (req, res, next) {
  const token = req.headers.authorization;

  // If the token is not provided, return an error
  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  // Verify the token
  jwt.verify(token, process.env.TOKEN_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.userId = decoded.id; // Add the user id to the request object
    next(); // Continue to the next middleware
  });
    
}
/***************************************
 *  Export the functions
 **************************************/
module.exports = {
  register,
  login,
  protectedRoute,
  verifyToken
};
