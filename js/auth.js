// ===========================
// AUTH MODULE
// js/auth.js
// ===========================

import { auth, db, COLLECTIONS } from './firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// === ENSURE PERSISTENCE IS SET ===
// This prevents Firebase from losing session on page reload
setPersistence(auth, browserLocalPersistence).catch(console.error);

// === TOAST NOTIFICATION ===
export function showToast(message, type = 'info', duration = 4000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon"></span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// === WRITE USER TO FIRESTORE (with retry) ===
async function writeUserToFirestore(uid, email, retries = 3) {
  const userData = {
    uid: uid,
    email: email,
    role: 'user',
    createdAt: serverTimestamp()
  };

  for (let i = 0; i < retries; i++) {
    try {
      await setDoc(doc(db, COLLECTIONS.USERS, uid), userData);
      console.log('✅ User written to Firestore:', uid);
      return true;
    } catch (err) {
      console.error(`❌ Firestore write attempt ${i + 1} failed:`, err.code, err.message);
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, 1000));
      } else {
        throw err;
      }
    }
  }
}

// === GET USER ROLE FROM FIRESTORE ===
export async function getUserRole(uid) {
  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));
    if (userDoc.exists()) {
      return userDoc.data().role || 'user';
    }
    return 'user';
  } catch (err) {
    console.error('Error fetching user role:', err);
    return 'user';
  }
}

// === SIGNUP ===
export async function signUp(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  console.log('✅ Auth user created:', cred.user.uid);
  await writeUserToFirestore(cred.user.uid, email);
  return cred.user;
}

// === LOGIN ===
export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

// === LOGOUT ===
export async function logout() {
  await signOut(auth);
}

// === AUTH STATE OBSERVER ===
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// === REQUIRE AUTH ===
// Waits for Firebase to fully restore session before deciding to redirect.
// Uses auth.currentUser first if already available (avoids flicker).
export function requireAuth(redirectUrl = 'login.html') {
  return new Promise((resolve, reject) => {
    // If Firebase already has the user loaded, resolve immediately
    if (auth.currentUser) {
      return resolve(auth.currentUser);
    }

    // Otherwise wait for auth state (first emission after session restore)
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (user) {
        resolve(user);
      } else {
        window.location.href = redirectUrl;
        reject(new Error('Not authenticated'));
      }
    });
  });
}

// === REQUIRE ADMIN ===
export async function requireAdmin() {
  return new Promise((resolve, reject) => {
    // If Firebase already has the user loaded, check role immediately
    const checkRole = async (user) => {
      if (!user) {
        window.location.href = 'login.html';
        return reject(new Error('Not authenticated'));
      }
      const role = await getUserRole(user.uid);
      if (role !== 'admin') {
        window.location.href = 'index.html';
        return reject(new Error('Not authorized'));
      }
      resolve({ user, role });
    };

    if (auth.currentUser) {
      return checkRole(auth.currentUser);
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub();
      await checkRole(user);
    });
  });
}

// === NAVBAR AUTH STATE ===
export function initNavbarAuth() {
  const navAuth = document.querySelector('.nav-auth');
  const mobileAuth = document.getElementById('mobile-auth-container');

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const role = await getUserRole(user.uid);
      const initials = user.email.charAt(0).toUpperCase();

      // Desktop navbar
      if (navAuth) {
        navAuth.innerHTML = `
          <div class="user-menu">
            <div class="user-avatar" title="${user.email}">${initials}</div>
            <div class="user-dropdown">
              <div class="user-dropdown-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                <span>${user.email.split('@')[0]}</span>
              </div>
              <div style="padding:4px 12px;font-size:11px;color:var(--accent);font-weight:600">${role.toUpperCase()}</div>
              <hr>
              ${role === 'admin' ? `<a href="admin.html" class="user-dropdown-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                Admin Panel
              </a>` : ''}
              <div class="user-dropdown-item danger" id="logout-btn" style="cursor:pointer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign Out
              </div>
            </div>
          </div>
        `;

        document.getElementById('logout-btn')?.addEventListener('click', async () => {
          await logout();
          showToast('Signed out successfully', 'info');
          setTimeout(() => window.location.href = 'index.html', 800);
        });
      }

      // Mobile menu auth — show avatar + sign out instead of login/signup buttons
      if (mobileAuth) {
        mobileAuth.innerHTML = `
          <div style="padding:8px 14px;font-size:13px;color:var(--text2)">
            👤 <strong>${user.email.split('@')[0]}</strong>
            <span style="margin-left:6px;font-size:11px;color:var(--accent);font-weight:600">${role.toUpperCase()}</span>
          </div>
          ${role === 'admin' ? `<a href="admin.html" class="btn btn-secondary" style="flex:1">⚡ Admin</a>` : ''}
          <button class="btn btn-danger" id="mobile-logout-btn" style="flex:1">Sign Out</button>
        `;

        document.getElementById('mobile-logout-btn')?.addEventListener('click', async () => {
          await logout();
          showToast('Signed out successfully', 'info');
          setTimeout(() => window.location.href = 'index.html', 800);
        });
      }

    } else {
      // Not logged in — show login/signup buttons
      if (navAuth) {
        navAuth.innerHTML = `
          <a href="login.html" class="btn btn-ghost">Login</a>
          <a href="signup.html" class="btn btn-primary">Sign Up</a>
        `;
      }

      if (mobileAuth) {
        mobileAuth.innerHTML = `
          <a href="login.html" class="btn btn-ghost">Login</a>
          <a href="signup.html" class="btn btn-primary">Sign Up</a>
        `;
      }
    }
  });
}

// === FORMAT TIME AGO ===
export function timeAgo(timestamp) {
  if (!timestamp) return 'Recently';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
  return date.toLocaleDateString('en-US', { month:'short', day:'numeric' });
}

// === FORMAT FULL DATE ===
export function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// === TRUNCATE TEXT ===
export function truncate(text, max = 120) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '...' : text;
}

// === CATEGORY ICONS ===
export const CATEGORY_CONFIG = {
  jobs: { icon: '💼', label: 'Job', badgeClass: 'badge-job', emoji: '🏢' },
  internships: { icon: '🎓', label: 'Internship', badgeClass: 'badge-internship', emoji: '📚' },
  hackathons: { icon: '⚡', label: 'Hackathon', badgeClass: 'badge-hackathon', emoji: '🏆' },
  techEvents: { icon: '🛠', label: 'Tech Event', badgeClass: 'badge-techEvent', emoji: '💡' },
  seminars: { icon: '🎤', label: 'Seminar', badgeClass: 'badge-seminar', emoji: '🎓' }
};