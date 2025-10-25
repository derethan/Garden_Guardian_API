const { deleteDevice } = require('../../controllers/userController');
const dbQueryPromise = require('../../db/dbConnect');
const { getUserInfoFromRequest } = require('../../utils/tokenHelper');

// Mock dependencies
jest.mock('../../db/dbConnect');
jest.mock('../../utils/tokenHelper');

describe('deleteDevice', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { device_id: 'DEVICE001' },
      headers: {
        authorization: 'Bearer valid-token'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('successful device deletion', () => {
    it('should delete device successfully when device exists and belongs to user', async () => {
      // Mock user info
      const mockUserInfo = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User'
      };

      // Mock successful token validation
      getUserInfoFromRequest.mockReturnValue(mockUserInfo);

      // Mock device exists check
      const mockExistingDevice = [
        {
          user_id: 'test@example.com',
          device_id: 'DEVICE001',
          device_name: 'Test Device'
        }
      ];
      
      // Mock successful deletion
      const mockDeleteResult = { affectedRows: 1 };

      dbQueryPromise
        .mockResolvedValueOnce(mockExistingDevice) // Check if device exists
        .mockResolvedValueOnce(mockDeleteResult);   // Delete device

      await deleteDevice(req, res);

      expect(getUserInfoFromRequest).toHaveBeenCalledWith(req);
      expect(dbQueryPromise).toHaveBeenCalledTimes(2);
      
      // Check if device exists query
      expect(dbQueryPromise).toHaveBeenNthCalledWith(1,
        'SELECT * FROM user_device WHERE user_id = ? AND device_id = ?',
        ['test@example.com', 'DEVICE001']
      );
      
      // Delete device query
      expect(dbQueryPromise).toHaveBeenNthCalledWith(2,
        'DELETE FROM user_device WHERE user_id = ? AND device_id = ?',
        ['test@example.com', 'DEVICE001']
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Device has been successfully removed from your account',
        device_id: 'DEVICE001'
      });
    });
  });

  describe('authentication errors', () => {
    it('should return 401 when no token is provided', async () => {
      getUserInfoFromRequest.mockReturnValue(null);

      await deleteDevice(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required'
      });
      expect(dbQueryPromise).not.toHaveBeenCalled();
    });

    it('should return 400 when token is invalid', async () => {
      getUserInfoFromRequest.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await deleteDevice(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid token format'
      });
      expect(dbQueryPromise).not.toHaveBeenCalled();
    });
  });

  describe('validation errors', () => {
    it('should return 400 when device_id is missing', async () => {
      req.params = {}; // No device_id

      const mockUserInfo = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User'
      };
      getUserInfoFromRequest.mockReturnValue(mockUserInfo);

      await deleteDevice(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Device ID is required'
      });
      expect(dbQueryPromise).not.toHaveBeenCalled();
    });
  });

  describe('device not found errors', () => {
    it('should return 404 when device does not exist for user', async () => {
      const mockUserInfo = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User'
      };
      getUserInfoFromRequest.mockReturnValue(mockUserInfo);

      // Mock no device found
      dbQueryPromise.mockResolvedValueOnce([]);

      await deleteDevice(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Device not found or not associated with your account'
      });
      expect(dbQueryPromise).toHaveBeenCalledTimes(1);
    });
  });

  describe('database errors', () => {
    it('should return 500 when database check fails', async () => {
      const mockUserInfo = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User'
      };
      getUserInfoFromRequest.mockReturnValue(mockUserInfo);

      // Mock database error on check
      dbQueryPromise.mockRejectedValueOnce(new Error('Database connection error'));

      await deleteDevice(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'There was an error updating the database'
      });
    });

    it('should return 500 when delete operation fails', async () => {
      const mockUserInfo = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User'
      };
      getUserInfoFromRequest.mockReturnValue(mockUserInfo);

      // Mock device exists but delete fails
      const mockExistingDevice = [
        {
          user_id: 'test@example.com',
          device_id: 'DEVICE001',
          device_name: 'Test Device'
        }
      ];

      dbQueryPromise
        .mockResolvedValueOnce(mockExistingDevice) // Check succeeds
        .mockRejectedValueOnce(new Error('Delete failed')); // Delete fails

      await deleteDevice(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'There was an error updating the database'
      });
    });

    it('should return 500 when delete returns 0 affected rows', async () => {
      const mockUserInfo = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User'
      };
      getUserInfoFromRequest.mockReturnValue(mockUserInfo);

      // Mock device exists but no rows affected
      const mockExistingDevice = [
        {
          user_id: 'test@example.com',
          device_id: 'DEVICE001',
          device_name: 'Test Device'
        }
      ];
      
      const mockDeleteResult = { affectedRows: 0 };

      dbQueryPromise
        .mockResolvedValueOnce(mockExistingDevice)
        .mockResolvedValueOnce(mockDeleteResult);

      await deleteDevice(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to delete device association'
      });
    });
  });
});
