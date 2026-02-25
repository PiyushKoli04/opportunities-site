# ⚡ Syntax Syndicate — Setup Guide

## Project Structure
```
syntax-syndicate/
├── index.html          ← Landing page (public)
├── login.html          ← Login page
├── signup.html         ← Signup page
├── admin.html          ← Admin dashboard (admin only)
├── apply.html          ← Post detail / apply page
├── firestore.rules     ← Firebase security rules
├── css/
│   └── style.css       ← All styles
└── js/
    ├── firebase.js     ← Firebase config & init
    ├── auth.js         ← Auth helpers, toast, utils
    ├── explore.js      ← Explore page logic
    └── admin.js        ← Admin panel logic
```

---

## 🚀 Setup Steps

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Add project** → Give it a name
3. Enable **Google Analytics** (optional)

### 2. Enable Authentication
1. Firebase Console → **Authentication** → **Get Started**
2. **Sign-in method** → Enable **Email/Password**

### 3. Create Firestore Database
1. Firebase Console → **Firestore Database** → **Create Database**
2. Start in **Production mode** (rules will be set next)
3. Choose your region

### 4. Set Security Rules
1. Firebase Console → Firestore → **Rules** tab
2. Paste the contents of `firestore.rules` and click **Publish**

### 5. Get Firebase Config
1. Firebase Console → **Project Settings** (gear icon)
2. Scroll to **Your apps** → **Web** → Register app
3. Copy the `firebaseConfig` object

### 6. Update firebase.js
Open `js/firebase.js` and replace the config:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### 7. Create First Admin User
1. Deploy the site (see below)
2. Go to `/signup.html` → Create an account
3. In Firebase Console → **Firestore** → `users` collection
4. Find the document with your UID
5. Change `role: "user"` to `role: "admin"`
6. Save → Now you can access `/admin.html`

---

## 📦 Deployment Options

### Option A: Firebase Hosting (Recommended)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Set public directory to . (current folder)
# Configure as single-page app: No
firebase deploy
```

### Option B: Netlify / Vercel
- Drag and drop the project folder to Netlify
- Or push to GitHub and connect to Vercel

### Option C: GitHub Pages
- Push to GitHub
- Settings → Pages → Deploy from main branch

---

## 📁 Firestore Collections Structure

### `users`
```json
{
  "uid": "firebase-user-uid",
  "email": "user@example.com",
  "role": "user | admin",
  "createdAt": "timestamp"
}
```

### `jobs` / `internships`
```json
{
  "title": "Senior Developer",
  "company": "Acme Corp",
  "location": "Bangalore",
  "experienceLevel": "Senior",
  "description": "...",
  "requirements": "...",
  "benefits": "...",
  "imagePath": "https://...",
  "applyLink": "https://...",
  "duration": "3 months",  // internships only
  "postedAt": "timestamp",
  "createdBy": "admin-uid"
}
```

### `hackathons`
```json
{
  "title": "HackIndia 2025",
  "organizer": "MLH",
  "mode": "Online | Offline | Hybrid",
  "prizePool": "$10,000",
  "deadline": "2025-12-31",
  "description": "...",
  "imagePath": "https://...",
  "applyLink": "https://...",
  "postedAt": "timestamp",
  "createdBy": "admin-uid"
}
```

### `techEvents` / `seminars`
```json
{
  "title": "Google I/O Extended",
  "speaker": "John Doe",
  "venue": "JW Marriott, Mumbai",
  "eventDate": "2025-12-15",
  "description": "...",
  "imagePath": "https://...",
  "applyLink": "https://...",
  "postedAt": "timestamp",
  "createdBy": "admin-uid"
}
```

### `ads`
```json
{
  "title": "Learn React — 50% off",
  "imagePath": "https://...",
  "redirectLink": "https://sponsor.com",
  "placement": "top | betweenCards",
  "createdAt": "timestamp"
}
```

---

## 🔑 Role System
- **Users**: Read all content, view details, click apply links
- **Admins**: Full CRUD on all collections via admin panel
- Role is stored in `users/{uid}.role` in Firestore
- Firestore rules verify admin role server-side

## 💡 Notes
- Images are entered as paths/URLs (no upload feature — by design)
- The site uses ES Modules — must be served over HTTP (not file://)
- Use a local server for development: `npx serve .` or VS Code Live Server
- Firebase free tier (Spark) is sufficient for small/medium traffic
