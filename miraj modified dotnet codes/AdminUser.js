// DOM Elements
const tableBody = document.getElementById('tableBody');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');
const searchInput = document.getElementById('searchInput');
const totalUsersElement = document.getElementById('totalUsers');
const adminUsersElement = document.getElementById('adminUsers');
const staffUsersElement = document.getElementById('staffUsers');
const memberUsersElement = document.getElementById('memberUsers');

// Modal Elements
const roleModal = document.getElementById('roleModal');
const deleteModal = document.getElementById('deleteModal');
const userToUpdateElement = document.getElementById('userToUpdate');
const userToDeleteElement = document.getElementById('userToDelete');
const confirmUpdateRoleBtn = document.getElementById('confirmUpdateRole');
const cancelUpdateRoleBtn = document.getElementById('cancelUpdateRole');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const cancelDeleteBtn = document.getElementById('cancelDelete');
const closeBtns = document.querySelectorAll('.close');

// Global Variables
let users = [];
let selectedUserId = null;

// API Base URL
const API_BASE_URL = 'http://localhost:5085/api'; // Update with your actual API URL

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Show Toast Notification
function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  if (isError) toast.classList.add('error');
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 600);
  }, 3000);
}

// Fetch all users
async function fetchUsers() {
  try {
    loadingIndicator.style.display = 'block';
    errorMessage.style.display = 'none';

    const response = await fetch(`${API_BASE_URL}/Auth/all`);

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    users = await response.json();
    updateStats(users);
    displayUsers(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    errorMessage.textContent = `Error: ${error.message}`;
    errorMessage.style.display = 'block';
  } finally {
    loadingIndicator.style.display = 'none';
  }
}

// Update user statistics
function updateStats(users) {
  const totalUsers = users.length;
  const adminUsers = users.filter((user) => user.role === 'admin').length;
  const staffUsers = users.filter((user) => user.role === 'staff').length;
  const memberUsers = users.filter((user) => user.role === 'member').length;
  totalUsersElement.textContent = totalUsers;
  adminUsersElement.textContent = adminUsers;
  staffUsersElement.textContent = staffUsers;
  memberUsersElement.textContent = memberUsers;
}

// Display users in table
function displayUsers(usersToDisplay) {
  tableBody.innerHTML = '';
  if (usersToDisplay.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td colspan="8" style="text-align: center;">No users found</td>
    `;
    tableBody.appendChild(row);
    return;
  }

  usersToDisplay.forEach((user) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${user.id}</td>
      <td>${user.firstName} ${user.lastName}</td>
      <td>${user.email}</td>
      <td>${user.phoneNumber}</td>
      <td>${user.role}</td>
      <td>${formatDate(user.dateJoined)}</td>
      <td><span class="status ${user.isActive ? 'active' : 'inactive'}">${
      user.isActive ? 'Active' : 'Inactive'
    }</span></td>
      <td class="action-buttons">
        ${
          user.role === 'member'
            ? `<button class="btn btn-edit" data-id="${user.id}" data-name="${user.firstName} ${user.lastName}">
              <i class="fas fa-user-shield"></i> Make Staff
            </button>`
            : ''
        }
        ${
          user.role !== 'admin'
            ? `<button class="btn btn-delete" data-id="${user.id}" data-name="${user.firstName} ${user.lastName}">
              <i class="fas fa-trash"></i> Delete
            </button>`
            : ''
        }
      </td>
    `;
    tableBody.appendChild(row);
  });

  addButtonEventListeners();
}

// Add event listeners to buttons
function addButtonEventListeners() {
  const updateRoleButtons = document.querySelectorAll('.btn-edit');
  updateRoleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      selectedUserId = button.getAttribute('data-id');
      const userName = button.getAttribute('data-name');
      openRoleModal(userName);
    });
  });

  const deleteButtons = document.querySelectorAll('.btn-delete');
  deleteButtons.forEach((button) => {
    button.addEventListener('click', () => {
      selectedUserId = button.getAttribute('data-id');
      const userName = button.getAttribute('data-name');
      openDeleteModal(userName);
    });
  });
}

// Filter users based on search input
function filterUsers() {
  const searchTerm = searchInput.value.toLowerCase();
  if (!searchTerm) {
    displayUsers(users);
    return;
  }

  const filteredUsers = users.filter(
    (user) =>
      user.firstName.toLowerCase().includes(searchTerm) ||
      user.lastName.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm) ||
      user.phoneNumber.toLowerCase().includes(searchTerm) ||
      user.role.toLowerCase().includes(searchTerm)
  );

  displayUsers(filteredUsers);
}

// Open role update modal
function openRoleModal(userName) {
  userToUpdateElement.textContent = userName;
  roleModal.style.display = 'block';
}

// Open delete confirmation modal
function openDeleteModal(userName) {
  userToDeleteElement.textContent = userName;
  deleteModal.style.display = 'block';
}

// Close modal
function closeModal() {
  roleModal.style.display = 'none';
  deleteModal.style.display = 'none';
  selectedUserId = null;
}

// Update user role
async function updateUserRole() {
  if (!selectedUserId) return;

  try {
    loadingIndicator.style.display = 'block';
    errorMessage.style.display = 'none';

    const response = await fetch(
      `${API_BASE_URL}/Auth/Update-role/${selectedUserId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    let result;
    try {
      result = response.ok ? await response.json() : {};
    } catch (e) {
      result = {};
    }

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update user role');
    }

    showToast('User role updated successfully');
    fetchUsers();
  } catch (error) {
    console.error('Error updating user role:', error);
    showToast(`Error: ${error.message}`, true);
  } finally {
    loadingIndicator.style.display = 'none';
    closeModal();
  }
}

// Delete user
async function deleteUser() {
  if (!selectedUserId) return;

  try {
    loadingIndicator.style.display = 'block';
    errorMessage.style.display = 'none';

    const response = await fetch(
      `${API_BASE_URL}/Auth/delete/${selectedUserId}`,
      {
        method: 'DELETE'
      }
    );

    let result;
    try {
      result = response.ok ? await response.json() : {};
    } catch (e) {
      result = {};
    }

    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete user');
    }

    showToast('User deleted successfully');
    fetchUsers();
  } catch (error) {
    console.error('Error deleting user:', error);
    showToast(`Error: ${error.message}`, true);
  } finally {
    loadingIndicator.style.display = 'none';
    closeModal();
  }
}

// Logout function
function logout() {
  localStorage.removeItem('accessToken');
  window.location.href = 'login.html';
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  fetchUsers();

  searchInput.addEventListener('input', filterUsers);

  closeBtns.forEach((btn) => {
    btn.addEventListener('click', closeModal);
  });

  confirmUpdateRoleBtn.addEventListener('click', updateUserRole);
  cancelUpdateRoleBtn.addEventListener('click', closeModal);

  confirmDeleteBtn.addEventListener('click', deleteUser);
  cancelDeleteBtn.addEventListener('click', closeModal);

  document.getElementById('logoutBtn')?.addEventListener('click', logout);

  window.addEventListener('click', (event) => {
    if (event.target === roleModal) closeModal();
    if (event.target === deleteModal) closeModal();
  });
});
