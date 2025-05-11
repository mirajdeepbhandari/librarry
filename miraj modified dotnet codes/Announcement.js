// API Configuration
const API_BASE_URL = 'http://localhost:5085/api';
const API_ENDPOINTS = {
  announcements: `${API_BASE_URL}/Announcement`
};

// DOM Elements
const announcementsContainer = document.getElementById(
  'announcements-container'
);
const addAnnouncementBtn = document.getElementById('add-announcement-btn');
const announcementModal = document.getElementById('announcement-modal');
const confirmModal = document.getElementById('confirm-modal');
const announcementForm = document.getElementById('announcement-form');
const modalTitle = document.getElementById('modal-title');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userNameElement = document.getElementById('user-name');
const adminControls = document.getElementById('admin-controls');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

// State Management
let currentUser = null;
let isAdmin = false;
let announcements = [];
let currentAnnouncementId = null;

// Toast Notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.className = toast.className.replace('show', '');
  }, 3000);
}

// Authentication Functions
function checkAuthStatus() {
  const token = localStorage.getItem('authToken');

  if (token) {
    // Simplified auth check - in a real app, verify the token with the server
    try {
      const userData = JSON.parse(atob(token.split('.')[1]));
      currentUser = {
        id: userData.sub,
        name: userData.name,
        roles: userData.roles || []
      };

      isAdmin = currentUser.roles.includes('Admin');

      userNameElement.textContent = currentUser.name;
      loginBtn.style.display = 'none';
      logoutBtn.style.display = 'inline-block';

      if (isAdmin) {
        adminControls.style.display = 'block';
      }
    } catch (error) {
      logout(); // Invalid token format
    }
  }
}

function login() {
  // In a real application, redirect to a login page or show a login modal
  // For demo purposes, we'll simulate a login with admin rights
  const mockUser = {
    sub: 'user123',
    name: 'Admin User',
    roles: ['Admin']
  };

  const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
    JSON.stringify(mockUser)
  )}.signature`;
  localStorage.setItem('authToken', mockToken);

  checkAuthStatus();
  showToast('Successfully logged in as Admin');
}

function logout() {
  localStorage.removeItem('authToken');
  currentUser = null;
  isAdmin = false;

  userNameElement.textContent = 'Guest';
  loginBtn.style.display = 'inline-block';
  logoutBtn.style.display = 'none';
  adminControls.style.display = 'none';

  showToast('Successfully logged out', 'warning');
}

// API Functions
async function fetchAnnouncements() {
  try {
    announcementsContainer.innerHTML =
      '<div class="loading">Loading announcements...</div>';

    const response = await fetch(API_ENDPOINTS.announcements);
    const result = await response.json();

    if (result.success) {
      announcements = result.data;
      renderAnnouncements();
    } else {
      throw new Error(result.message || 'Failed to fetch announcements');
    }
  } catch (error) {
    console.error('Error fetching announcements:', error);
    announcementsContainer.innerHTML = `
            <div class="error-message">
                Failed to load announcements. Please try again later.
            </div>
        `;
    showToast(error.message || 'Failed to load announcements', 'error');
  }
}

async function createAnnouncement(announcementData) {
  try {
    const token = localStorage.getItem('authToken');

    const response = await fetch(API_ENDPOINTS.announcements, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(announcementData)
    });

    const result = await response.json();

    if (result.success) {
      showToast('Announcement created successfully');
      fetchAnnouncements();
    } else {
      throw new Error(result.message || 'Failed to create announcement');
    }
  } catch (error) {
    console.error('Error creating announcement:', error);
    showToast(error.message || 'Failed to create announcement', 'error');
  }
}

async function updateAnnouncement(id, announcementData) {
  try {
    const token = localStorage.getItem('authToken');

    const response = await fetch(`${API_ENDPOINTS.announcements}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(announcementData)
    });

    const result = await response.json();

    if (result.success) {
      showToast('Announcement updated successfully');
      fetchAnnouncements();
    } else {
      throw new Error(result.message || 'Failed to update announcement');
    }
  } catch (error) {
    console.error('Error updating announcement:', error);
    showToast(error.message || 'Failed to update announcement', 'error');
  }
}

async function deleteAnnouncement(id) {
  try {
    const token = localStorage.getItem('authToken');

    const response = await fetch(`${API_ENDPOINTS.announcements}/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (result.success) {
      showToast('Announcement deleted successfully');
      fetchAnnouncements();
    } else {
      throw new Error(result.message || 'Failed to delete announcement');
    }
  } catch (error) {
    console.error('Error deleting announcement:', error);
    showToast(error.message || 'Failed to delete announcement', 'error');
  }
}

// Rendering Functions
function renderAnnouncements() {
  if (!announcements || announcements.length === 0) {
    announcementsContainer.innerHTML = `
            <div class="no-data">
                <p>No announcements available at the moment.</p>
            </div>
        `;
    return;
  }

  // Sort announcements by start date (newest first)
  announcements.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  announcementsContainer.innerHTML = '';

  announcements.forEach((announcement) => {
    const startDate = new Date(announcement.startDate).toLocaleDateString();
    const endDate = new Date(announcement.endDate).toLocaleDateString();
    const statusClass = announcement.isActive ? 'active' : 'inactive';
    const statusText = announcement.isActive ? 'Active' : 'Inactive';

    const announcementCard = document.createElement('div');
    announcementCard.className = 'announcement-card';
    announcementCard.innerHTML = `
            <h3 class="announcement-title">${announcement.title}</h3>
            <p class="announcement-content">${announcement.content}</p>
            <div class="announcement-meta">
                <span>${startDate} - ${endDate}</span>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
        `;

    // Add action buttons for admin users
    if (isAdmin) {
      const actionButtons = document.createElement('div');
      actionButtons.className = 'announcement-actions';
      actionButtons.innerHTML = `
                <button class="btn btn-secondary btn-icon edit-btn" data-id="${announcement.id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger btn-icon delete-btn" data-id="${announcement.id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            `;

      announcementCard.appendChild(actionButtons);

      // Add event listeners
      const editBtn = actionButtons.querySelector('.edit-btn');
      const deleteBtn = actionButtons.querySelector('.delete-btn');

      editBtn.addEventListener('click', () => openEditModal(announcement.id));
      deleteBtn.addEventListener('click', () =>
        openDeleteConfirmation(announcement.id)
      );
    }

    announcementsContainer.appendChild(announcementCard);
  });
}

// Modal Functions
function openCreateModal() {
  modalTitle.textContent = 'Add New Announcement';
  resetForm();

  // Set default dates (today and 7 days from now)
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  document.getElementById('start-date').value = formatDateForInput(today);
  document.getElementById('end-date').value = formatDateForInput(nextWeek);

  announcementModal.style.display = 'block';
  document.getElementById('title').focus();
}

function openEditModal(id) {
  const announcement = announcements.find((a) => a.id === id);
  if (!announcement) return;

  modalTitle.textContent = 'Edit Announcement';
  document.getElementById('announcement-id').value = announcement.id;
  document.getElementById('title').value = announcement.title;
  document.getElementById('content').value = announcement.content;
  document.getElementById('start-date').value = formatDateForInput(
    new Date(announcement.startDate)
  );
  document.getElementById('end-date').value = formatDateForInput(
    new Date(announcement.endDate)
  );
  document.getElementById('is-active').checked = announcement.isActive;

  announcementModal.style.display = 'block';
  document.getElementById('title').focus();
}

function openDeleteConfirmation(id) {
  currentAnnouncementId = id;
  confirmModal.style.display = 'block';
}

function closeModal(modalElement) {
  modalElement.style.display = 'none';
}

function resetForm() {
  announcementForm.reset();
  document.getElementById('announcement-id').value = '';
}

// Helper Functions
function formatDateForInput(date) {
  return date.toISOString().split('T')[0];
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in
  checkAuthStatus();

  // Fetch announcements
  fetchAnnouncements();

  // Add announcement button
  addAnnouncementBtn.addEventListener('click', openCreateModal);

  // Login/Logout buttons
  loginBtn.addEventListener('click', login);
  logoutBtn.addEventListener('click', logout);

  // Form submission
  announcementForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
      title: document.getElementById('title').value,
      content: document.getElementById('content').value,
      startDate: new Date(document.getElementById('start-date').value),
      endDate: new Date(document.getElementById('end-date').value),
      isActive: document.getElementById('is-active').checked
    };

    const id = document.getElementById('announcement-id').value;

    if (id) {
      // Update existing
      await updateAnnouncement(id, formData);
    } else {
      // Create new
      await createAnnouncement(formData);
    }

    closeModal(announcementModal);
  });

  // Confirm delete button
  confirmDeleteBtn.addEventListener('click', async () => {
    if (currentAnnouncementId) {
      await deleteAnnouncement(currentAnnouncementId);
      currentAnnouncementId = null;
      closeModal(confirmModal);
    }
  });

  // Close modal buttons
  document.querySelectorAll('.close, .cancel-btn').forEach((element) => {
    element.addEventListener('click', () => {
      closeModal(announcementModal);
      closeModal(confirmModal);
    });
  });

  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === announcementModal) {
      closeModal(announcementModal);
    } else if (e.target === confirmModal) {
      closeModal(confirmModal);
    }
  });
});
