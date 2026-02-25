// ===========================
// FIREBASE CONFIGURATION
// js/firebase.js
// ===========================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCwBWi9FwLRM_Hleu76WeRjyJ4DQc3XjNk",
  authDomain: "internship-site.firebaseapp.com",
  projectId: "internship-site",
  storageBucket: "internship-site.firebasestorage.app",
  messagingSenderId: "39309492271",
  appId: "1:39309492271:web:36b0a4703e99f67929c6da",
  measurementId: "G-GTPJVTPYF5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ss_ prefixed collections — brand new, won't touch existing data
export const COLLECTIONS = {
  USERS: 'ss_users',
  JOBS: 'ss_jobs',
  INTERNSHIPS: 'ss_internships',
  HACKATHONS: 'ss_hackathons',
  TECH_EVENTS: 'ss_techEvents',
  SEMINARS: 'ss_seminars',
  ADS: 'ss_ads'
};

export default app;
