
# 🌱 Plant QR Tagging System (Backend)

This project powers the backend logic for a dynamic QR tagging system used in plant monitoring, gardening, and greenhouse applications. It allows reusable physical QR tags to always point to the **correct, current plant**, even as the physical tag is reassigned over time.

## 🧭 Overview

Instead of printing a QR code that directly links to a static plant ID, each physical QR tag is encoded with a **stable tag ID**, such as:

```
https://gardenguardian.com/tags/tag-001
```

This tag ID is stored in a MySQL table and dynamically **mapped to a plant ID** in the system. When the QR code is scanned, the backend returns the current plant associated with that tag.

## 🔁 Key Features

- 🔗 **Reusable QR tags**: Tags are decoupled from plants and can be reassigned.
- 🔍 **Dynamic routing**: `/tags/:tagId` endpoint resolves the plant and redirects/display data.
- ⚙️ **Flexible backend**: Built using Node.js, Express, and MySQL.
- 🛠️ **Easily extendable**: Support for admin reassignment, history tracking, and auditing.

## 📂 Project Structure

| File / Folder     | Purpose                                     |
|-------------------|---------------------------------------------|
| `routes/tags.js`  | Express route for resolving tag → plant ID  |
| `db/index.js`     | MySQL connection pool or query wrapper      |
| `app.js`          | Main Express server setup                   |
| `tag_mappings.sql`| SQL for creating the database table         |

## 🧱 Database Schema

```sql
CREATE TABLE tag_mappings (
  tag_id VARCHAR(50) PRIMARY KEY,
  plant_id INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 📡 API Endpoints

### GET `/api/tags/:tagId`

Fetch the current plant ID assigned to a given tag.

**Example Request:**

```
GET /api/tags/tag-001
```

**Response:**

```json
{
  "plantId": 33
}
```

**Error Response (tag not found):**

```json
{
  "error": "Tag not found"
}
```

## 🛠️ Example Workflow

1. A QR code is printed for `tag-001`, pointing to:
   ```
   https://gardenguardian.com/tags/tag-001
   ```

2. `tag-001` is initially mapped to `plant_id = 33`.

3. When the QR is scanned:
   - The frontend hits `/api/tags/tag-001`
   - Receives `{ plantId: 33 }`
   - Redirects to `/gardens/plant/33`

4. Later, `tag-001` is reassigned to `plant_id = 72`.  
   ✅ Update the MySQL record — **no need to reprint QR**.

## 🧪 Setup & Test

1. Create the `tag_mappings` table using the SQL above.
2. Insert sample data:

```sql
INSERT INTO tag_mappings (tag_id, plant_id) VALUES ('tag-001', 33);
```

3. Start your Express server.
4. Hit the endpoint:
   ```
   curl http://localhost:3000/api/tags/tag-001
   ```

## 🔄 Future Enhancements

- `PUT /api/tags/:tagId` to reassign plant via API
- Tag usage history (audit trail)
- QR code generation endpoint

## 📘 License

MIT — use and modify freely.
