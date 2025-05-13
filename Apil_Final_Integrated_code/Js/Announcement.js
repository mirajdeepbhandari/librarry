import {
  getToken,
  getUserRole,
  clearSession,
  isTokenExpired
} from './sessionStorage.js';

// API Base URL - Change this to match your API endpoint
const API_URL = 'http://localhost:5085/api/Announcement';

// Create Toast Container
const toastContainer = document.createElement('div');
toastContainer.id = 'toast-container';
toastContainer.className = 'toast-container';
document.body.appendChild(toastContainer);

// Toast Notification Function
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconClass = 'fas ';
  switch (type) {
    case 'success':
      iconClass += 'fa-check-circle';
      break;
    case 'error':
      iconClass += 'fa-exclamation-circle';
      break;
    case 'warning':
      iconClass += 'fa-exclamation-triangle';
      break;
    default:
      iconClass += 'fa-info-circle';
  }

  toast.innerHTML = `
    <i class="toast-icon ${iconClass}"></i>
    <div class="toast-message">${message}</div>
    <button class="toast-close">&times;</button>
  `;

  // Add close functionality
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.classList.add('toast-hiding');
    setTimeout(() => toast.remove(), 300);
  });

  // Auto-remove after animation
  setTimeout(() => {
    if (document.body.contains(toast)) {
      toast.classList.add('toast-hiding');
      setTimeout(() => toast.remove(), 300);
    }
  }, 3500);

  toastContainer.appendChild(toast);
}

// DOM Elements
const announcementsList = document.getElementById('announcements-list');
const addAnnouncementBtn = document.getElementById('add-announcement-btn');
const announcementModal = document.getElementById('announcement-modal');
const deleteModal = document.getElementById('delete-modal');
const announcementForm = document.getElementById('announcement-form');
const modalTitle = document.getElementById('modal-title');
const modalCloseButtons = document.querySelectorAll('.close');
const cancelBtn = document.getElementById('cancel-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

// Form Elements
const announcementIdInput = document.getElementById('announcement-id');
const titleInput = document.getElementById('title');
const contentInput = document.getElementById('content');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const isActiveInput = document.getElementById('is-active');

// Current announcement ID for delete operation
let currentDeleteId = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeAnnouncementManager);

function initializeAnnouncementManager() {
  // Authentication check
  const token = getToken();
  const role = getUserRole();

  if (!token || isTokenExpired()) {
    showToast('Your session has expired. Please log in again.', 'error');
    setTimeout(() => {
      clearSession();
      window.location.href = '../index.html';
    }, 2000);
    return;
  }

  // Check if user has admin role (if role-based access is needed)
  // You can modify this check based on your role requirements
  if (role !== 'admin' && role !== 'editor') {
    showToast(
      'Unauthorized: You do not have permission to manage announcements.',
      'error'
    );
    setTimeout(() => {
      window.location.href = '../dashboard.html'; // Redirect to dashboard or appropriate page
    }, 2000);
    return;
  }

  // Add animation classes to elements
  addEntryAnimations();

  // Set up event listeners for authenticated users
  addAnnouncementBtn.addEventListener('click', openAddModal);
  modalCloseButtons.forEach((button) =>
    button.addEventListener('click', closeModals)
  );
  cancelBtn.addEventListener('click', closeModals);
  cancelDeleteBtn.addEventListener('click', closeModals);
  confirmDeleteBtn.addEventListener('click', deleteAnnouncement);
  announcementForm.addEventListener('submit', saveAnnouncement);

  // Load announcements
  loadAnnouncements();
}

// Add entry animations to page elements
function addEntryAnimations() {
  const header = document.querySelector('header');
  const mainContent = document.querySelector('main');

  // Add animation classes with delay
  setTimeout(() => header?.classList.add('fade-in'), 100);
  setTimeout(() => mainContent?.classList.add('fade-in'), 300);

  // Add animation to announcement list when it loads
  if (announcementsList) {
    announcementsList.classList.add('loading');
  }
}

// Function to load announcements from the API
async function loadAnnouncements() {
  const token = getToken();

  try {
    // Show loading state
    if (announcementsList) {
      announcementsList.innerHTML = `
        <div class="loading-indicator">
          <i class="fas fa-spinner fa-pulse"></i>
          <p>Loading announcements...</p>
        </div>`;
      announcementsList.classList.add('loading');
    }

    const response = await fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        showToast('Your session has expired. Please log in again.', 'error');
        setTimeout(() => {
          clearSession();
          window.location.href = '../index.html';
        }, 2000);
        return;
      }
      throw new Error('Failed to fetch announcements');
    }

    const data = await response.json();

    // Clear the loading state
    if (announcementsList) {
      announcementsList.classList.remove('loading');
      announcementsList.innerHTML = '';
    }

    if (!data.success || !data.data || data.data.length === 0) {
      displayNoAnnouncements();
      return;
    }

    // Sort announcements by start date (newest first)
    const sortedAnnouncements = data.data.sort(
      (a, b) => new Date(b.startDate) - new Date(a.startDate)
    );

    // Display each announcement
    sortedAnnouncements.forEach((announcement) => {
      displayAnnouncement(announcement);
    });
  } catch (error) {
    console.error('Error loading announcements:', error);
    showToast('Error loading announcements. Please try again later.', 'error');

    if (announcementsList) {
      announcementsList.classList.remove('loading');
      announcementsList.innerHTML = `
        <div class="no-announcements error">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Error loading announcements. Please try again later.</p>
        </div>
      `;
    }
  }
}

// Function to display a single announcement
function displayAnnouncement(announcement) {
  const startDate = new Date(announcement.startDate);
  const endDate = new Date(announcement.endDate);
  const today = new Date();

  // Determine announcement status
  let statusClass = 'inactive-badge';
  let statusText = 'Inactive';

  if (announcement.isActive) {
    if (today < startDate) {
      statusClass = 'future-badge';
      statusText = 'Upcoming';
    } else if (today <= endDate) {
      statusClass = 'active-badge';
      statusText = 'Active';
    }
  }

  const announcementElement = document.createElement('div');
  announcementElement.className = 'announcement-card';
  announcementElement.innerHTML = `
    <h3>${announcement.title}</h3>
    <div class="announcement-meta">
      <span><i class="far fa-calendar"></i> ${formatDate(
        startDate
      )} - ${formatDate(endDate)}</span>
      <span class="status-badge ${statusClass}">${statusText}</span>
    </div>
    <div class="announcement-content">
      ${announcement.content}
    </div>
    <div class="announcement-actions">
      <button class="action-btn edit-btn" data-id="${
        announcement.id
      }" aria-label="Edit">
        <i class="fas fa-edit"></i>
      </button>
      <button class="action-btn delete-btn" data-id="${
        announcement.id
      }" aria-label="Delete">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;

  // Add event listeners for edit and delete buttons
  announcementElement
    .querySelector('.edit-btn')
    .addEventListener('click', () => openEditModal(announcement));
  announcementElement
    .querySelector('.delete-btn')
    .addEventListener('click', () => openDeleteModal(announcement.id));

  announcementsList.appendChild(announcementElement);

  // Apply fade-in animation to the new element
  setTimeout(() => {
    announcementElement.classList.add('fade-in');
  }, 50);
}

// Function to display "no announcements" message
function displayNoAnnouncements() {
  announcementsList.innerHTML = `
    <div class="no-announcements">
      <i class="fas fa-bullhorn"></i>
      <p>No announcements found. Create a new announcement to get started.</p>
    </div>
  `;
}

// Function to format date
function formatDate(date) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Function to open add announcement modal
function openAddModal() {
  // Reset form
  announcementForm.reset();

  // Set default dates (today and a week from today)
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  startDateInput.value = formatDateForInput(today);
  endDateInput.value = formatDateForInput(nextWeek);

  // Clear hidden ID field
  announcementIdInput.value = '';

  // Update modal title
  modalTitle.textContent = 'New Announcement';

  // Open modal with animation
  announcementModal.style.display = 'block';
  setTimeout(() => {
    announcementModal.classList.add('modal-visible');
  }, 50);
}

// Function to open edit announcement modal
function openEditModal(announcement) {
  // Fill form with announcement data
  announcementIdInput.value = announcement.id;
  titleInput.value = announcement.title;
  contentInput.value = announcement.content;
  startDateInput.value = formatDateForInput(new Date(announcement.startDate));
  endDateInput.value = formatDateForInput(new Date(announcement.endDate));
  isActiveInput.checked = announcement.isActive;

  // Update modal title
  modalTitle.textContent = 'Edit Announcement';

  // Open modal with animation
  announcementModal.style.display = 'block';
  setTimeout(() => {
    announcementModal.classList.add('modal-visible');
  }, 50);
}

// Function to open delete confirmation modal
function openDeleteModal(id) {
  currentDeleteId = id;
  deleteModal.style.display = 'block';
  setTimeout(() => {
    deleteModal.classList.add('modal-visible');
  }, 50);
}

// Function to close all modals
function closeModals() {
  announcementModal.classList.remove('modal-visible');
  deleteModal.classList.remove('modal-visible');

  setTimeout(() => {
    announcementModal.style.display = 'none';
    deleteModal.style.display = 'none';
  }, 300); // Match transition duration in CSS
}

// Function to format date for input elements (YYYY-MM-DD)
function formatDateForInput(date) {
  return date.toISOString().split('T')[0];
}

// Function to save (create or update) an announcement
// Function to save (create or update) an announcement
async function saveAnnouncement(e) {
  e.preventDefault();

  const token = getToken();
  if (!token || isTokenExpired()) {
    showToast('Your session has expired. Please log in again.', 'error');
    setTimeout(() => {
      clearSession();
      window.location.href = '../index.html';
    }, 2000);
    return;
  }

  // Validate dates
  const startDate = new Date(startDateInput.value);
  const endDate = new Date(endDateInput.value);

  if (startDate >= endDate) {
    showToast('Start Date must be earlier than End Date.', 'warning');
    return;
  }

  // Prepare announcement data
  // Convert dates to ISO format with UTC timezone to fix PostgreSQL timestamptz issue
  const startDateObj = new Date(startDateInput.value);
  const endDateObj = new Date(endDateInput.value);

  const announcementData = {
    title: titleInput.value,
    content: contentInput.value,
    startDate: startDateObj.toISOString(), // Convert to ISO format with UTC timezone
    endDate: endDateObj.toISOString(), // Convert to ISO format with UTC timezone
    isActive: isActiveInput.checked
  };

  // Add loading state to form
  const submitBtn = announcementForm.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  submitBtn.disabled = true;

  try {
    let response;
    let successMessage;

    // If we have an ID, update existing announcement, otherwise create new one
    if (announcementIdInput.value) {
      // Update
      response = await fetch(`${API_URL}/${announcementIdInput.value}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(announcementData)
      });
      successMessage = 'Announcement updated successfully';
    } else {
      // Create
      response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(announcementData)
      });
      successMessage = 'Announcement created successfully';
    }

    // Handle unauthorized response
    if (response.status === 401) {
      showToast('Your session has expired. Please log in again.', 'error');
      setTimeout(() => {
        clearSession();
        window.location.href = '../index.html';
      }, 2000);
      return;
    }

    let result;
    // Check if response is valid JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        throw new Error('Server returned invalid JSON response');
      }
    } else {
      // Not JSON, try to get text content for better error reporting
      const textContent = await response.text();
      console.error('Non-JSON response:', textContent);
      throw new Error(
        `Server returned non-JSON response: ${response.status} ${response.statusText}`
      );
    }

    if (result.success) {
      // Close modal and reload announcements
      closeModals();
      loadAnnouncements();
      showToast(successMessage);
    } else {
      showToast(
        `Error: ${result.message || 'Failed to save announcement'}`,
        'error'
      );
    }
  } catch (error) {
    console.error('Error saving announcement:', error);
    showToast(`Error saving announcement: ${error.message}`, 'error');
  } finally {
    // Reset button state
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
  }
}

// Function to delete an announcement
async function deleteAnnouncement() {
  if (!currentDeleteId) return;

  const token = getToken();
  if (!token || isTokenExpired()) {
    showToast('Your session has expired. Please log in again.', 'error');
    setTimeout(() => {
      clearSession();
      window.location.href = '../index.html';
    }, 2000);
    return;
  }

  // Add loading state to button
  const deleteBtn = confirmDeleteBtn;
  const originalBtnText = deleteBtn.innerHTML;
  deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
  deleteBtn.disabled = true;

  try {
    const response = await fetch(`${API_URL}/${currentDeleteId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Handle unauthorized response
    if (response.status === 401) {
      showToast('Your session has expired. Please log in again.', 'error');
      setTimeout(() => {
        clearSession();
        window.location.href = '../index.html';
      }, 2000);
      return;
    }

    const result = await response.json();

    if (result.success) {
      // Find and animate removal of the deleted announcement
      const announcementCard = document
        .querySelector(`.action-btn.delete-btn[data-id="${currentDeleteId}"]`)
        ?.closest('.announcement-card');

      if (announcementCard) {
        // Animate removal
        announcementCard.classList.add('fade-out');
        setTimeout(() => {
          announcementCard.remove();

          // Check if we need to display "no announcements" message
          if (announcementsList.children.length === 0) {
            displayNoAnnouncements();
          }
        }, 300);
      } else {
        // If card not found, just reload all announcements
        loadAnnouncements();
      }

      // Close modal
      closeModals();
      showToast('Announcement deleted successfully');
    } else {
      showToast(
        `Error: ${result.message || 'Failed to delete announcement'}`,
        'error'
      );
    }
  } catch (error) {
    console.error('Error deleting announcement:', error);
    showToast('Error deleting announcement. Please try again.', 'error');
  } finally {
    // Reset button state
    deleteBtn.innerHTML = originalBtnText;
    deleteBtn.disabled = false;

    // Reset current delete ID
    currentDeleteId = null;
  }
}
