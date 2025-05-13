import { getToken, getUserRole } from './sessionStorage.js';

const API_BASE_URL = 'http://localhost:5085/api/Discount';

// DOM Elements
const discountTableBody = document.getElementById('discount-table-body');
const discountForm = document.getElementById('discount-form');
const formTitle = document.getElementById('form-title');
const discountIdInput = document.getElementById('discount-id');
const bookIdInput = document.getElementById('book-id');
const discountPercentageInput = document.getElementById('discount-percentage');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const onSaleInput = document.getElementById('on-sale');
const isActiveInput = document.getElementById('is-active');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const searchInput = document.getElementById('search-input');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');
const closeNotification = document.querySelector('.close-notification');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const userInfoDisplay = document.getElementById('user-info');

// Show loading state
function showLoadingState() {
  discountTableBody.innerHTML = `
    <tr>
      <td colspan="8" style="text-align: center;">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin fa-2x"></i>
          <p>Loading discounts...</p>
        </div>
      </td>
    </tr>
  `;
}

// Display user info from token
async function displayUserInfo() {
  try {
    const token = getToken();
    if (!token) {
      userInfoDisplay.textContent = 'Not logged in';
      return;
    }
    
    // Decode token to get user info
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    const userId = tokenPayload.nameid || tokenPayload.userId || 'Unknown';
    const userName = tokenPayload.unique_name || tokenPayload.name || 'User';
    const role = getUserRole() || 'User';
    
    userInfoDisplay.innerHTML = `
      <strong>${userName}</strong> (${role})
    `;
  } catch (error) {
    console.error('Error displaying user info:', error);
    userInfoDisplay.textContent = 'User information unavailable';
  }
}

// Animate background bubbles
function animateBubbles() {
  const bubbles = document.querySelectorAll('.bubble');
  
  bubbles.forEach(bubble => {
    const randomLeft = Math.random() * 100;
    bubble.style.left = `${randomLeft}%`;
    
    // Reset animation
    bubble.style.animation = 'none';
    setTimeout(() => {
      bubble.style.animation = '';
    }, 10);
  });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  displayUserInfo();
  showLoadingState();
  loadDiscounts();
  animateBubbles();
  setInterval(animateBubbles, 20000); // Reposition bubbles every 20 seconds
  
  resetForm(); // Initialize the form with default dates
});

discountForm.addEventListener('submit', (event) => {
  event.preventDefault();
  
  // Add loading state to save button
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  saveBtn.disabled = true;
  
  handleFormSubmit().finally(() => {
    // Remove loading state
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Save';
    saveBtn.disabled = false;
  });
});

cancelBtn.addEventListener('click', () => {
  resetForm();
  showSuccessIndicator(cancelBtn);
});

searchInput.addEventListener('input', () => {
  filterDiscounts();
  
  // Add animation to search icon
  const searchIcon = document.querySelector('.search-icon');
  searchIcon.classList.add('searching');
  setTimeout(() => {
    searchIcon.classList.remove('searching');
  }, 300);
});

closeNotification.addEventListener('click', () => {
  hideNotification();
});

// Tab navigation with animation
tabBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const tabId = btn.getAttribute('data-tab');

    tabBtns.forEach((b) => b.classList.remove('active'));
    tabContents.forEach((t) => {
      t.classList.remove('active');
      t.style.display = 'none';
    });

    btn.classList.add('active');
    const activeTab = document.getElementById(`${tabId}-tab`);
    
    // Fade in animation for tab content
    setTimeout(() => {
      activeTab.style.display = 'block';
      setTimeout(() => {
        activeTab.classList.add('active');
      }, 50);
    }, 200);

    if (tabId === 'form') resetForm();
  });
});

// Add visual feedback for buttons
function showSuccessIndicator(button) {
  const originalContent = button.innerHTML;
  button.innerHTML = '<i class="fas fa-check"></i> Done';
  
  setTimeout(() => {
    button.innerHTML = originalContent;
  }, 1000);
}

// Load all discounts
async function loadDiscounts() {
  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (result.success) {
      renderDiscountTable(result.data);
      showNotification(`<i class="fas fa-check-circle"></i> ${result.data.length} discounts loaded successfully`);
    } else {
      showNotification(`<i class="fas fa-exclamation-triangle"></i> ${result.message || 'Failed to load discounts'}`, true);
      renderDiscountTable([]);
    }
  } catch (error) {
    console.error('Error loading discounts:', error);
    showNotification('<i class="fas fa-exclamation-circle"></i> Error connecting to the server', true);
    renderDiscountTable([]);
  }
}

// Render discount table with animation
function renderDiscountTable(discounts) {
  discountTableBody.innerHTML = '';

  if (!discounts || discounts.length === 0) {
    discountTableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px;">
          <i class="fas fa-search fa-3x" style="opacity: 0.5; margin-bottom: 15px;"></i>
          <p>No discounts found</p>
        </td>
      </tr>`;
    return;
  }

  const userRole = getUserRole();

  discounts.forEach((discount, index) => {
    const startDate = new Date(discount.startDate).toLocaleString();
    const endDate = new Date(discount.endDate).toLocaleString();
    const isExpired = new Date(discount.endDate) < new Date();
    
    const tr = document.createElement('tr');
    tr.style.animation = `fadeIn 0.3s ease forwards ${index * 0.05}s`;
    tr.style.opacity = '0';
    
    // Highlight upcoming end date
    const endDateClass = isExpired ? 'expired-date' : 
                         (new Date(discount.endDate) - new Date() < 86400000 * 3) ? 'ending-soon' : '';

    tr.innerHTML = `
      <td>${discount.id}</td>
      <td>${discount.bookId}</td>
      <td><span class="discount-badge">${discount.discountPercentage}%</span></td>
      <td>${startDate}</td>
      <td class="${endDateClass}">${endDate}</td>
      <td>${discount.onSale ? 
            '<span class="status-badge sale-badge"><i class="fas fa-tags"></i> Yes</span>' : 
            '<span class="status-badge no-sale-badge"><i class="fas fa-times"></i> No</span>'
          }</td>
      <td>${discount.isActive ? 
            '<span class="status-badge active-badge"><i class="fas fa-check-circle"></i> Yes</span>' : 
            '<span class="status-badge inactive-badge"><i class="fas fa-times-circle"></i> No</span>'
          }</td>
      <td class="action-cell">
        ${userRole === 'admin' ? `
          <button class="action-btn edit-btn" data-id="${discount.id}"><i class="fas fa-edit"></i> Edit</button>
          <button class="action-btn delete-btn" data-id="${discount.id}"><i class="fas fa-trash-alt"></i> Delete</button>` : 
          '<span class="no-actions">No actions available</span>'
        }
      </td>`;

    discountTableBody.appendChild(tr);
    
    // Add style to the newly created elements
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .discount-badge {
        background: rgba(52, 152, 219, 0.2);
        padding: 4px 8px;
        border-radius: 20px;
        font-weight: bold;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      }
      .status-badge {
        padding: 5px 10px;
        border-radius: 20px;
        font-size: 12px;
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }
      .sale-badge { background: rgba(46, 204, 113, 0.2); }
      .no-sale-badge { background: rgba(231, 76, 60, 0.2); }
      .active-badge { background: rgba(46, 204, 113, 0.2); }
      .inactive-badge { background: rgba(231, 76, 60, 0.2); }
      .expired-date { color: rgba(231, 76, 60, 0.8); }
      .ending-soon { color: rgba(241, 196, 15, 0.8); }
      .no-actions {
        opacity: 0.6;
        font-style: italic;
      }
      .action-cell {
        display: flex;
        gap: 5px;
        justify-content: flex-start;
        flex-wrap: wrap;
      }
      .searching {
        animation: pulse 0.3s ease;
      }
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  });

  if (userRole === 'admin') {
    document.querySelectorAll('.edit-btn').forEach((btn) => {
      btn.addEventListener('click', () =>
        editDiscount(parseInt(btn.getAttribute('data-id')))
      );
    });

    document.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', () =>
        deleteDiscount(parseInt(btn.getAttribute('data-id')))
      );
    });
  }
}

// Filter discounts with highlighting
function filterDiscounts() {
  const searchTerm = searchInput.value.toLowerCase();
  const rows = discountTableBody.querySelectorAll('tr');

  rows.forEach((row) => {
    const text = row.textContent.toLowerCase();
    const hasMatch = text.includes(searchTerm);
    
    row.style.display = hasMatch ? '' : 'none';
    
    // Highlight matching text if there's a search term
    if (searchTerm && hasMatch) {
      const cells = row.querySelectorAll('td');
      cells.forEach(cell => {
        const originalText = cell.innerText;
        if (originalText.toLowerCase().includes(searchTerm)) {
          const regex = new RegExp(`(${searchTerm})`, 'gi');
          // Don't apply highlighting to cells with HTML content (like buttons)
          if (!cell.querySelector('button') && !cell.querySelector('span')) {
            cell.innerHTML = originalText.replace(regex, '<mark>$1</mark>');
          }
        }
      });
    }
  });
  
  // Show "no results" message if no matches
  const visibleRows = [...rows].filter(row => row.style.display !== 'none');
  if (searchTerm && visibleRows.length === 0) {
    discountTableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px;">
          <i class="fas fa-search fa-3x" style="opacity: 0.5; margin-bottom: 15px;"></i>
          <p>No discounts found matching "${searchTerm}"</p>
        </td>
      </tr>`;
  }
}

// Submit form (create or update)
async function handleFormSubmit() {
  try {
    // Validate form first
    if (!validateForm()) {
      return;
    }

    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);

    if (startDate >= endDate) {
      showNotification('<i class="fas fa-calendar-times"></i> Start date must be before end date', true);
      highlightInvalidInput(startDateInput);
      highlightInvalidInput(endDateInput);
      return;
    }

    // Format dates for backend. The C# controller expects ISO format
    const formatToISOString = (dateInput) => {
      const date = new Date(dateInput.value);
      return date.toISOString();
    };

    const discountData = {
      bookId: parseInt(bookIdInput.value),
      discountPercentage: parseFloat(discountPercentageInput.value),
      startDate: formatToISOString(startDateInput),
      endDate: formatToISOString(endDateInput),
      onSale: onSaleInput.checked,
      isActive: isActiveInput.checked
    };

    // Add ID if editing
    const discountId = discountIdInput.value;
    if (discountId) {
      discountData.id = parseInt(discountId);
    }

    console.log('Sending discount data:', discountData);

    const token = getToken();
    const url = discountId ? `${API_BASE_URL}/${discountId}` : API_BASE_URL;
    const method = discountId ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(discountData)
    });

    // Check if the request was successful first
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error:', errorText);
      let errorMessage = 'Server error';
      
      try {
        // Try to parse as JSON if possible
        const errorJson = JSON.parse(errorText); 
        errorMessage = errorJson.message || errorJson.error || 'Server error';
      } catch (e) {
        // If not JSON, use the raw text
        errorMessage = errorText || 'Server error';
      }
      
      showNotification(`<i class="fas fa-exclamation-triangle"></i> ${errorMessage}`, true);
      return;
    }

    const result = await response.json();

    if (result.success) {
      showNotification(`<i class="fas fa-check-circle"></i> ${result.message || 'Discount saved successfully'}`);
      await loadDiscounts();
      resetForm();
      tabBtns[0].click(); // Switch to list view
    } else {
      showNotification(`<i class="fas fa-exclamation-triangle"></i> ${result.message || 'Operation failed'}`, true);
    }
  } catch (error) {
    console.error('Error saving discount:', error);
    showNotification('<i class="fas fa-exclamation-circle"></i> Error connecting to the server', true);
  }
}

// Validate form before submission
function validateForm() {
  // Check if book ID is valid
  if (!bookIdInput.value || isNaN(parseInt(bookIdInput.value)) || parseInt(bookIdInput.value) <= 0) {
    showNotification('<i class="fas fa-exclamation-triangle"></i> Please enter a valid Book ID', true);
    highlightInvalidInput(bookIdInput);
    return false;
  }
  
  // Check if discount percentage is valid
  const discountPercentage = parseFloat(discountPercentageInput.value);
  if (isNaN(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) {
    showNotification('<i class="fas fa-exclamation-triangle"></i> Discount percentage must be between 0 and 100', true);
    highlightInvalidInput(discountPercentageInput);
    return false;
  }
  
  // Check if dates are valid
  if (!startDateInput.value || !endDateInput.value) {
    showNotification('<i class="fas fa-exclamation-triangle"></i> Please select valid dates', true);
    if (!startDateInput.value) highlightInvalidInput(startDateInput);
    if (!endDateInput.value) highlightInvalidInput(endDateInput);
    return false;
  }
  
  return true;
}

// Highlight invalid input fields
function highlightInvalidInput(inputElement) {
  inputElement.classList.add('invalid-input');
  inputElement.style.animation = 'shake 0.5s';
  
  // Add shake animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-5px); }
      40%, 80% { transform: translateX(5px); }
    }
    .invalid-input {
      border-color: rgba(231, 76, 60, 0.8) !important;
      box-shadow: 0 0 10px rgba(231, 76, 60, 0.5) !important;
    }
  `;
  document.head.appendChild(style);
  
  // Remove after a delay
  setTimeout(() => {
    inputElement.classList.remove('invalid-input');
    inputElement.style.animation = '';
  }, 3000);
}

// Edit discount
async function editDiscount(id) {
  try {
    // Show loading spinner before fetch
    discountTableBody.querySelectorAll(`[data-id="${id}"]`).forEach(btn => {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      btn.disabled = true;
    });
    
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Reset buttons after operation completes
    const resetButtons = () => {
      const editBtn = document.querySelector(`.edit-btn[data-id="${id}"]`);
      const deleteBtn = document.querySelector(`.delete-btn[data-id="${id}"]`);
      if (editBtn) editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
      if (deleteBtn) deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
      if (editBtn) editBtn.disabled = false;
      if (deleteBtn) deleteBtn.disabled = false;
    };

    if (!response.ok) {
      resetButtons();
      showNotification('<i class="fas fa-exclamation-triangle"></i> Failed to fetch discount details', true);
      return;
    }

    const result = await response.json();
    resetButtons();

    if (result.success) {
      const discount = result.data;

      const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      discountIdInput.value = discount.id;
      bookIdInput.value = discount.bookId;
      discountPercentageInput.value = discount.discountPercentage;
      startDateInput.value = formatDate(discount.startDate);
      endDateInput.value = formatDate(discount.endDate);
      onSaleInput.checked = discount.onSale;
      isActiveInput.checked = discount.isActive;

      formTitle.innerHTML = `<i class="fas fa-edit"></i> Edit Discount #${discount.id}`;
      
      // Switch to form tab with animation
      tabBtns[1].click();
      
      // Apply highlight animation to form fields
      const formInputs = document.querySelectorAll('#discount-form input:not([type="hidden"])');
      formInputs.forEach((input, index) => {
        setTimeout(() => {
          input.classList.add('highlight-input');
          setTimeout(() => {
            input.classList.remove('highlight-input');
          }, 1000);
        }, index * 100);
      });
      
      // Add highlight animation style
      const style = document.createElement('style');
      style.textContent = `
        @keyframes highlightPulse {
          0% { box-shadow: 0 0 0 rgba(52, 152, 219, 0); }
          50% { box-shadow: 0 0 10px rgba(52, 152, 219, 0.5); }
          100% { box-shadow: 0 0 0 rgba(52, 152, 219, 0); }
        }
        .highlight-input {
          animation: highlightPulse 1s ease;
          border-color: rgba(52, 152, 219, 0.8) !important;
        }
      `;
      document.head.appendChild(style);
    } else {
      showNotification(`<i class="fas fa-exclamation-triangle"></i> ${result.message || 'Failed to load discount details'}`, true);
    }
  } catch (error) {
    console.error('Error loading discount details:', error);
    showNotification('<i class="fas fa-exclamation-circle"></i> Error connecting to the server', true);
    
    // Reset buttons if there was an error
    discountTableBody.querySelectorAll(`[data-id="${id}"]`).forEach(btn => {
      if (btn.classList.contains('edit-btn')) {
        btn.innerHTML = '<i class="fas fa-edit"></i> Edit';
      } else if (btn.classList.contains('delete-btn')) {
        btn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
      }
      btn.disabled = false;
    });
  }
}

// Delete discount
async function deleteDiscount(id) {
  // Use custom confirm dialog instead of browser default
  const confirmDelete = confirm(`Are you sure you want to delete discount #${id}?`);
  if (!confirmDelete) return;

  try {
    // Show loading spinner on the delete button
    const deleteBtn = document.querySelector(`.delete-btn[data-id="${id}"]`);
    const originalBtnText = deleteBtn.innerHTML;
    deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
    deleteBtn.disabled = true;
    
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      deleteBtn.innerHTML = originalBtnText;
      deleteBtn.disabled = false;
      
      const errorText = await response.text();
      let errorMessage = 'Failed to delete discount';
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      
      showNotification(`<i class="fas fa-exclamation-triangle"></i> ${errorMessage}`, true);
      return;
    }

    const result = await response.json();

    if (result.success) {
      // Animate row removal before actually removing
      const row = deleteBtn.closest('tr');
      row.style.animation = 'fadeOut 0.5s ease forwards';
      
      // Add fadeOut animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes fadeOut {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(20px); }
        }
      `;
      document.head.appendChild(style);
      
      setTimeout(() => {
        showNotification(`<i class="fas fa-check-circle"></i> ${result.message || 'Discount deleted successfully'}`);
        loadDiscounts();
      }, 500);
    } else {
      deleteBtn.innerHTML = originalBtnText;
      deleteBtn.disabled = false;
      showNotification(`<i class="fas fa-exclamation-triangle"></i> ${result.message || 'Failed to delete discount'}`, true);
    }
  } catch (error) {
    console.error('Error deleting discount:', error);
    
    // Reset button state
    const deleteBtn = document.querySelector(`.delete-btn[data-id="${id}"]`);
    if (deleteBtn) {
      deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
      deleteBtn.disabled = false;
    }
    
    showNotification('<i class="fas fa-exclamation-circle"></i> Error connecting to the server', true);
  }
}

// Reset form with animation
function resetForm() {
  discountForm.reset();
  discountIdInput.value = '';
  formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Add New Discount';

  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 7);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  startDateInput.value = formatDate(now);
  endDateInput.value = formatDate(tomorrow);
  
  // Reset any validation styling
  const formInputs = document.querySelectorAll('#discount-form input');
  formInputs.forEach(input => {
    input.classList.remove('invalid-input');
    input.style.animation = '';
  });
}

// Show notification with animation
function showNotification(message, isError = false) {
  notificationMessage.innerHTML = message;
  notification.className = 'notification';
  if (isError) notification.classList.add('error');
  
  // Add glow effect for errors
  if (isError) {
    notification.style.animation = 'errorGlow 2s infinite';
    
    // Add error glow animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes errorGlow {
        0%, 100% { box-shadow: 0 5px 20px rgba(231, 76, 60, 0.3); }
        50% { box-shadow: 0 5px 30px rgba(231, 76, 60, 0.6); }
      }
    `;
    document.head.appendChild(style);
  } else {
    notification.style.animation = '';
  }
  
  notification.style.display = 'block';
  
  // Auto-hide after delay
  const hideDelay = isError ? 8000 : 5000;
  setTimeout(hideNotification, hideDelay);
}

// Hide notification with animation
function hideNotification() {
  notification.style.opacity = '0';
  notification.style.transform = 'translateX(100%)';
  
  setTimeout(() => {
    notification.style.display = 'none';
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  }, 500);
}