// ===========================
// ADMIN MODULE
// js/admin.js
// ===========================

import { auth, db, COLLECTIONS } from './firebase.js';
import { requireAdmin, showToast, formatDate, CATEGORY_CONFIG } from './auth.js';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// === STATE ===
let currentUser = null;
let allPosts = [];

// === INIT ===
async function init() {
  try {
    const { user } = await requireAdmin();
    currentUser = user;
    document.getElementById('admin-email').textContent = user.email;
    loadDashboard();
    initNav();
    initForms();
    initMobileMenu();
    // Show dashboard by default
    showSection('dashboard');
  } catch (err) {
    console.error('Admin auth failed:', err);
  }
}

// === SIDEBAR NAVIGATION ===
function initNav() {
  document.querySelectorAll('.sidebar-link[data-section]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const section = link.dataset.section;
      showSection(section);
      closeMobileSidebar();
    });
  });

  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = 'index.html';
  });
}

function showSection(id) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.getElementById(`section-${id}`)?.classList.add('active');
  document.querySelector(`.sidebar-link[data-section="${id}"]`)?.classList.add('active');

  if (id === 'manage') loadManagePosts();
  if (id === 'dashboard') loadDashboard();
}

// === DASHBOARD ===
async function loadDashboard() {
  const cols = [
    { col: COLLECTIONS.JOBS, id: 'stat-jobs' },
    { col: COLLECTIONS.INTERNSHIPS, id: 'stat-internships' },
    { col: COLLECTIONS.HACKATHONS, id: 'stat-hackathons' },
    { col: COLLECTIONS.TECH_EVENTS, id: 'stat-techevents' },
    { col: COLLECTIONS.SEMINARS, id: 'stat-seminars' },
    { col: COLLECTIONS.ADS, id: 'stat-ads' }
  ];

  let total = 0;
  for (const { col, id } of cols) {
    try {
      const snap = await getDocs(collection(db, col));
      const count = snap.size;
      total += count;
      const el = document.getElementById(id);
      if (el) el.textContent = count;
    } catch { /* skip */ }
  }
  const totalEl = document.getElementById('stat-total');
  if (totalEl) totalEl.textContent = total;
}

// === FORM INITIALIZATION ===
function initForms() {
  setupForm('form-job', COLLECTIONS.JOBS, buildJobData);
  setupForm('form-internship', COLLECTIONS.INTERNSHIPS, buildInternshipData);
  setupForm('form-hackathon', COLLECTIONS.HACKATHONS, buildHackathonData);
  setupForm('form-techevent', COLLECTIONS.TECH_EVENTS, buildTechEventData);
  setupForm('form-seminar', COLLECTIONS.SEMINARS, buildSeminarData);
  setupForm('form-ad', COLLECTIONS.ADS, buildAdData);
}

function setupForm(formId, collectionName, dataBuilder) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Saving...';
    btn.disabled = true;

    try {
      const data = dataBuilder(form);
      data.createdBy = currentUser.uid;
      data.postedAt = serverTimestamp();

      await addDoc(collection(db, collectionName), data);
      showToast(`✅ ${collectionName} post created successfully!`, 'success');
      form.reset();
    } catch (err) {
      console.error('Error saving:', err);
      showToast(`Failed to save: ${err.message}`, 'error');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
}

// === DATA BUILDERS ===
function buildJobData(form) {
  return {
    title: form.querySelector('[name="title"]').value.trim(),
    company: form.querySelector('[name="company"]').value.trim(),
    location: form.querySelector('[name="location"]').value.trim(),
    experienceLevel: form.querySelector('[name="experienceLevel"]').value,
    description: form.querySelector('[name="description"]').value.trim(),
    requirements: form.querySelector('[name="requirements"]').value.trim(),
    benefits: form.querySelector('[name="benefits"]').value.trim(),
    imagePath: form.querySelector('[name="imagePath"]').value.trim(),
    applyLink: form.querySelector('[name="applyLink"]').value.trim(),
    category: 'jobs'
  };
}

function buildInternshipData(form) {
  return {
    ...buildJobData(form),
    duration: form.querySelector('[name="duration"]').value.trim(),
    category: 'internships'
  };
}

function buildHackathonData(form) {
  return {
    title: form.querySelector('[name="title"]').value.trim(),
    organizer: form.querySelector('[name="organizer"]').value.trim(),
    mode: form.querySelector('[name="mode"]').value,
    prizePool: form.querySelector('[name="prizePool"]').value.trim(),
    deadline: form.querySelector('[name="deadline"]').value,
    description: form.querySelector('[name="description"]').value.trim(),
    imagePath: form.querySelector('[name="imagePath"]').value.trim(),
    applyLink: form.querySelector('[name="applyLink"]').value.trim(),
    category: 'hackathons'
  };
}

function buildTechEventData(form) {
  return {
    title: form.querySelector('[name="title"]').value.trim(),
    speaker: form.querySelector('[name="speaker"]').value.trim(),
    venue: form.querySelector('[name="venue"]').value.trim(),
    eventDate: form.querySelector('[name="eventDate"]').value,
    description: form.querySelector('[name="description"]').value.trim(),
    imagePath: form.querySelector('[name="imagePath"]').value.trim(),
    applyLink: form.querySelector('[name="applyLink"]').value.trim(),
    category: 'techEvents'
  };
}

function buildSeminarData(form) {
  return {
    title: form.querySelector('[name="title"]').value.trim(),
    speaker: form.querySelector('[name="speaker"]').value.trim(),
    venue: form.querySelector('[name="venue"]').value.trim(),
    eventDate: form.querySelector('[name="eventDate"]').value,
    description: form.querySelector('[name="description"]').value.trim(),
    imagePath: form.querySelector('[name="imagePath"]').value.trim(),
    applyLink: form.querySelector('[name="applyLink"]').value.trim(),
    category: 'seminars'
  };
}

function buildAdData(form) {
  return {
    title: form.querySelector('[name="title"]').value.trim(),
    imagePath: form.querySelector('[name="imagePath"]').value.trim(),
    redirectLink: form.querySelector('[name="redirectLink"]').value.trim(),
    placement: form.querySelector('[name="placement"]').value,
    createdAt: serverTimestamp()
  };
}

// === MANAGE POSTS ===
async function loadManagePosts() {
  const tbody = document.getElementById('posts-tbody');
  const filterSel = document.getElementById('manage-filter');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">Loading...</td></tr>';

  const selectedCol = filterSel?.value || 'all';
  allPosts = [];

  const colsToFetch = selectedCol === 'all'
    ? Object.values(COLLECTIONS).filter(c => c !== 'users' && c !== 'ads')
    : [selectedCol];

  for (const col of colsToFetch) {
    try {
      const snap = await getDocs(query(collection(db, col), orderBy('postedAt', 'desc')));
      snap.docs.forEach(d => allPosts.push({ id: d.id, _col: col, ...d.data() }));
    } catch { /* skip */ }
  }

  if (allPosts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">No posts found</td></tr>';
    return;
  }

  tbody.innerHTML = allPosts.map(post => {
    const config = CATEGORY_CONFIG[post._col] || { icon: '📄', label: post._col };
    return `
      <tr>
        <td>${post.title || 'Untitled'}</td>
        <td><span class="card-badge ${config.badgeClass || ''}">${config.icon} ${config.label}</span></td>
        <td>${post.company || post.organizer || '—'}</td>
        <td>${post.location || post.venue || '—'}</td>
        <td>${formatDate(post.postedAt)}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm" onclick="editPost('${post.id}','${post._col}')">✏️ Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deletePost('${post.id}','${post._col}')">🗑 Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// === DELETE POST ===
window.deletePost = async function(id, col) {
  if (!confirm('Delete this post permanently?')) return;
  try {
    await deleteDoc(doc(db, col, id));
    showToast('Post deleted', 'success');
    loadManagePosts();
    loadDashboard();
  } catch (err) {
    showToast('Delete failed: ' + err.message, 'error');
  }
};

// === EDIT POST ===
window.editPost = async function(id, col) {
  try {
    const snap = await getDoc(doc(db, col, id));
    if (!snap.exists()) return showToast('Post not found', 'error');
    const data = snap.data();
    openEditModal(id, col, data);
  } catch (err) {
    showToast('Error loading post', 'error');
  }
};

function openEditModal(id, col, data) {
  const modal = document.getElementById('edit-modal');
  const modalBody = document.getElementById('edit-modal-body');
  if (!modal || !modalBody) return;

  // Generate form fields based on collection
  const fields = getFieldsForCollection(col, data);
  modalBody.innerHTML = `
    <form id="edit-form">
      <div class="form-grid">
        ${fields.map(f => `
          <div class="form-group ${f.full ? 'full' : ''}">
            <label class="form-label">${f.label}</label>
            ${f.type === 'textarea'
              ? `<textarea name="${f.name}" class="form-textarea" ${f.required ? 'required' : ''}>${data[f.name] || ''}</textarea>`
              : f.type === 'select'
              ? `<select name="${f.name}" class="form-select">
                  ${f.options.map(o => `<option value="${o}" ${data[f.name] === o ? 'selected' : ''}>${o}</option>`).join('')}
                </select>`
              : `<input type="${f.type || 'text'}" name="${f.name}" class="form-input" value="${data[f.name] || ''}" ${f.required ? 'required' : ''}>`
            }
          </div>
        `).join('')}
      </div>
      <div style="display:flex;gap:12px;margin-top:24px">
        <button type="submit" class="btn btn-primary">Save Changes</button>
        <button type="button" class="btn btn-secondary" onclick="closeEditModal()">Cancel</button>
      </div>
    </form>
  `;

  modal.classList.add('open');

  document.getElementById('edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = 'Saving...';
    btn.disabled = true;

    try {
      const updates = {};
      fields.forEach(f => {
        const el = form.querySelector(`[name="${f.name}"]`);
        if (el) updates[f.name] = el.value.trim();
      });

      await updateDoc(doc(db, col, id), updates);
      showToast('Post updated successfully!', 'success');
      closeEditModal();
      loadManagePosts();
    } catch (err) {
      showToast('Update failed: ' + err.message, 'error');
    } finally {
      btn.textContent = 'Save Changes';
      btn.disabled = false;
    }
  });
}

function getFieldsForCollection(col, data) {
  const common = [
    { name: 'title', label: 'Title', required: true },
    { name: 'description', label: 'Description', type: 'textarea', full: true },
    { name: 'imagePath', label: 'Image Path', full: true },
    { name: 'applyLink', label: 'Apply / Registration Link', full: true }
  ];

  switch (col) {
    case COLLECTIONS.JOBS:
    case COLLECTIONS.INTERNSHIPS:
      return [
        ...common,
        { name: 'company', label: 'Company' },
        { name: 'location', label: 'Location' },
        { name: 'experienceLevel', label: 'Experience Level', type: 'select', options: ['', 'Entry Level', 'Junior', 'Mid Level', 'Senior', 'Lead'] },
        { name: 'requirements', label: 'Requirements', type: 'textarea', full: true },
        { name: 'benefits', label: 'Benefits', type: 'textarea', full: true },
        ...(col === COLLECTIONS.INTERNSHIPS ? [{ name: 'duration', label: 'Duration' }] : [])
      ];
    case COLLECTIONS.HACKATHONS:
      return [
        ...common,
        { name: 'organizer', label: 'Organizer' },
        { name: 'mode', label: 'Mode', type: 'select', options: ['Online', 'Offline', 'Hybrid'] },
        { name: 'prizePool', label: 'Prize Pool' },
        { name: 'deadline', label: 'Deadline', type: 'date' }
      ];
    case COLLECTIONS.TECH_EVENTS:
    case COLLECTIONS.SEMINARS:
      return [
        ...common,
        { name: 'speaker', label: 'Speaker' },
        { name: 'venue', label: 'Venue' },
        { name: 'eventDate', label: 'Event Date', type: 'date' }
      ];
    case COLLECTIONS.ADS:
      return [
        { name: 'title', label: 'Ad Title', required: true },
        { name: 'imagePath', label: 'Image Path', full: true },
        { name: 'redirectLink', label: 'Redirect Link', full: true },
        { name: 'placement', label: 'Placement', type: 'select', options: ['top', 'betweenCards'] }
      ];
    default:
      return common;
  }
}

window.closeEditModal = function() {
  document.getElementById('edit-modal')?.classList.remove('open');
};

document.getElementById('edit-modal')?.addEventListener('click', function(e) {
  if (e.target === this) closeEditModal();
});

// === MANAGE FILTER ===
document.getElementById('manage-filter')?.addEventListener('change', loadManagePosts);

// === MOBILE SIDEBAR ===
function initMobileMenu() {
  const toggle = document.querySelector('.admin-menu-toggle');
  const sidebar = document.querySelector('.admin-sidebar');
  const overlay = document.querySelector('.sidebar-overlay');

  toggle?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
    overlay?.classList.toggle('open');
  });

  overlay?.addEventListener('click', closeMobileSidebar);
}

function closeMobileSidebar() {
  document.querySelector('.admin-sidebar')?.classList.remove('open');
  document.querySelector('.sidebar-overlay')?.classList.remove('open');
}

// === START ===
init();
