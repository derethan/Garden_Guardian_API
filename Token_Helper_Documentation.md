# Token Helper Utility Documentation

This utility provides functions for handling JWT token operations in the Garden Guardian API.

## Overview

The `tokenHelper.js` utility extracts and simplifies JWT token handling throughout the application. It provides safe token decoding, header extraction, and validation functions.

## Functions

### `decodeToken(token)`

Decodes a JWT token and extracts user information.

**Parameters:**
- `token` (string): The JWT token to decode (without 'Bearer ' prefix)

**Returns:**
- `Object`: User information object with properties:
  - `id`: User ID
  - `name`: User name
  - `email`: User email
  - `iat`: Issued at time (timestamp)
  - `exp`: Expiration time (timestamp)
- `null`: If token is empty/null

**Throws:**
- `Error`: If token format is invalid

**Example:**
```javascript
const { decodeToken } = require('../utils/tokenHelper');

try {
  const userInfo = decodeToken(token);
  console.log('User ID:', userInfo.id);
  console.log('Email:', userInfo.email);
} catch (error) {
  console.error('Invalid token:', error.message);
}
```

### `extractTokenFromHeader(req)`

Extracts the JWT token from the Authorization header.

**Parameters:**
- `req` (Object): Express request object

**Returns:**
- `string`: The token without 'Bearer ' prefix
- `null`: If no valid Bearer token is found

**Example:**
```javascript
const { extractTokenFromHeader } = require('../utils/tokenHelper');

const token = extractTokenFromHeader(req);
if (token) {
  console.log('Token found:', token);
}
```

### `getUserInfoFromRequest(req)`

Gets user information directly from the request's authorization header.

**Parameters:**
- `req` (Object): Express request object

**Returns:**
- `Object`: User information object (same as `decodeToken`)
- `null`: If no valid token is found

**Throws:**
- `Error`: If token format is invalid

**Example:**
```javascript
const { getUserInfoFromRequest } = require('../utils/tokenHelper');

try {
  const userInfo = getUserInfoFromRequest(req);
  if (userInfo) {
    console.log('Authenticated user:', userInfo.email);
  } else {
    console.log('No token provided');
  }
} catch (error) {
  console.error('Invalid token:', error.message);
}
```

### `isTokenExpired(userInfo)`

Checks if a token is expired based on the `exp` field.

**Parameters:**
- `userInfo` (Object): User info object from `decodeToken`

**Returns:**
- `boolean`: `true` if token is expired or invalid, `false` if still valid

**Example:**
```javascript
const { getUserInfoFromRequest, isTokenExpired } = require('../utils/tokenHelper');

try {
  const userInfo = getUserInfoFromRequest(req);
  if (userInfo && !isTokenExpired(userInfo)) {
    console.log('Token is valid');
  } else {
    console.log('Token is expired or invalid');
  }
} catch (error) {
  console.error('Token error:', error.message);
}
```

## Usage in Controllers

Here's how to use the token helper in your controllers:

```javascript
const { getUserInfoFromRequest } = require('../utils/tokenHelper');

const myController = async (req, res) => {
  // Get user info from token if present
  let userInfo = null;
  try {
    userInfo = getUserInfoFromRequest(req);
    if (userInfo) {
      console.log(`User ID: ${userInfo.id}`);
      console.log(`User email: ${userInfo.email}`);
      // Use userInfo for authorization, logging, etc.
    }
  } catch (error) {
    console.error("Error decoding token:", error);
    return res.status(400).json({ error: "Invalid token format" });
  }

  // Continue with your controller logic...
};
```

## Error Handling

The utility includes comprehensive error handling:

- **Invalid token format**: Throws descriptive error messages
- **Missing properties**: Returns `null` for missing token properties
- **Expired tokens**: Use `isTokenExpired()` to check validity
- **Missing headers**: Safely handles requests without authorization headers

## Testing

Comprehensive unit tests are included in `tests/utils/tokenHelper.test.js`:

```bash
npm test -- tests/utils/tokenHelper.test.js
```

## Security Notes

- The utility only decodes tokens, it does not verify signatures
- Always validate token expiration using `isTokenExpired()`
- Consider implementing proper JWT verification for production use
- The utility gracefully handles malformed requests without crashing

## Migration from Inline Code

If you're migrating from inline token decoding:

**Before:**
```javascript
const token = req.headers.authorization?.split(" ")[1];
let userId = null;

if (token) {
  try {
    const decoded = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    userId = decoded.id;
  } catch (error) {
    return res.status(400).json({ error: "Invalid token format" });
  }
}
```

**After:**
```javascript
const { getUserInfoFromRequest } = require('../utils/tokenHelper');

let userInfo = null;
try {
  userInfo = getUserInfoFromRequest(req);
  if (userInfo) {
    const userId = userInfo.id;
    // Access other properties: userInfo.email, userInfo.name, etc.
  }
} catch (error) {
  return res.status(400).json({ error: "Invalid token format" });
}
```
