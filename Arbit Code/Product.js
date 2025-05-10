const API_URL = 'http://localhost:5085/api/Book'; // Base URL for BookController

let currentPage = 1;
let pageSize = 10;
let searchQuery = '';
let saveInProgress = false;

document.addEventListener('DOMContentLoaded', () => {
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

  // Initialize toast container
  if (!document.getElementById('toast-container')) {
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  loadBooks();
});

// Toast notification function
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-message">${message}</span>
      <button class="toast-close">&times;</button>
    </div>
  `;

  document.getElementById('toast-container').appendChild(toast);

  // Add close button functionality
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.classList.add('toast-hiding');
    setTimeout(() => toast.remove(), 300);
  });

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add('toast-hiding');
      setTimeout(() => toast.remove(), 300);
    }
  }, 5000);
}

async function loadBooks() {
  try {
    // Show loading indicator
    const tbody = document.querySelector('#books-table tbody');
    tbody.innerHTML =
      '<tr><td colspan="5" class="loading-message">Loading books...</td></tr>';

    const response = await fetch(
      `${API_URL}/GetAllBooks?draw=${1}&start=${
        (currentPage - 1) * pageSize
      }&length=${pageSize}&search=${encodeURIComponent(searchQuery)}`
    );

    if (!response.ok) throw new Error('Failed to fetch books');

    const data = await response.json();

    tbody.innerHTML = '';

    if (data.data.length === 0) {
      // Display a message when no books are found
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="5" class="no-data-message">No books found. Add a new book or try a different search.</td>
      `;
      tbody.appendChild(tr);
    } else {
      // Display the books
      data.data.forEach((book) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${book.title}</td>
          <td>${book.authorName}</td>
          <td>${book.isbn}</td>
          <td>$${book.price.toFixed(2)}</td>
          <td>
            <button onclick="editBookHelper(${book.id})">Edit</button>
            <button onclick="deleteBook(${book.id})">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Update pagination info
    document.getElementById('current-page').textContent = currentPage;

    // Disable/enable pagination buttons based on data
    const prevButton = document.getElementById('prev-page');
    prevButton.disabled = currentPage <= 1;
    prevButton.classList.toggle('disabled', currentPage <= 1);

    const nextButton = document.getElementById('next-page');
    const hasMorePages = data.data.length === pageSize;
    nextButton.disabled = !hasMorePages;
    nextButton.classList.toggle('disabled', !hasMorePages);
  } catch (error) {
    console.error(error);
    showToast('Error loading books.', 'error');
  }
}

// Use this helper to avoid stringified objects in HTML
window.editBookHelper = async function (id) {
  try {
    // Show loading state
    document.getElementById('form-section').classList.add('loading');

    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) throw new Error('Book not found');
    const book = await response.json();

    editBook(book.data); // Adjust based on backend structure

    // Scroll to form
    document
      .getElementById('form-section')
      .scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    console.error(error);
    showToast('Failed to load book details.', 'error');
  } finally {
    document.getElementById('form-section').classList.remove('loading');
  }
};

async function saveBook(e) {
  e.preventDefault();

  // Prevent double submission
  if (saveInProgress) return;

  const saveBtn = document.querySelector('#book-form button[type="submit"]');
  const originalBtnText = saveBtn.textContent;

  try {
    saveInProgress = true;
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;

    const id = document.getElementById('book-id').value;
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/${id}` : `${API_URL}/create`;

    // Validate image size before submission
    const coverImage = document.getElementById('coverImage').files[0];
    if (coverImage && coverImage.size > 10485760) {
      // 10MB limit
      throw new Error(
        'Cover image is too large. Please use an image under 10MB.'
      );
    }

    const formData = new FormData();
    formData.append('ISBN', document.getElementById('isbn').value);
    formData.append('Title', document.getElementById('title').value);
    formData.append(
      'Description',
      document.getElementById('description').value
    );
    formData.append('AuthorName', document.getElementById('authorName').value);
    formData.append(
      'PublisherName',
      document.getElementById('publisherName').value
    );
    formData.append('Price', document.getElementById('price').value);
    formData.append('Format', document.getElementById('format').value);
    formData.append('Language', document.getElementById('language').value);
    formData.append(
      'PublicationDate',
      document.getElementById('publicationDate').value
    );
    formData.append('PageCount', document.getElementById('pageCount').value);
    formData.append(
      'IsBestseller',
      document.getElementById('isBestseller').checked
    );
    formData.append(
      'IsAwardWinner',
      document.getElementById('isAwardWinner').checked
    );
    formData.append(
      'IsNewRelease',
      document.getElementById('isNewRelease').checked
    );
    formData.append('IsActive', document.getElementById('isActive').checked);

    if (coverImage) {
      formData.append('CoverImage', coverImage);
    }

    const response = await fetch(url, {
      method,
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to save book');
    }

    showToast(
      id ? 'Book updated successfully!' : 'Book created successfully!',
      'success'
    );
    resetForm();
    loadBooks();
  } catch (error) {
    console.error(error);
    showToast(error.message || 'Failed to save book.', 'error');
  } finally {
    saveInProgress = false;
    saveBtn.textContent = originalBtnText;
    saveBtn.disabled = false;
  }
}

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

  // Format the date properly
  if (book.publicationDate) {
    const date = new Date(book.publicationDate);
    if (!isNaN(date.getTime())) {
      document.getElementById('publicationDate').value = date
        .toISOString()
        .split('T')[0];
    }
  }

  document.getElementById('pageCount').value = book.pageCount;
  document.getElementById('isBestseller').checked = book.isBestseller;
  document.getElementById('isAwardWinner').checked = book.isAwardWinner;
  document.getElementById('isNewRelease').checked = book.isNewRelease;
  document.getElementById('isActive').checked = book.isActive;

  // Update form section title
  document.querySelector('#form-section h2').textContent = 'Edit Book';
}

// Create a toast container if it doesn't exist
function ensureToastContainer() {
  if (!document.getElementById('toast-container')) {
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }
}

// Show a toast message
function showToast(message, type = 'info', duration = 3000) {
  ensureToastContainer();
  const toastContainer = document.getElementById('toast-container');

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  toast.innerHTML = `
    <div class="toast-content">
      <div class="toast-message">${message}</div>
      <button class="toast-close">&times;</button>
    </div>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.classList.add('toast-hiding');
    setTimeout(() => toastContainer.removeChild(toast), 300);
  });

  toastContainer.appendChild(toast);

  if (duration) {
    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add('toast-hiding');
        setTimeout(() => {
          if (toast.parentElement) {
            toastContainer.removeChild(toast);
          }
        }, 300);
      }
    }, duration);
  }

  return toast;
}

// Show a modern confirmation dialog
function showConfirmDialog(message, title, onConfirm, onCancel) {
  // Create modal container
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';
  modalOverlay.style.position = 'fixed';
  modalOverlay.style.top = '0';
  modalOverlay.style.left = '0';
  modalOverlay.style.right = '0';
  modalOverlay.style.bottom = '0';
  modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  modalOverlay.style.zIndex = '1000';
  modalOverlay.style.display = 'flex';
  modalOverlay.style.justifyContent = 'center';
  modalOverlay.style.alignItems = 'center';

  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.className = 'confirm-dialog';
  modalContent.style.backgroundColor = 'white';
  modalContent.style.borderRadius = '8px';
  modalContent.style.boxShadow = 'var(--shadow)';
  modalContent.style.width = '90%';
  modalContent.style.maxWidth = '400px';
  modalContent.style.padding = '0';
  modalContent.style.overflow = 'hidden';
  modalContent.style.animation = 'fadeInScale 0.3s ease';

  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInScale {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
    
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  // Create header
  const header = document.createElement('div');
  header.style.backgroundColor = 'var(--secondary-color)';
  header.style.color = 'white';
  header.style.padding = '15px 20px';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';

  const titleElement = document.createElement('h3');
  titleElement.textContent = title || 'Confirm Action';
  titleElement.style.margin = '0';
  titleElement.style.fontSize = '18px';

  const closeButton = document.createElement('button');
  closeButton.innerHTML = '&times;';
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.color = 'white';
  closeButton.style.fontSize = '24px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.padding = '0 5px';
  closeButton.style.lineHeight = '1';

  header.appendChild(titleElement);
  header.appendChild(closeButton);

  // Create body
  const body = document.createElement('div');
  body.style.padding = '20px';

  const messageElement = document.createElement('p');
  messageElement.textContent = message;
  messageElement.style.margin = '0 0 20px 0';
  messageElement.style.fontSize = '16px';

  body.appendChild(messageElement);

  // Create footer with buttons
  const footer = document.createElement('div');
  footer.style.display = 'flex';
  footer.style.justifyContent = 'flex-end';
  footer.style.padding = '15px 20px';
  footer.style.borderTop = '1px solid #eee';
  footer.style.gap = '10px';

  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'Cancel';
  cancelButton.style.padding = '8px 16px';
  cancelButton.style.backgroundColor = '#e0e0e0';
  cancelButton.style.color = '#333';
  cancelButton.style.border = 'none';
  cancelButton.style.borderRadius = '4px';
  cancelButton.style.cursor = 'pointer';
  cancelButton.style.fontWeight = '500';

  const confirmButton = document.createElement('button');
  confirmButton.textContent = 'Delete';
  confirmButton.style.padding = '8px 16px';
  confirmButton.style.backgroundColor = 'var(--accent-color)';
  confirmButton.style.color = 'white';
  confirmButton.style.border = 'none';
  confirmButton.style.borderRadius = '4px';
  confirmButton.style.cursor = 'pointer';
  confirmButton.style.fontWeight = '500';

  footer.appendChild(cancelButton);
  footer.appendChild(confirmButton);

  // Assemble modal
  modalContent.appendChild(header);
  modalContent.appendChild(body);
  modalContent.appendChild(footer);
  modalOverlay.appendChild(modalContent);

  // Add to document
  document.body.appendChild(modalOverlay);

  // Function to close the modal
  const closeModal = () => {
    modalOverlay.style.animation = 'fadeOut 0.3s';
    setTimeout(() => {
      if (document.body.contains(modalOverlay)) {
        document.body.removeChild(modalOverlay);
      }
    }, 300);
  };

  // Add event listeners
  closeButton.addEventListener('click', () => {
    closeModal();
    if (onCancel) onCancel();
  });

  cancelButton.addEventListener('click', () => {
    closeModal();
    if (onCancel) onCancel();
  });

  confirmButton.addEventListener('click', () => {
    closeModal();
    if (onConfirm) onConfirm();
  });

  // Close on backdrop click
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
      if (onCancel) onCancel();
    }
  });

  // Return the modal element
  return modalOverlay;
}

// Updated deleteBook function that uses a modern confirmation dialog
async function deleteBook(id) {
  // Replace the confirm() with our custom dialog
  showConfirmDialog(
    'Are you sure you want to delete this book? This action cannot be undone.',
    'Confirm Delete',
    // onConfirm callback
    async () => {
      try {
        // Show loading state on the table row
        const rows = document.querySelectorAll('#books-table tbody tr');
        for (let row of rows) {
          const cells = row.querySelectorAll('td');
          if (cells.length > 4) {
            const buttons = cells[4].querySelectorAll('button');
            if (
              buttons[1] &&
              buttons[1].onclick.toString().includes(`deleteBook(${id})`)
            ) {
              row.classList.add('deleting');
              break;
            }
          }
        }

        const response = await fetch(`${API_URL}/${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete book');

        showToast('Book deleted successfully!', 'success');
        loadBooks();
      } catch (error) {
        console.error(error);
        showToast('Failed to delete book.', 'error');

        // Remove loading state
        const rows = document.querySelectorAll('#books-table tbody tr');
        for (let row of rows) {
          row.classList.remove('deleting');
        }
      }
    },
    // onCancel callback - nothing needed here
    () => {}
  );
}

function resetForm() {
  document.getElementById('book-form').reset();
  document.getElementById('book-id').value = '';
  document.querySelector('#form-section h2').textContent = 'Add Book';
}
