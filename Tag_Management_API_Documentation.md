# Tag Management API Documentation

This document describes the new Tag Management API endpoints for the Garden Guardian API.

## Overview

The Tag Management API allows you to manage QR code tags and their associated plant IDs. The system automatically creates the `tag_mappings` table if it doesn't exist.

## Database Table Structure

The `tag_mappings` table is automatically created with the following structure:

```sql
CREATE TABLE tag_mappings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tag_id VARCHAR(255) NOT NULL UNIQUE,
  plant_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tag_id (tag_id),
  INDEX idx_plant_id (plant_id)
);
```

## API Endpoints

### 1. Get Plant by Tag ID

**GET** `/tag/tags/:tagId`

Retrieves the plant ID associated with a specific tag.

**Parameters:**
- `tagId` (string, path parameter): The unique identifier for the tag

**Response:**
- **200 OK**: Returns the plant ID
- **404 Not Found**: Tag not found
- **500 Internal Server Error**: Server error

**Example:**
```bash
GET /tag/tags/QR001
```

**Success Response:**
```json
{
  "plantId": 33
}
```

**Error Response:**
```json
{
  "error": "Tag not found"
}
```

### 2. Add or Update Tag Mapping

**POST** `/tag/tags`

Creates a new tag mapping or updates an existing one.

**Request Body:**
```json
{
  "tagId": "QR001",
  "plantId": 33
}
```

**Response:**
- **200 OK**: Tag mapping added or updated successfully
- **400 Bad Request**: Missing required parameters
- **500 Internal Server Error**: Server error

**Success Response (New Tag):**
```json
{
  "message": "Tag mapping added successfully",
  "tagId": "QR001",
  "plantId": 33
}
```

**Success Response (Updated Tag):**
```json
{
  "message": "Tag mapping updated successfully",
  "tagId": "QR001",
  "plantId": 25
}
```

**Error Response:**
```json
{
  "error": "Both tagId and plantId are required"
}
```

### 3. Delete Tag Mapping

**DELETE** `/tag/tags/:tagId`

Removes a tag mapping from the database.

**Parameters:**
- `tagId` (string, path parameter): The unique identifier for the tag to delete

**Response:**
- **200 OK**: Tag mapping deleted successfully
- **404 Not Found**: Tag not found
- **500 Internal Server Error**: Server error

**Example:**
```bash
DELETE /tag/tags/QR001
```

**Success Response:**
```json
{
  "message": "Tag mapping deleted successfully",
  "tagId": "QR001"
}
```

**Error Response:**
```json
{
  "error": "Tag not found"
}
```

### 4. Get All Tag Mappings

**GET** `/tag/tags`

Retrieves all tag mappings from the database.

**Response:**
- **200 OK**: Returns array of all tag mappings
- **500 Internal Server Error**: Server error

**Example:**
```bash
GET /tag/tags
```

**Success Response:**
```json
[
  {
    "id": 1,
    "tag_id": "QR001",
    "plant_id": 33,
    "created_at": "2025-07-12T10:30:00.000Z",
    "updated_at": "2025-07-12T10:30:00.000Z"
  },
  {
    "id": 2,
    "tag_id": "QR002",
    "plant_id": 25,
    "created_at": "2025-07-12T11:15:00.000Z",
    "updated_at": "2025-07-12T11:15:00.000Z"
  }
]
```

## Error Handling

All endpoints include proper error handling and will return appropriate HTTP status codes with descriptive error messages.

Common error scenarios:
- Missing required parameters (400)
- Tag not found (404)
- Database connection errors (500)
- Server errors (500)

## Testing

Unit tests are included in `tests/controllers/tagController.test.js` to verify all functionality works correctly.

To run the tests:
```bash
npm test -- tests/controllers/tagController.test.js
```

## Usage Examples

### Adding a new tag mapping
```javascript
const response = await fetch('/tag/tags', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    tagId: 'QR001',
    plantId: 33
  })
});
```

### Getting plant info by tag
```javascript
const response = await fetch('/tag/tags/QR001');
const data = await response.json();
console.log('Plant ID:', data.plantId);
```

### Updating an existing tag
```javascript
const response = await fetch('/tag/tags', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    tagId: 'QR001',
    plantId: 25  // New plant ID
  })
});
```

### Deleting a tag mapping
```javascript
const response = await fetch('/tag/tags/QR001', {
  method: 'DELETE'
});
```
