const { 
  decodeToken, 
  extractTokenFromHeader, 
  getUserInfoFromRequest, 
  isTokenExpired 
} = require('../../utils/tokenHelper');

describe('Token Helper Utilities', () => {
  // Mock JWT token payload for testing
  const mockPayload = {
    id: 123,
    name: 'John Doe',
    email: 'john@example.com',
    iat: Math.floor(Date.now() / 1000) - 3600, // Issued 1 hour ago
    exp: Math.floor(Date.now() / 1000) + 3600  // Expires in 1 hour
  };

  // Create a mock token (header.payload.signature format)
  const mockToken = [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', // Mock header
    Buffer.from(JSON.stringify(mockPayload)).toString('base64'), // Real payload
    'signature' // Mock signature
  ].join('.');

  describe('decodeToken', () => {
    it('should decode a valid token and return user info', () => {
      const result = decodeToken(mockToken);
      
      expect(result).toEqual({
        id: 123,
        name: 'John Doe',
        email: 'john@example.com',
        iat: mockPayload.iat,
        exp: mockPayload.exp
      });
    });

    it('should return null for empty token', () => {
      const result = decodeToken('');
      expect(result).toBeNull();
    });

    it('should return null for null token', () => {
      const result = decodeToken(null);
      expect(result).toBeNull();
    });

    it('should throw error for invalid token format', () => {
      expect(() => {
        decodeToken('invalid.token');
      }).toThrow('Invalid token format - token must have 3 parts');
    });

    it('should handle missing properties gracefully', () => {
      const incompletePayload = { id: 123 };
      const incompleteToken = [
        'header',
        Buffer.from(JSON.stringify(incompletePayload)).toString('base64'),
        'signature'
      ].join('.');

      const result = decodeToken(incompleteToken);
      expect(result).toEqual({
        id: 123,
        name: null,
        email: null,
        iat: null,
        exp: null
      });
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const req = {
        headers: {
          authorization: `Bearer ${mockToken}`
        }
      };

      const result = extractTokenFromHeader(req);
      expect(result).toBe(mockToken);
    });

    it('should return null for missing authorization header', () => {
      const req = { headers: {} };
      const result = extractTokenFromHeader(req);
      expect(result).toBeNull();
    });

    it('should return null for non-Bearer authorization header', () => {
      const req = {
        headers: {
          authorization: `Basic ${mockToken}`
        }
      };

      const result = extractTokenFromHeader(req);
      expect(result).toBeNull();
    });

    it('should return null for undefined req.headers', () => {
      const req = {};
      const result = extractTokenFromHeader(req);
      expect(result).toBeNull();
    });
  });

  describe('getUserInfoFromRequest', () => {
    it('should get user info from valid request', () => {
      const req = {
        headers: {
          authorization: `Bearer ${mockToken}`
        }
      };

      const result = getUserInfoFromRequest(req);
      expect(result).toEqual({
        id: 123,
        name: 'John Doe',
        email: 'john@example.com',
        iat: mockPayload.iat,
        exp: mockPayload.exp
      });
    });

    it('should return null for request without token', () => {
      const req = { headers: {} };
      const result = getUserInfoFromRequest(req);
      expect(result).toBeNull();
    });

    it('should throw error for invalid token', () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid.token'
        }
      };

      expect(() => {
        getUserInfoFromRequest(req);
      }).toThrow();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid unexpired token', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // Expires in 1 hour
      const userInfo = { exp: futureExp };
      
      const result = isTokenExpired(userInfo);
      expect(result).toBe(false);
    });

    it('should return true for expired token', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // Expired 1 hour ago
      const userInfo = { exp: pastExp };
      
      const result = isTokenExpired(userInfo);
      expect(result).toBe(true);
    });

    it('should return true for missing exp property', () => {
      const userInfo = { id: 123 };
      const result = isTokenExpired(userInfo);
      expect(result).toBe(true);
    });

    it('should return true for null userInfo', () => {
      const result = isTokenExpired(null);
      expect(result).toBe(true);
    });
  });
});
