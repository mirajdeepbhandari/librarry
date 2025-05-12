// AdminDashboard.js
import { getToken, getUserRole, clearSession, isTokenExpired } from './sessionStorage.js';

// Helper function to extract user information from JWT token
function getUserInfoFromToken() {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.nameid || payload.sub,
      username: payload.name || '',
      email: payload.email || '',
      role: payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload.role || 'member'
    };
  } catch {
    return null;
  }
}

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

// User info elements
const userNameElement = document.querySelector('.user-details h4');
const userEmailElement = document.querySelector('.user-details p');

// Global Variables
let users = [];
let selectedUserId = null;
let currentUserRole = null;

// API Base URL
const API_BASE_URL = 'http://localhost:5085/api';

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Show Toast Notification with enhanced animation
function showToast(message, isError = false) {
  // Remove any existing toasts
  const existingToasts = document.querySelectorAll('.toast');
  existingToasts.forEach(toast => {
    document.body.removeChild(toast);
  });

  const toast = document.createElement('div');
  toast.className = 'toast';
  if (isError) toast.classList.add('error');
  
  // Add icon based on message type
  const icon = isError ? 
    '<i class="fas fa-exclamation-circle" style="margin-right: 8px;"></i>' : 
    '<i class="fas fa-check-circle" style="margin-right: 8px;"></i>';
  
  toast.innerHTML = `${icon}${message}`;

  document.body.appendChild(toast);

  // Add a pulsing glow effect for important messages
  if (isError) {
    toast.style.animation = 'slideIn 0.3s ease forwards, pulse 2s infinite';
  }

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(30px)';
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 600);
  }, 3000);
}

// Check Authentication with improved error handling
function checkAuth() {
  if (!getToken() || isTokenExpired()) {
    showToast('Your session has expired. Please login again.', true);
    setTimeout(() => {
      logout();
    }, 1500);
    return false;
  }
  
  // Get user role and update UI accordingly
  currentUserRole = getUserRole();
  
  // Update user info in sidebar
  updateUserInfo();
  
  // Check if user has admin privileges
  if (currentUserRole !== 'admin') {
    showToast('You do not have permission to access this page', true);
    setTimeout(() => {
      window.location.href = 'index.html'; // Redirect to home page
    }, 1500);
    return false;
  }
  
  return true;
}

// Update User Info in sidebar with animation
function updateUserInfo() {
  const userInfo = getUserInfoFromToken();
  
  if (userInfo) {
    // Add a subtle animation when updating user info
    const userInfoContainer = document.querySelector('.user-info');
    userInfoContainer.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    userInfoContainer.style.opacity = '0';
    userInfoContainer.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
      userNameElement.textContent = userInfo.username || 'Admin User';
      userEmailElement.textContent = userInfo.email || 'admin@bookhaven.com';
      
      userInfoContainer.style.opacity = '1';
      userInfoContainer.style.transform = 'translateY(0)';
    }, 300);
  } else {
    userNameElement.textContent = currentUserRole.charAt(0).toUpperCase() + currentUserRole.slice(1);
    userEmailElement.textContent = 'User';
  }
}

// Fetch all users with improved loading state
async function fetchUsers() {
  if (!checkAuth()) return;
  
  try {
    loadingIndicator.style.display = 'block';
    loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 10px;"></i> Loading users data...';
    errorMessage.style.display = 'none';
    
    // Add loading class to table for visual feedback
    const tableContainer = document.querySelector('.table-container');
    tableContainer.classList.add('loading');

    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/Auth/all`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    users = await response.json();
    updateStats(users);
    displayUsers(users);
    
    // Add a success indicator
    showToast('User data loaded successfully');
  } catch (error) {
    console.error('Error fetching users:', error);
    errorMessage.innerHTML = `<i class="fas fa-exclamation-triangle" style="margin-right: 10px;"></i> Error: ${error.message}`;
    errorMessage.style.display = 'block';
  } finally {
    loadingIndicator.style.display = 'none';
    
    // Remove loading class
    const tableContainer = document.querySelector('.table-container');
    tableContainer.classList.remove('loading');
  }
}

// Update user statistics with counter animation
function updateStats(users) {
  const totalUsers = users.length;
  const adminUsers = users.filter((user) => user.role === 'admin').length;
  const staffUsers = users.filter((user) => user.role === 'staff').length;
  const memberUsers = users.filter((user) => user.role === 'member').length;
  
  // Animate counting up
  animateCounter(totalUsersElement, totalUsers);
  animateCounter(adminUsersElement, adminUsers);
  animateCounter(staffUsersElement, staffUsers);
  animateCounter(memberUsersElement, memberUsers);
  
  // Add a subtle pulse animation to highlight changes
  const statCards = document.querySelectorAll('.stat-card');
  statCards.forEach(card => {
    card.classList.add('updated');
    setTimeout(() => {
      card.classList.remove('updated');
    }, 2000);
  });
}

// Helper function to animate counting
function animateCounter(element, targetValue) {
  const duration = 1000; // ms
  const frameDuration = 16; // ms
  const totalFrames = Math.round(duration / frameDuration);
  const startValue = parseInt(element.textContent) || 0;
  const valueIncrement = (targetValue - startValue) / totalFrames;
  
  let currentFrame = 0;
  
  const animate = () => {
    currentFrame++;
    const currentValue = Math.round(startValue + valueIncrement * currentFrame);
    element.textContent = currentValue;
    
    if (currentFrame < totalFrames) {
      requestAnimationFrame(animate);
    } else {
      element.textContent = targetValue;
    }
  };
  
  animate();
}

// Display users in table with improved row rendering
function displayUsers(usersToDisplay) {
  tableBody.innerHTML = '';
  
  if (usersToDisplay.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td colspan="8" style="text-align: center;">
        <i class="fas fa-user-slash" style="margin-right: 10px;"></i>
        No users found
      </td>
    `;
    tableBody.appendChild(row);
    return;
  }

  // Get current user ID for highlighting
  let currentUserId = '';
  try {
    const payload = JSON.parse(atob(getToken().split('.')[1]));
    currentUserId = payload.nameid || payload.sub;
  } catch (e) {
    console.error('Error parsing token:', e);
  }

  // Create and append rows with staggered animation
  usersToDisplay.forEach((user, index) => {
    const row = document.createElement('tr');
    
    // Highlight current user
    if (user.id === currentUserId) {
      row.classList.add('current-user');
    }
    
    // Apply staggered fade-in animation
    row.style.animation = `fadeIn 0.3s ease forwards ${index * 0.05}s`;
    row.style.opacity = '0';
    
    row.innerHTML = `
      <td>${user.id}</td>
      <td>
        <div style="display: flex; align-items: center;">
          <div class="user-avatar" style="width: 30px; height: 30px; border-radius: 50%; background: rgba(52, 152, 219, 0.2); display: flex; align-items: center; justify-content: center; margin-right: 10px;">
            <i class="fas fa-user" style="font-size: 12px;"></i>
          </div>
          ${user.firstName} ${user.lastName}
        </div>
      </td>
      <td>${user.email}</td>
      <td>${user.phoneNumber || 'N/A'}</td>
      <td>
        <span class="${user.role}-badge" style="padding: 4px 8px; border-radius: 12px; font-size: 12px; 
          background: ${getRoleBadgeColor(user.role)}">
          <i class="${getRoleIcon(user.role)}" style="margin-right: 5px;"></i>
          ${user.role}
        </span>
      </td>
      <td>${formatDate(user.dateJoined)}</td>
      <td>
        <span class="status ${user.isActive ? 'active' : 'inactive'}">
          <i class="fas fa-${user.isActive ? 'circle' : 'circle'}" style="margin-right: 5px; font-size: 10px;"></i>
          ${user.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td class="action-buttons">
        ${user.role === 'member' ? 
          `<button class="btn btn-edit glass-btn" data-id="${user.id}" data-name="${user.firstName} ${user.lastName}">
            <i class="fas fa-user-shield"></i> Make Staff
          </button>` : ''
        }
        ${(user.role !== 'admin' || (user.role === 'admin' && currentUserRole === 'admin' && user.id !== currentUserId)) ?
          `<button class="btn btn-delete glass-btn" data-id="${user.id}" data-name="${user.firstName} ${user.lastName}">
            <i class="fas fa-trash"></i> Delete
          </button>` : ''
        }
      </td>
    `;
    tableBody.appendChild(row);
  });

  // Add keyframe animation to CSS if it doesn't exist
  if (!document.getElementById('fadeInAnimation')) {
    const style = document.createElement('style');
    style.id = 'fadeInAnimation';
    style.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(52, 152, 219, 0.5); }
        70% { box-shadow: 0 0 0 10px rgba(52, 152, 219, 0); }
        100% { box-shadow: 0 0 0 0 rgba(52, 152, 219, 0); }
      }
      .stat-card.updated {
        animation: pulse 1.5s ease;
      }
      .table-container.loading {
        position: relative;
      }
      .table-container.loading::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(44, 62, 80, 0.2);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
      }
    `;
    document.head.appendChild(style);
  }

  addButtonEventListeners();
}

// Helper function to get role badge color
function getRoleBadgeColor(role) {
  switch(role) {
    case 'admin':
      return 'rgba(220, 53, 69, 0.2)';
    case 'staff':
      return 'rgba(255, 193, 7, 0.2)';
    default:
      return 'rgba(52, 152, 219, 0.2)';
  }
}

// Helper function to get role icon
function getRoleIcon(role) {
  switch(role) {
    case 'admin':
      return 'fas fa-user-shield';
    case 'staff':
      return 'fas fa-user-tie';
    default:
      return 'fas fa-user';
  }
}

// Add event listeners to buttons with improved hover effects
function addButtonEventListeners() {
  // Enhanced button hover effects
  const allButtons = document.querySelectorAll('.btn');
  allButtons.forEach(button => {
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-3px)';
      button.style.boxShadow = '0 0 15px var(--glow-color)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = '';
      button.style.boxShadow = '';
    });
  });

  // Role update buttons
  const updateRoleButtons = document.querySelectorAll('.btn-edit');
  updateRoleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      selectedUserId = button.getAttribute('data-id');
      const userName = button.getAttribute('data-name');
      openRoleModal(userName);
    });
  });

  // Delete buttons
  const deleteButtons = document.querySelectorAll('.btn-delete');
  deleteButtons.forEach((button) => {
    button.addEventListener('click', () => {
      selectedUserId = button.getAttribute('data-id');
      const userName = button.getAttribute('data-name');
      openDeleteModal(userName);
    });
  });
}

// Filter users based on search input with debounce
let searchTimeout;
function filterUsers() {
  clearTimeout(searchTimeout);
  
  searchTimeout = setTimeout(() => {
    const searchTerm = searchInput.value.toLowerCase();
    
    // Add loading animation to search
    const searchIcon = document.querySelector('.search-box i');
    searchIcon.className = 'fas fa-spinner fa-spin';
    
    if (!searchTerm) {
      displayUsers(users);
      searchIcon.className = 'fas fa-search';
      return;
    }

    const filteredUsers = users.filter(
      (user) =>
        user.firstName?.toLowerCase().includes(searchTerm) ||
        user.lastName?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        (user.phoneNumber && user.phoneNumber.toLowerCase().includes(searchTerm)) ||
        user.role?.toLowerCase().includes(searchTerm)
    );

    displayUsers(filteredUsers);
    searchIcon.className = 'fas fa-search';
    
    // Show result count
    showToast(`Found ${filteredUsers.length} user${filteredUsers.length !== 1 ? 's' : ''}`);
  }, 300);
}

// Open role update modal with animation
function openRoleModal(userName) {
  userToUpdateElement.textContent = userName;
  roleModal.style.display = 'block';
  
  // Add entrance animation
  const modalContent = roleModal.querySelector('.modal-content');
  modalContent.style.opacity = '0';
  modalContent.style.transform = 'scale(0.9)';
  
  setTimeout(() => {
    modalContent.style.transition = 'all 0.3s ease';
    modalContent.style.opacity = '1';
    modalContent.style.transform = 'scale(1)';
  }, 10);
}

// Open delete confirmation modal with animation
function openDeleteModal(userName) {
  userToDeleteElement.textContent = userName;
  deleteModal.style.display = 'block';
  
  // Add entrance animation
  const modalContent = deleteModal.querySelector('.modal-content');
  modalContent.style.opacity = '0';
  modalContent.style.transform = 'scale(0.9)';
  
  setTimeout(() => {
    modalContent.style.transition = 'all 0.3s ease';
    modalContent.style.opacity = '1';
    modalContent.style.transform = 'scale(1)';
  }, 10);
}

// Close modal with exit animation
function closeModal() {
  const roleModalContent = roleModal.querySelector('.modal-content');
  const deleteModalContent = deleteModal.querySelector('.modal-content');
  
  // Add exit animation
  if (roleModal.style.display === 'block') {
    roleModalContent.style.opacity = '0';
    roleModalContent.style.transform = 'scale(0.9)';
  }
  
  if (deleteModal.style.display === 'block') {
    deleteModalContent.style.opacity = '0';
    deleteModalContent.style.transform = 'scale(0.9)';
  }
  
  setTimeout(() => {
    roleModal.style.display = 'none';
    deleteModal.style.display = 'none';
    selectedUserId = null;
  }, 300);
}

// Update user role with improved feedback
async function updateUserRole() {
  if (!selectedUserId || !checkAuth()) return;

  try {
    // Change button state to loading
    confirmUpdateRoleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    confirmUpdateRoleBtn.disabled = true;
    
    loadingIndicator.style.display = 'block';
    errorMessage.style.display = 'none';

    const token = getToken();
    const response = await fetch(
      `${API_BASE_URL}/Auth/Update-role/${selectedUserId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
    confirmUpdateRoleBtn.innerHTML = 'Update Role';
    confirmUpdateRoleBtn.disabled = false;
    closeModal();
  }
}

// Delete user with improved feedback
async function deleteUser() {
  if (!selectedUserId || !checkAuth()) return;

  try {
    // Change button state to loading
    confirmDeleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
    confirmDeleteBtn.disabled = true;
    
    loadingIndicator.style.display = 'block';
    errorMessage.style.display = 'none';

    const token = getToken();
    const response = await fetch(
      `${API_BASE_URL}/Auth/delete/${selectedUserId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
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
      throw new Error(result.message || 'Failed to delete user');
    }

    showToast('User deleted successfully');
    fetchUsers();
  } catch (error) {
    console.error('Error deleting user:', error);
    showToast(`Error: ${error.message}`, true);
  } finally {
    loadingIndicator.style.display = 'none';
    confirmDeleteBtn.innerHTML = 'Delete';
    confirmDeleteBtn.disabled = false;
    closeModal();
  }
}

// Logout function with animation
function logout() {
  // Add a fade out effect to the entire UI
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.5s ease';
  
  setTimeout(() => {
    clearSession();
    window.location.href = '../index.html'; // Redirect to login page
  }, 500);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Page load animation
  document.body.style.opacity = '0';
  setTimeout(() => {
    document.body.style.transition = 'opacity 0.5s ease';
    document.body.style.opacity = '1';
  }, 100);
  
  // Check authentication first
  if (!checkAuth()) return;
  
  fetchUsers();

  // Enhanced search box interaction
  searchInput.addEventListener('input', filterUsers);
  
  const searchBox = document.querySelector('.search-box');
  searchInput.addEventListener('focus', () => {
    searchBox.style.boxShadow = '0 0 15px var(--glow-color)';
  });
  
  searchInput.addEventListener('blur', () => {
    searchBox.style.boxShadow = '';
  });

  // Modal close buttons
  closeBtns.forEach((btn) => {
    btn.addEventListener('click', closeModal);
  });

  // Role update buttons
  confirmUpdateRoleBtn.addEventListener('click', updateUserRole);
  cancelUpdateRoleBtn.addEventListener('click', closeModal);

  // Delete buttons
  confirmDeleteBtn.addEventListener('click', deleteUser);
  cancelDeleteBtn.addEventListener('click', closeModal);

  // Logout button
  document.getElementById('logoutBtn').addEventListener('click', logout);

  // Close modals when clicking outside
  window.addEventListener('click', (event) => {
    if (event.target === roleModal) closeModal();
    if (event.target === deleteModal) closeModal();
  });
  
  // Notification bell animation
  const notificationBell = document.getElementById('notification-bell');
  notificationBell.addEventListener('click', () => {
    notificationBell.style.transform = 'scale(1.2)';
    setTimeout(() => {
      notificationBell.style.transform = 'scale(1)';
      showToast('No new notifications');
    }, 200);
  });
  
  // Enhanced bubble animation
  const bubbles = document.querySelectorAll('.bubble');
  bubbles.forEach(bubble => {
    // Make bubbles more interactive
    bubble.addEventListener('mouseenter', () => {
      bubble.style.transform = 'scale(1.2)';
      bubble.style.boxShadow = '0 0 20px rgba(52, 152, 219, 0.6)';
    });
    
    bubble.addEventListener('mouseleave', () => {
      bubble.style.transform = '';
      bubble.style.boxShadow = '';
    });
  });
  
  // Set interval to check if token is expired
  setInterval(() => {
    if (isTokenExpired()) {
      showToast('Your session has expired. Please login again.', true);
      setTimeout(logout, 1500);
    }
  }, 60000); // Check every minute
});

// Add a pulsing effect to the logo
document.addEventListener('DOMContentLoaded', () => {
  const logo = document.querySelector('.logo h2');
  if (logo) {
    setInterval(() => {
      logo.style.textShadow = '0 0 15px rgba(52, 152, 219, 0.9)';
      setTimeout(() => {
        logo.style.textShadow = '0 0 10px rgba(52, 152, 219, 0.7)';
      }, 1000);
    }, 2000);
  }
});