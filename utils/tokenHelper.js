/**
 * Token Helper Utilities
 * Functions for handling JWT token operations
 */

/**
 * Decodes a JWT token and extracts user information
 * @param {string} token - The JWT token to decode (without 'Bearer ' prefix)
 * @returns {Object|null} - Object containing user info or null if invalid
 * @throws {Error} - Throws error if token format is invalid
 */
const decodeToken = (token) => {
  if (!token) {
    return null;
  }

  try {
    // Split the token into parts (header.payload.signature)
    const tokenParts = token.split(".");
    
    if (tokenParts.length !== 3) {
      throw new Error("Invalid token format - token must have 3 parts");
    }

    // Decode the payload (second part)
    const payload = JSON.parse(Buffer.from(tokenParts[1], "base64").toString());

    // Extract the required properties
    const userInfo = {
      id: payload.id || null,
      name: payload.name || null,
      email: payload.email || null,
      iat: payload.iat || null, // Issued at time
      exp: payload.exp || null  // Expiration time
    };

    return userInfo;
  } catch (error) {
    throw new Error(`Failed to decode token: ${error.message}`);
  }
};

/**
 * Extracts token from Authorization header
 * @param {Object} req - Express request object
 * @returns {string|null} - The token without 'Bearer ' prefix or null if not found
 */
const extractTokenFromHeader = (req) => {
  const authHeader = req.headers?.authorization;
  
  if (!authHeader) {
    return null;
  }

  // Check if it starts with 'Bearer '
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  return null;
};

/**
 * Gets user info from request authorization header
 * @param {Object} req - Express request object
 * @returns {Object|null} - User info object or null if no valid token
 * @throws {Error} - Throws error if token format is invalid
 */
const getUserInfoFromRequest = (req) => {
  const token = extractTokenFromHeader(req);
  
  if (!token) {
    return null;
  }

  return decodeToken(token);
};

/**
 * Checks if a token is expired
 * @param {Object} userInfo - User info object from decodeToken
 * @returns {boolean} - True if token is expired, false otherwise
 */
const isTokenExpired = (userInfo) => {
  if (!userInfo || !userInfo.exp) {
    return true;
  }

  const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
  return userInfo.exp < currentTime;
};

module.exports = {
  decodeToken,
  extractTokenFromHeader,
  getUserInfoFromRequest,
  isTokenExpired
};
