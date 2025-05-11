// API Base URL
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

// Event Listeners
document.addEventListener('DOMContentLoaded', loadDiscounts);
discountForm.addEventListener('submit', handleFormSubmit);
cancelBtn.addEventListener('click', resetForm);
searchInput.addEventListener('input', filterDiscounts);
closeNotification.addEventListener('click', () => hideNotification());

// Tab navigation
tabBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const tabId = btn.getAttribute('data-tab');

    // Remove active class from all buttons and tabs
    tabBtns.forEach((b) => b.classList.remove('active'));
    tabContents.forEach((t) => t.classList.remove('active'));

    // Add active class to current button and tab
    btn.classList.add('active');
    document.getElementById(`${tabId}-tab`).classList.add('active');

    if (tabId === 'form') {
      resetForm();
    }
  });
});

// Load all discounts
async function loadDiscounts() {
  try {
    const response = await fetch(`${API_BASE_URL}`);
    const result = await response.json();

    if (result.success) {
      renderDiscountTable(result.data);
      showNotification(`${result.data.length} discounts loaded successfully`);
    } else {
      showNotification(result.message || 'Failed to load discounts', true);
      renderDiscountTable([]);
    }
  } catch (error) {
    console.error('Error loading discounts:', error);
    showNotification('Error connecting to the server', true);
    renderDiscountTable([]);
  }
}

// Render discount table
function renderDiscountTable(discounts) {
  discountTableBody.innerHTML = '';

  if (!discounts || discounts.length === 0) {
    discountTableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center;">No discounts found</td>
            </tr>
        `;
    return;
  }

  discounts.forEach((discount) => {
    const startDate = new Date(discount.startDate).toLocaleString();
    const endDate = new Date(discount.endDate).toLocaleString();

    const tr = document.createElement('tr');
    tr.innerHTML = `
            <td>${discount.id}</td>
            <td>${discount.bookId}</td>
            <td>${discount.discountPercentage}%</td>
            <td>${startDate}</td>
            <td>${endDate}</td>
            <td>${discount.onSale ? 'Yes' : 'No'}</td>
            <td>${discount.isActive ? 'Yes' : 'No'}</td>
            <td>
                <button class="action-btn edit-btn" data-id="${
                  discount.id
                }">Edit</button>
                <button class="action-btn delete-btn" data-id="${
                  discount.id
                }">Delete</button>
            </td>
        `;

    discountTableBody.appendChild(tr);
  });

  // Add event listeners to action buttons
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

// Filter discounts based on search input
function filterDiscounts() {
  const searchTerm = searchInput.value.toLowerCase();
  const rows = discountTableBody.querySelectorAll('tr');

  rows.forEach((row) => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? '' : 'none';
  });
}

// Handle form submission (create or update)
async function handleFormSubmit(event) {
  event.preventDefault();

  const startDate = new Date(startDateInput.value);
  const endDate = new Date(endDateInput.value);

  if (startDate >= endDate) {
    showNotification('Start date must be before end date', true);
    return;
  }

  // Ensure correct data format for API
  const discountData = {
    bookId: parseInt(bookIdInput.value),
    discountPercentage: parseFloat(discountPercentageInput.value),
    startDate: startDateInput.value, // Make sure this is in the correct format (yyyy-MM-dd)
    endDate: endDateInput.value, // Make sure this is in the correct format (yyyy-MM-dd)
    onSale: onSaleInput.checked,
    isActive: isActiveInput.checked
  };

  // For a new discount (POST request)
  const url = API_BASE_URL; // Make sure this points to your discount API endpoint

  try {
    console.log('Sending data:', discountData); // Debug: log the data being sent

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(discountData)
    });

    console.log('Response status:', response.status); // Debug: log the HTTP status

    const result = await response.json();
    console.log('Response data:', result); // Debug: log the response data

    if (result.success) {
      showNotification(result.message);
      loadDiscounts();
      resetForm();

      // Switch to list tab
      tabBtns[0].click();
    } else {
      showNotification(result.message || 'Operation failed', true);
    }
  } catch (error) {
    console.error('Error saving discount:', error);
    showNotification('Error connecting to the server', true);
  }
}

// Edit discount
async function editDiscount(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    const result = await response.json();

    if (result.success) {
      const discount = result.data;

      // Format dates for datetime-local input
      const startDate = new Date(discount.startDate);
      const endDate = new Date(discount.endDate);

      // Format to YYYY-MM-DDThh:mm
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      // Populate form fields
      discountIdInput.value = discount.id;
      bookIdInput.value = discount.bookId;
      discountPercentageInput.value = discount.discountPercentage;
      startDateInput.value = formatDate(startDate);
      endDateInput.value = formatDate(endDate);
      onSaleInput.checked = discount.onSale;
      isActiveInput.checked = discount.isActive;

      // Update form title
      formTitle.textContent = `Edit Discount #${discount.id}`;

      // Switch to form tab
      tabBtns[1].click();
    } else {
      showNotification(
        result.message || 'Failed to load discount details',
        true
      );
    }
  } catch (error) {
    console.error('Error loading discount details:', error);
    showNotification('Error connecting to the server', true);
  }
}

// Delete discount
async function deleteDiscount(id) {
  if (!confirm(`Are you sure you want to delete discount #${id}?`)) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (result.success) {
      showNotification(result.message);
      loadDiscounts();
    } else {
      showNotification(result.message || 'Failed to delete discount', true);
    }
  } catch (error) {
    console.error('Error deleting discount:', error);
    showNotification('Error connecting to the server', true);
  }
}

// Reset form
function resetForm() {
  discountForm.reset();
  discountIdInput.value = '';
  formTitle.textContent = 'Add New Discount';

  // Set default dates
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
}

// Show notification
function showNotification(message, isError = false) {
  notificationMessage.textContent = message;
  notification.className = 'notification';

  if (isError) {
    notification.classList.add('error');
  }

  notification.style.display = 'block';

  // Auto-hide after 5 seconds
  setTimeout(hideNotification, 5000);
}

// Hide notification
function hideNotification() {
  notification.style.display = 'none';
}
