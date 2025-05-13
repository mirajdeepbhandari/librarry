import {
  getToken,
  getUserRole,
  isTokenExpired,
  clearSession
} from './sessionStorage.js';

const API_URL = 'http://localhost:5085/api/Book';
let currentPage = 1;
let pageSize = 10;
let searchQuery = '';
let saveInProgress = false;
let fileInputLabel = '';

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  // Authentication check
  const role = getUserRole();
  if (!getToken() || isTokenExpired() || role !== 'admin') {
    showToast('Unauthorized: Admin access required.', 'error');
    setTimeout(() => {
      clearSession();
      window.location.href = '../index.html';
    }, 2000);
    return;
  }

  // Setup event listeners
  document.getElementById('book-form').addEventListener('submit', saveBook);
  
  document.getElementById('search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    currentPage = 1;
    loadBooks();
  });
  
  document.getElementById('prev-page').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadBooks();
    }
  });
  
  document.getElementById('next-page').addEventListener('click', () => {
    currentPage++;
    loadBooks();
  });
  
  document.getElementById('cancel-btn').addEventListener('click', resetForm);

  // Setup file input label update
  const coverImageInput = document.getElementById('coverImage');
  coverImageInput.addEventListener('change', (e) => {
    const fileName = e.target.files[0]?.name || '';
    const placeholder = coverImageInput.closest('.file-input-wrapper').querySelector('.file-input-placeholder span');
    
    if (fileName) {
      placeholder.textContent = fileName;
      placeholder.classList.add('file-selected');
    } else {
      placeholder.textContent = 'Choose file';
      placeholder.classList.remove('file-selected');
    }
  });

  // Create toast container if it doesn't exist
  if (!document.getElementById('toast-container')) {
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  // Add animation classes to elements
  addEntryAnimations();
  
  // Load initial books
  loadBooks();
});

// Add entry animations to page elements
function addEntryAnimations() {
  const header = document.querySelector('header');
  const formSection = document.getElementById('form-section');
  const tableSection = document.getElementById('table-section');
  
  // Add animation classes
  setTimeout(() => header.classList.add('fade-in'), 100);
  setTimeout(() => formSection.classList.add('fade-in'), 300);
  setTimeout(() => tableSection.classList.add('fade-in'), 500);
}

// Toast notification system
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Add appropriate icon based on type
  let icon = 'info-circle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'error') icon = 'exclamation-circle';
  if (type === 'warning') icon = 'exclamation-triangle';
  
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas fa-${icon} toast-icon"></i>
      <span class="toast-message">${message}</span>
      <button class="toast-close">&times;</button>
    </div>`;
    
  document.getElementById('toast-container').appendChild(toast);
  
  // Add event listener to close button
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.classList.add('toast-hiding');
    setTimeout(() => toast.remove(), 300);
  });
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add('toast-hiding');
      setTimeout(() => toast.remove(), 300);
    }
  }, 5000);
}

// Load books from API
async function loadBooks() {
  const token = getToken();
  const tableBody = document.querySelector('#books-table tbody');
  
  try {
    // Show loading state
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="loading-message">
          <div class="loading-indicator">
            <i class="fas fa-spinner fa-pulse"></i> Loading books...
          </div>
        </td>
      </tr>`;
    
    // Fetch books from API
    const response = await fetch(
      `${API_URL}/GetAllBooks?draw=1&start=${(currentPage - 1) * pageSize}&length=${pageSize}&search=${encodeURIComponent(searchQuery)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) throw new Error('Failed to fetch books.');
    const data = await response.json();
    
    // Clear table
    tableBody.innerHTML = '';

    // Display no books message if no data
    if (data.data.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="no-data-message">
            <i class="fas fa-book-open"></i> No books found. Try adjusting your search.
          </td>
        </tr>`;
    } else {
      // Add books to table
      data.data.forEach(book => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${book.title}</td>
          <td>${book.authorName}</td>
          <td>${book.isbn}</td>
          <td>$${book.price.toFixed(2)}</td>
          <td class="actions-cell">
            <button onclick="editBookHelper(${book.id})"><i class="fas fa-edit"></i> Edit</button>
            <button onclick="deleteBook(${book.id})"><i class="fas fa-trash-alt"></i> Delete</button>
          </td>`;
        tableBody.appendChild(tr);
      });
    }

    // Update pagination
    document.getElementById('current-page').textContent = currentPage;
    document.getElementById('prev-page').disabled = currentPage <= 1;
    document.getElementById('prev-page').classList.toggle('disabled', currentPage <= 1);
    document.getElementById('next-page').disabled = data.data.length < pageSize;
    document.getElementById('next-page').classList.toggle('disabled', data.data.length < pageSize);
    
  } catch (error) {
    console.error(error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="error-message">
          <i class="fas fa-exclamation-triangle"></i> Error loading books. Please try again.
        </td>
      </tr>`;
    showToast('Error loading books.', 'error');
  }
}

// Edit book helper function (exposed to window for button click handlers)
window.editBookHelper = async function(id) {
  const token = getToken();
  try {
    // Add loading class to form section
    const formSection = document.getElementById('form-section');
    formSection.classList.add('loading');
    
    // Update form section header
    document.querySelector('#form-section .panel-header h2').textContent = 'Edit Book';
    
    // Fetch book details
    const response = await fetch(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Failed to fetch book.');
    const result = await response.json();
    
    // Populate form with book data
    editBook(result.data);
    
    // Scroll to form
    document.getElementById('form-section').scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
    
    // Remove loading class
    setTimeout(() => formSection.classList.remove('loading'), 500);
  } catch (error) {
    showToast('Error loading book details.', 'error');
    document.getElementById('form-section').classList.remove('loading');
  }
};

// Save book to API
async function saveBook(e) {
  e.preventDefault();
  if (saveInProgress) return;
  
  saveInProgress = true;
  const token = getToken();
  const saveBtn = document.querySelector('#book-form button[type="submit"]');
  const formSection = document.getElementById('form-section');
  
  // Update button to show saving state
  const originalBtnText = saveBtn.innerHTML;
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  saveBtn.disabled = true;
  formSection.classList.add('loading');

  try {
    // Get form data
    const id = document.getElementById('book-id').value;
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/${id}` : `${API_URL}/create`;
    const formData = new FormData();

    // Append form fields to FormData
    formData.append('ISBN', document.getElementById('isbn').value);
    formData.append('Title', document.getElementById('title').value);
    formData.append('Description', document.getElementById('description').value);
    formData.append('AuthorName', document.getElementById('authorName').value);
    formData.append('PublisherName', document.getElementById('publisherName').value);
    formData.append('Price', document.getElementById('price').value);
    formData.append('Format', document.getElementById('format').value);
    formData.append('Language', document.getElementById('language').value);
    formData.append('PublicationDate', document.getElementById('publicationDate').value);
    formData.append('PageCount', document.getElementById('pageCount').value);
    formData.append('IsBestseller', document.getElementById('isBestseller').checked);
    formData.append('IsAwardWinner', document.getElementById('isAwardWinner').checked);
    formData.append('IsNewRelease', document.getElementById('isNewRelease').checked);
    formData.append('IsActive', document.getElementById('isActive').checked);

    // Append cover image if selected
    const coverImage = document.getElementById('coverImage').files[0];
    if (coverImage) formData.append('CoverImage', coverImage);

    // Send API request
    const response = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to save book.');
    }

    // Show success message
    showToast(id ? 'Book updated successfully!' : 'Book created successfully!', 'success');
    
    // Reset form and reload books
    resetForm();
    loadBooks();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    // Reset button and form state
    saveInProgress = false;
    saveBtn.innerHTML = originalBtnText;
    saveBtn.disabled = false;
    formSection.classList.remove('loading');
  }
}

// Delete book
window.deleteBook = async function(id) {
  const token = getToken();
  
  // Ask for confirmation
  if (!confirm('Are you sure you want to delete this book?')) return;
  
  try {
    // Find and mark the row as deleting
    const rows = document.querySelectorAll('#books-table tbody tr');
    let rowToDelete;
    rows.forEach(row => {
      const rowId = row.querySelector('button:last-child')?.getAttribute('onclick')?.match(/\d+/)?.[0];
      if (rowId == id) {
        rowToDelete = row;
        row.classList.add('deleting');
      }
    });
    
    // Call API to delete book
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Delete failed.');
    
    // Show success message and reload books
    showToast('Book deleted successfully!', 'success');
    
    // Animate row removal then reload data
    if (rowToDelete) {
      rowToDelete.style.height = rowToDelete.offsetHeight + 'px';
      setTimeout(() => {
        rowToDelete.style.height = '0';
        rowToDelete.style.opacity = '0';
        setTimeout(() => loadBooks(), 300);
      }, 100);
    } else {
      loadBooks();
    }
  } catch (error) {
    showToast('Error deleting book.', 'error');
    document.querySelector('#books-table tbody tr.deleting')?.classList.remove('deleting');
  }
};

// Edit book - fill form with book data
function editBook(book) {
  document.getElementById('book-id').value = book.id;
  document.getElementById('isbn').value = book.isbn;
  document.getElementById('title').value = book.title;
  document.getElementById('description').value = book.description;
  document.getElementById('authorName').value = book.authorName;
  document.getElementById('publisherName').value = book.publisherName;
  document.getElementById('price').value = book.price;
  document.getElementById('format').value = book.format;
  document.getElementById('language').value = book.language;
  
  // Format date
  if (book.publicationDate) {
    const date = new Date(book.publicationDate);
    document.getElementById('publicationDate').value = date.toISOString().split('T')[0];
  }
  
  document.getElementById('pageCount').value = book.pageCount;
  document.getElementById('isBestseller').checked = book.isBestseller;
  document.getElementById('isAwardWinner').checked = book.isAwardWinner;
  document.getElementById('isNewRelease').checked = book.isNewRelease;
  document.getElementById('isActive').checked = book.isActive;
  
  // Reset file input
  const fileInput = document.getElementById('coverImage');
  fileInput.value = '';
  const placeholder = fileInput.closest('.file-input-wrapper').querySelector('.file-input-placeholder span');
  placeholder.textContent = 'Choose file';
  placeholder.classList.remove('file-selected');
  
  // Update form section title
  document.querySelector('#form-section .panel-header h2').textContent = 'Edit Book';
}

// Reset form to default state
function resetForm() {
  document.getElementById('book-form').reset();
  document.getElementById('book-id').value = '';
  
  // Reset file input
  const fileInput = document.getElementById('coverImage');
  fileInput.value = '';
  const placeholder = fileInput.closest('.file-input-wrapper').querySelector('.file-input-placeholder span');
  placeholder.textContent = 'Choose file';
  placeholder.classList.remove('file-selected');
  
  // Reset form section title
  document.querySelector('#form-section .panel-header h2').textContent = 'Add Book';
}