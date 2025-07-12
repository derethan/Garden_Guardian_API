
# 🌿 Plant QR Tagging System (Frontend - Vite + React)

This project is the frontend interface for the dynamic QR tagging system used in garden and greenhouse plant tracking. It works with a Node.js + MySQL backend to allow QR tags to point to any plant dynamically, enabling reusable physical tags.

---

## 🧭 Overview

When a QR code is scanned, the user lands on a stable tag URL like:

```
https://gardenguardian.com/tags/tag-001
```

This frontend app:

1. Reads the tag ID from the URL.
2. Calls the backend to get the current plant ID associated with that tag.
3. Redirects the user to the plant profile page:

```
/gardens/plant/:plantId
```

4. Displays live plant data.

---

## 🔁 Key Features

- 🔗 **Reusable QR tags** with dynamic mapping support.
- 🚦 **Tag resolution + redirection** built into React routes.
- 🌿 **Plant detail page** loads data for the specific plant ID.
- ⚙️ **Works with Vite + React Router** and a backend API.

---

## 🧩 Suggested Project Structure

```plaintext
src/
├── App.jsx
├── main.jsx
├── api/
│   └── tags.js          # API helper for tag → plant fetch
├── pages/
│   ├── PlantPage.jsx    # Displays plant data
│   └── TagRedirect.jsx  # Handles redirection logic
├── router/
│   └── index.jsx        # Route config
```

---

## 🔗 Route Definitions

```jsx
<Route path="/tags/:tagId" element={<TagRedirect />} />
<Route path="/gardens/plant/:plantId" element={<PlantPage />} />
```

---

## 🚦 TagRedirect Component

```jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function TagRedirect() {
  const { tagId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    fetch(`/api/tags/${tagId}`)
      .then(res => {
        if (!res.ok) throw new Error('Tag not found');
        return res.json();
      })
      .then(data => {
        navigate(`/gardens/plant/${data.plantId}`);
      })
      .catch(err => {
        setStatus('Tag not found or not mapped.');
      });
  }, [tagId, navigate]);

  return <p>{status}</p>;
}

export default TagRedirect;
```

---

## 🌿 PlantPage Component

This component will:

- Extract `plantId` from the route.
- Fetch data using `/api/plants/:plantId` or your data provider.
- Display plant details like name, status, notes, etc.

---

## 🧪 Test Workflow

1. QR tag links to `/tags/tag-001`.
2. Frontend requests `/api/tags/tag-001`.
3. Receives `{ "plantId": 33 }`.
4. Automatically redirects to `/gardens/plant/33`.
5. Displays plant info on `PlantPage.jsx`.

---

## 🛠️ Future Enhancements

- Admin UI for tag reassignment
- QR code scanning inside the browser/mobile app
- Search and filter plant list
- Authenticated access to editing or sensitive data

---

## 📘 License

MIT — use and modify freely.
