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
const dbQueryPromise = require("../db/dbConnect");

/***************************************
 *  Password Hashing and Verification
 * ************************************/
const crypto = require("crypto");

// Hash the supplied password
const hashPassword = (password) => {
  let salt = crypto.randomBytes(16).toString("hex");
  let iterations = 10000;
  let hash = crypto
    .pbkdf2Sync(password, salt, iterations, 64, "sha512")
    .toString("hex");

  return [salt, hash].join("$");
};

// Function to Verify a Supplied Password with a Stored Password from the User database
const verifyPassword = (password, storedPassword) => {
  const [salt, originalHash] = storedPassword.split("$"); // Split the stored password into salt and hash
  const iterations = 10000;
  const verifyHash = crypto
    .pbkdf2Sync(password, salt, iterations, 64, "sha512")
    .toString("hex");

  return originalHash === verifyHash; // If the hashes match, return true, else return false
};

/***************************************
 *  User Verification Functions
 * ************************************/

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
 *  User Account Routes
 **************************************/

// Route for registering a new user
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

// Route for logging in a user
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

// Route for Changing the user password
async function changePassword(req, res) {
  const { password, newPassword } = req.body;
  const tokenHeader = req.headers.authorization;
  const token = tokenHeader.split(" ")[1];

  //Decode Token to get the user information
  const decoded = jwt.decode(token);
  const user_id = decoded.id;

  // Get the user from the database
  const user = await getUser(decoded.email);
  const storedPassword = user[0].password;

  // Verify the old password with the stored password
  const passwordIsValid = verifyPassword(password, storedPassword);
  if (!passwordIsValid) {
    return res.status(401).json({
      message: "Invalid Password, enter your current Password and try again.",
    });
  }

  // Hash the new password
  const newHashedPassword = hashPassword(newPassword);

  // Update the password in the database
  const sql = "UPDATE users SET password = ? WHERE id = ?";
  const VALUES = [newHashedPassword, user_id];

  try {
    await dbQueryPromise(sql, VALUES);
    console.log(
      "Password has been changed successfully for user: " +
        decoded.email +
        " at: " +
        new Date()
    );
    res.status(200).json({ message: "Password has been changed successfully" });
  } catch (error) {
    console.error(messages.dbconnectError, error);
    res.status(500).json({ message: messages.dbconnectError });
  }
}

/***************************************
 *  Device Routes - Account Based
 **************************************/

// Route for Adding a new device to the user account
async function addDevice(req, res) {
  //extract the headers
  const tokenHeader = req.headers.authorization;
  const token = tokenHeader.split(" ")[1];

  // extract the user email as user_id from the token
  const decoded = jwt.decode(token);
  const user_id = decoded.id;
  const user_email = decoded.email;

  // Extract the request data
  const { device_id, device_name } = req.body;

  //log
  console.log(
    "Device ID: " +
      device_id +
      " Device Name: " +
      device_name +
      " User ID: " +
      user_id +
      " User Email: " +
      user_email
  );

  // Check if the device exists in the database
  const deviceExists = await sensorController.checkdeviceID(device_id);
  console.log("Device Exists: " + deviceExists);

  // If the device does not exist, return an error
  if (!deviceExists) {
    return res.status(209).json({
      message: "No Device has been registered with the ID: " + device_id,
    });
  }

  // Associate the device with the user in the user_device table
  const sql =
    "INSERT INTO user_device (user_id, device_id, device_name, user_email) VALUES (?, ?, ?, ?)";
  const VALUES = [user_email, device_id, device_name, user_email];

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

// Route for checking if a user has a device associated with their account
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
        deviceIDs.push({
          device_id: device.device_id,
          device_name: device.device_name,
        });
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
 *  Garden Data Routes - Account Based
 **************************************/
// Garden CRUD Operations

//TODO: HANDLE Transactions for multiple queries
async function addGarden(req, res) {
  const userID = req.params.userID;

  const gardenData = {
    gardenName: req.body.gardenName,
    gardenLocation: req.body.gardenLocation,
    gardenType: req.body.gardenType,
    ownership: "owner",
    permissions: "modify",
  };

  // Add the garden to the Database
  try {
    const sql = "INSERT INTO gardens (name, location, type) VALUES (?, ?, ?)";
    const VALUES = [
      gardenData.gardenName,
      gardenData.gardenLocation,
      gardenData.gardenType,
    ];

    const result = await dbQueryPromise(sql, VALUES);
    console.log("Garden Added Successfully");

    const gardenID = result.insertId;

    // Associate the garden with the user in the user_garden table
    const sql2 =
      "INSERT INTO user_gardens (user_id, garden_id, ownership, user_permissions) VALUES (?, ?, ?, ?)";
    const VALUES2 = [
      userID,
      gardenID,
      gardenData.ownership,
      gardenData.permissions,
    ];

    await dbQueryPromise(sql2, VALUES2);
    console.log("Garden Associated with User Successfully");

    return res.status(201).json({ message: "Garden Added Successfully" });
  } catch (error) {
    console.error(messages.dbconnectError, error);
    return res.status(500).json({ message: messages.dbconnectError });
  }
}
//TODO: HANDLE Transactions for multiple queries
async function addGardenGroup(req, res) {
  const userID = req.params.userID;
  const formData = req.body.formData;

  const groupData = {
    groupName: formData.groupName,
    gardenID: formData.gardenID,
    type: formData.groupType || "soil",
    ownership: "owner",
    permissions: "modify",
  };

  console.log(groupData);

  try {
    // Add the group to the Database
    const SQL = "INSERT INTO garden_groups (name, type) VALUES (?, ?)";
    const VALUES = [groupData.groupName, groupData.type];
    const result = await dbQueryPromise(SQL, VALUES);
    const groupID = result.insertId;

    console.log("Group Added Successfully");

    // Associate the group with the garden in the garden_groups table
    const SQL2 = `INSERT INTO user_groups (group_id, garden_id, user_id, ownership, user_permissions) VALUES (?, ?, ?, ?, ?)`;
    const VALUES2 = [
      groupID,
      groupData.gardenID,
      userID,
      groupData.ownership,
      groupData.permissions,
    ];
    const result2 = await dbQueryPromise(SQL2, VALUES2);

    if (result && result2) {
      console.log("Group Associated with Garden Successfully");
      return res.status(201).json({ message: "Group Added Successfully" });
    }
  } catch (error) {
    console.error(messages.dbconnectError, error);
    return res.status(500).json({ message: messages.dbconnectError });
  }
}
async function addGardenPlant(req, res) {
  const userID = req.params.userID;
  const data = req.body;

  const defaultPlantName = data.variety_name
    ? data.variety_name
    : data.plant_name;

  const plantData = {
    plantID: data.plant_id,
    varietyID: data.variety_id,
    plantFriendlyName: data.plantFriendlyName || defaultPlantName,
    gardenID: data.gardenData.gardenID,
    groupID: data.gardenData.groupID,
    ownership: "owner",
    permissions: "modify",
  };

  console.log(plantData);

  try {
    // Add the plant to the Database
    const SQL =
      "INSERT INTO garden_plants (customName, plant_id, variety_id) VALUES (?,?,?)";
    const VALUES = [
      plantData.plantFriendlyName,
      plantData.plantID,
      plantData.varietyID,
    ];
    const result = await dbQueryPromise(SQL, VALUES);
    const gardenPlantID = result.insertId;

    console.log("Plant Added Successfully ", gardenPlantID);

    // // Associate the plant with the garden in the garden_plants table
    const SQL2 = `INSERT INTO user_plants (user_id, garden_id, group_id, gardenPlant_id, ownership, user_permissions) VALUES (?, ?, ?, ?, ?, ?)`;
    const VALUES2 = [
      userID,
      plantData.gardenID,
      plantData.groupID,
      gardenPlantID,
      plantData.ownership,
      plantData.permissions,
    ];
    const result2 = await dbQueryPromise(SQL2, VALUES2);

    console.log("Plant Associated with User Successfully");

    if (result && result2) {
      console.log("Plant Associated with Garden Successfully");
      return res.status(201).json({ message: "Plant Added Successfully" });
    }
  } catch (error) {
    console.error(messages.dbconnectError, error);
    return res.status(500).json({ message: messages.dbconnectError });
  }
}

async function getGardens(req, res) {
  const userID = req.params.userID;

  // Get the gardens associated with the user
  const sql = `
  SELECT gardens.*, user_gardens.ownership, user_gardens.user_permissions
  FROM gardens
  JOIN user_gardens ON gardens.id = user_gardens.garden_id
  WHERE user_gardens.user_id = ?
  `;
  const VALUES = [userID];

  try {
    const result = await dbQueryPromise(sql, VALUES);

    //Restructure the Data to send to the client
    const gardens = result.map((garden) => ({
      gardenName: garden.name,
      gardenLocation: garden.location,
      gardenType: garden.type,
      gardenID: garden.id,
      userID: userID,
      ownership: garden.ownership,
      permissions: garden.user_permissions,
    }));

    return res.status(200).json({ gardenData: gardens });
  } catch (error) {
    console.error(messages.dbconnectError, error);
    return res.status(500).json({ message: messages.dbconnectError });
  }
}
async function getGardenGroups(req, res) {
  const userID = req.params.userID;

  // Query the Database for all groups in the garden_groups table associated with the user
  const sql = `
  SELECT garden_groups.*, user_groups.ownership, user_groups.user_permissions, user_groups.garden_id
  FROM garden_groups
  JOIN user_groups ON garden_groups.id = user_groups.group_id 
  WHERE user_groups.user_id = ?
  `;
  const VALUES = [userID];

  try {
    const result = await dbQueryPromise(sql, VALUES);

    //Restructure the Data to send to the client
    const gardenGroups = result.map((group) => ({
      groupName: group.name,
      gardenID: group.garden_id,
      groupID: group.id,
      userID: userID,
      ownership: group.ownership,
      permissions: group.user_permissions,
    }));

    return res.status(200).json({ gardenGroups: gardenGroups });
  } catch (error) {
    console.error(messages.dbconnectError, error);
    return res.status(500).json({ message: messages.dbconnectError });
  }
}
async function deleteGarden(req, res) {
  const userID = req.params.userID;
  const gardenID = req.params.gardenID;

  // Delete the garden from the user_gardens table
  const sql = "DELETE FROM user_gardens WHERE user_id = ? AND garden_id = ?";
  const VALUES = [userID, gardenID];

  // Delete the garden from the gardens table
  const sql2 = "DELETE FROM gardens WHERE id = ?";
  const VALUES2 = [gardenID];

  try {
    await dbQueryPromise(sql, VALUES);
    console.log("Garden Removed from User Successfully");

    await dbQueryPromise(sql2, VALUES2);
    console.log("Garden Removed from Gardens Successfully");

    return res.status(200).json({ message: "Garden Deleted Successfully" });
  } catch (error) {
    console.error(messages.dbconnectError, error);
    return res.status(500).json({ message: messages.dbconnectError });
  }
}
async function deleteGardenGroup(req, res) {
  const userID = req.params.userID;
  const groupID = req.params.groupID;

  // Delete the group from the user_groups table
  const sql = "DELETE FROM user_groups WHERE user_id = ? AND group_id = ?";
  const VALUES = [userID, groupID];

  // Delete the group from the garden_groups table
  const sql2 = "DELETE FROM garden_groups WHERE id = ?";
  const VALUES2 = [groupID];

  try {
    await dbQueryPromise(sql, VALUES);
    console.log("Group Removed from User Successfully");

    await dbQueryPromise(sql2, VALUES2);
    console.log("Group Removed from Groups Successfully");

    return res.status(200).json({ message: "Group Deleted Successfully" });
  } catch (error) {
    console.error(messages.dbconnectError, error);
    return res.status(500).json({ message: messages.dbconnectError });
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
  let token = req.headers.authorization
    ? req.headers.authorization.split(" ")[1]
    : null;

  // If the token is not provided, return an error
  if (!token) {
    return res.status(403).json({ message: "Secure Route, No token provided" });
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
            expiresIn: "24h",
          }
        );
        token = newToken; // Update the token with the new token

        console.log(
          "Token Expired for user: " + tokenData.email + ", New Token Generated"
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

//Generate a function to create a permenant JWT Token for Testing
function generateDebugToken() {
  const token = jwt.sign(
    { id: 1, name: "Test User", email: "test@gardenguardian.app" },
    process.env.TOKEN_SECRET
  );

  console.log("Debug Token: " + token);

  return token;
}

/***************************************
 *  Export the functions
 **************************************/
module.exports = {
  register,
  login,
  changePassword,

  addDevice,
  checkForDevice,

  addGarden,
  getGardens,
  deleteGarden,

  addGardenGroup,
  getGardenGroups,
  deleteGardenGroup,

  addGardenPlant,

  protectedRoute,
  verifyToken,
};
