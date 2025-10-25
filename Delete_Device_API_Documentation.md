# Delete Device API Documentation

This document describes the new Delete Device API endpoint for the Garden Guardian API.

## Overview

The Delete Device API allows authenticated users to remove device associations from their accounts. This endpoint removes the relationship between a user and a device in the `user_device` table, but does not delete the actual device from the system.

## API Endpoint

### Delete Device Association

**DELETE** `/users/deleteDevice/:device_id`

Removes a device association from the authenticated user's account.

**Parameters:**
- `device_id` (string, path parameter): The unique identifier for the device to remove

**Headers:**
- `Authorization`: Bearer token (required)

**Response:**
- **200 OK**: Device association deleted successfully
- **400 Bad Request**: Missing device ID or invalid token
- **401 Unauthorized**: No authentication token provided
- **404 Not Found**: Device not found or not associated with user account
- **500 Internal Server Error**: Server error

## Usage Examples

### Successful Device Deletion

**Request:**
```bash
DELETE /users/deleteDevice/DEVICE001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response:**
```json
{
  "message": "Device has been successfully removed from your account",
  "device_id": "DEVICE001"
}
```

### Error Responses

**Missing Device ID (400):**
```json
{
  "error": "Device ID is required"
}
```

**No Authentication (401):**
```json
{
  "error": "Authentication required"
}
```

**Invalid Token (400):**
```json
{
  "error": "Invalid token format"
}
```

**Device Not Found (404):**
```json
{
  "error": "Device not found or not associated with your account"
}
```

**Server Error (500):**
```json
{
  "error": "There was an error updating the database"
}
```

## Implementation Details

### Authentication
- Uses the `getUserInfoFromRequest` helper function from `utils/tokenHelper.js`
- Extracts user information from JWT token in Authorization header
- Validates token format and presence

### Security Features
- **User Isolation**: Only allows deletion of devices associated with the authenticated user
- **Ownership Verification**: Checks that the device belongs to the requesting user before deletion
- **Token Validation**: Validates JWT token format and presence

### Database Operations
1. **Verification Query**: Checks if device exists and belongs to user
   ```sql
   SELECT * FROM user_device WHERE user_id = ? AND device_id = ?
   ```

2. **Deletion Query**: Removes device association
   ```sql
   DELETE FROM user_device WHERE user_id = ? AND device_id = ?
   ```

### Error Handling
- Comprehensive validation of input parameters
- Proper HTTP status codes for different error scenarios
- Database transaction error handling
- Logging of operations and errors

## Frontend Integration

### JavaScript/Fetch Example
```javascript
const deleteDevice = async (deviceId, token) => {
  try {
    const response = await fetch(`/users/deleteDevice/${deviceId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Device deleted successfully:', data.message);
      return data;
    } else {
      console.error('Error deleting device:', data.error);
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Delete device failed:', error);
    throw error;
  }
};

// Usage
deleteDevice('DEVICE001', userToken)
  .then(result => {
    // Handle success
    updateDeviceList(); // Refresh device list
  })
  .catch(error => {
    // Handle error
    showErrorMessage(error.message);
  });
```

### React Example
```jsx
const DeviceManager = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleDeleteDevice = async (deviceId) => {
    setLoading(true);
    try {
      const response = await fetch(`/users/deleteDevice/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        // Remove device from local state
        setDevices(prevDevices => 
          prevDevices.filter(device => device.device_id !== deviceId)
        );
        alert('Device removed successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to delete device');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {devices.map(device => (
        <div key={device.device_id}>
          <span>{device.device_name}</span>
          <button 
            onClick={() => handleDeleteDevice(device.device_id)}
            disabled={loading}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};
```

## Testing

Comprehensive unit tests are included in `tests/controllers/deleteDevice.test.js`:

```bash
npm test -- tests/controllers/deleteDevice.test.js
```

Test coverage includes:
- Successful device deletion
- Authentication errors (missing/invalid tokens)
- Validation errors (missing device ID)
- Device not found scenarios
- Database error handling
- Edge cases (zero affected rows)

## Database Schema

The endpoint operates on the `user_device` table:

```sql
CREATE TABLE user_device (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,  -- User email
  device_id VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  user_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_device (user_id, device_id)
);
```

## Security Considerations

1. **Authorization**: Only authenticated users can delete devices
2. **Ownership**: Users can only delete their own device associations
3. **Validation**: All inputs are validated before processing
4. **Logging**: Operations are logged for audit trails
5. **Error Messages**: Generic error messages prevent information leakage

## Related Endpoints

- **POST** `/users/addDevice` - Add device to user account
- **GET** `/users/checkForDevice` - Check user's associated devices

## Notes

- This endpoint only removes the association between user and device
- The actual device record remains in the system for potential re-association
- Use this endpoint when users no longer want a device associated with their account
- Consider implementing soft deletes for audit trail purposes in production
