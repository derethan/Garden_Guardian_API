/***************************************
 *  User Controller
 * ************************************/

const jwt = require("jsonwebtoken");

const sensorController = require("./sensorController");

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

// Get user from the database
async function getUser(email) {
  const sql = "SELECT * FROM users WHERE email = ?";
  const VALUES = [email];

  return dbQueryPromise(sql, VALUES);
}

// Update the last login timestamp
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
      console.log("Invalid Credientials, please try again.");
      return res
        .status(401)
        .json({ message: "Invalid Credientials, please try again." });
    }

    // Update the last login timestamp
    try {
      await updateTimestamp(email);
    } catch (error) {
      console.error(messages.dbconnectError, error);
      res.status(500).json({ message: messages.dbconnectError });
    }

    // Generate a token
    const token = jwt.sign(
      { id: user[0].id, name: userName, email: user[0].email },
      process.env.TOKEN_SECRET,
      {
        expiresIn: "1h",
      }
    );

    // Return the data to the client
    res
      .header("Authorization", "Bearer " + token)
      .status(201)
      .json({
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
  //Handle protected route functions here, decode token and determine authorization based on token data

  //Send the New Token to the client
  return res
    .header("Authorization", "Bearer " + req.token)
    .status(201)
    .json({ message: "Protected route accessed successfully" });
}

/***************************************
 * Token Verification Route Middleware
 * ************************************/
function verifyToken(req, res, next) {
  // Get the token from the request headers
  const tokenHeader = req.headers.authorization;

  let token = tokenHeader.split(" ")[1];

  // If the token is not provided, return an error
  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  // Verify the token
  jwt.verify(token, process.env.TOKEN_SECRET, (error, decoded) => {
    const tokenData = jwt.decode(token);

    if (error) {
      //If the token has expired
      if (error instanceof jwt.TokenExpiredError) {
        //Check when the Token expired
        const expiredTime = error.expiredAt.getTime() / 1000;
        const currentTime = Math.floor(Date.now() / 1000);

        //If the token has been expired for more then 7 days, return an error
        if (currentTime - expiredTime > 604800) {
          return res
            .status(401)
            .json({ message: "Your session has ended, Please Log in again" });
        }

        // Otherwise Generate a new token and return it to the client
        const newToken = jwt.sign(
          { id: tokenData.id, name: tokenData.name, email: tokenData.email },
          process.env.TOKEN_SECRET,
          {
            expiresIn: "1h",
          }
        );
        token = newToken; // Update the token with the new token

        console.log(
          "Token Expired for user" + tokenData.email + " New Token Generated"
        );
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }
    } // End of if (error)

    req.userId = tokenData.id; // Add the user id to the request object
    req.userName = tokenData.name; // Add the user name to the request object
    req.userEmail = tokenData.email; // Add the user email to the request object
    req.token = token; // Add the token to the request object

    next(); // Continue to the next middleware
  }); // End of jwt.verify
} // End of verifyToken

/***************************************
 *  Device Routes
 **************************************/

// Route for Adding a new device
async function addDevice(req, res) {
  //extract the headers
  const tokenHeader = req.headers.authorization;
  const token = tokenHeader.split(" ")[1];

  // extract the user email as user_id from the token
  const decoded = jwt.decode(token);
  const user_id = decoded.email;
  const db_ID = decoded.id;

  // Extract the request data
  const { device_id, device_name } = req.body;

  //log
  console.log(
    "Device ID: " +
      device_id +
      " Device Name: " +
      device_name +
      " User ID: " +
      user_id
  );

  // Check if the device exists in the database
  const deviceExists = await sensorController.checkdeviceID(device_id);
  console.log("Device Exists: " + deviceExists);

  // If the device does not exist, return an error
  if (!deviceExists) {
    return res.status(409).json({
      message: "No Device has been registered with the ID: " + device_id,
    });
  }

  // Associate the device with the user in the user_device table
  const sql = "INSERT INTO user_device (user_id, device_id) VALUES (?, ?)";
  const VALUES = [user_id, device_id];

  try {
    await dbQueryPromise(sql, VALUES);
    res
      .status(201)
      .json({ message: "Device has been registered successfully" });
  } catch (error) {
    console.error(messages.dbconnectError, error);
    res.status(500).json({ message: messages.dbconnectError });
  }
}

/***************************************
 *  Check if the user has a device associated
 * with their account in the user_device table
 * ************************************/

async function checkForDevice(req, res) {
  //extract the headers
  const tokenHeader = req.headers.authorization;
  const token = tokenHeader.split(" ")[1];

  // extract the user email as user_id from the token
  const decoded = jwt.decode(token);
  const user_id = decoded.email;
  const db_ID = decoded.id;

  // Check if the user has a device associated with their account
  const sql = "SELECT * FROM user_device WHERE user_id = ?";
  const VALUES = [user_id];

  try {
    const result = await dbQueryPromise(sql, VALUES);
    
    if (result.length > 0) {

      // Store the Device ID's associated with the account
      const deviceIDs = [];
      result.forEach((device) => {
        deviceIDs.push(device.device_id);
      });

      // console.log (deviceIDs); // - To log Device ID from frontend user check


      return res.status(200).json({
        message: "User has a device associated with their account",
        status: true,
        device_id: deviceIDs,
      });
    } else {
      return res.status(200).json({
        message: "User does not have a device associated with their account",
        status: false,
      });
    }
  } catch (error) {
    console.error(messages.dbconnectError, error);
    return res.status(500).json({ message: messages.dbconnectError });
  }
}

/***************************************
 *  Export the functions
 **************************************/
module.exports = {
  register,
  login,
  protectedRoute,
  verifyToken,
  addDevice,
  checkForDevice,
};
