// API Base URL - Change this to match your API endpoint
const API_URL = 'http://localhost:5085/api/Announcement';

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
document.addEventListener('DOMContentLoaded', loadAnnouncements);
addAnnouncementBtn.addEventListener('click', openAddModal);
modalCloseButtons.forEach((button) =>
  button.addEventListener('click', closeModals)
);
cancelBtn.addEventListener('click', closeModals);
cancelDeleteBtn.addEventListener('click', closeModals);
confirmDeleteBtn.addEventListener('click', deleteAnnouncement);
announcementForm.addEventListener('submit', saveAnnouncement);

// Function to load announcements from the API
async function loadAnnouncements() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    // Clear the loading spinner
    announcementsList.innerHTML = '';

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
    announcementsList.innerHTML = `
            <div class="no-announcements">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading announcements. Please try again later.</p>
            </div>
        `;
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

  // Open modal
  announcementModal.style.display = 'block';
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

  // Open modal
  announcementModal.style.display = 'block';
}

// Function to open delete confirmation modal
function openDeleteModal(id) {
  currentDeleteId = id;
  deleteModal.style.display = 'block';
}

// Function to close all modals
function closeModals() {
  announcementModal.style.display = 'none';
  deleteModal.style.display = 'none';
}

// Function to format date for input elements (YYYY-MM-DD)
function formatDateForInput(date) {
  return date.toISOString().split('T')[0];
}

// Function to save (create or update) an announcement
async function saveAnnouncement(e) {
  e.preventDefault();

  // Validate dates
  const startDate = new Date(startDateInput.value);
  const endDate = new Date(endDateInput.value);

  if (startDate >= endDate) {
    alert('Start Date must be earlier than End Date.');
    return;
  }

  // Prepare announcement data
  const announcementData = {
    title: titleInput.value,
    content: contentInput.value,
    startDate: startDateInput.value,
    endDate: endDateInput.value,
    isActive: isActiveInput.checked
  };

  try {
    let response;

    // If we have an ID, update existing announcement, otherwise create new one
    if (announcementIdInput.value) {
      // Update
      response = await fetch(`${API_URL}/${announcementIdInput.value}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(announcementData)
      });
    } else {
      // Create
      response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(announcementData)
      });
    }

    const result = await response.json();

    if (result.success) {
      // Close modal and reload announcements
      closeModals();
      loadAnnouncements();
    } else {
      alert(`Error: ${result.message || 'Failed to save announcement'}`);
    }
  } catch (error) {
    console.error('Error saving announcement:', error);
    alert('Error saving announcement. Please try again.');
  }
}

// Function to delete an announcement
async function deleteAnnouncement() {
  if (!currentDeleteId) return;

  try {
    const response = await fetch(`${API_URL}/${currentDeleteId}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (result.success) {
      // Close modal and reload announcements
      closeModals();
      loadAnnouncements();
    } else {
      alert(`Error: ${result.message || 'Failed to delete announcement'}`);
    }
  } catch (error) {
    console.error('Error deleting announcement:', error);
    alert('Error deleting announcement. Please try again.');
  }

  // Reset current delete ID
  currentDeleteId = null;
}
