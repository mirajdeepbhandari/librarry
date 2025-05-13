// Constants for API endpoints
const API_URL = 'http://localhost:5085/api';
const ENDPOINTS = {
  PURCHASED_BOOKS: `${API_URL}/Cart/paid`,
  REVIEWS: `${API_URL}/Review`,
  BOOK_REVIEWS: (bookId) => `${API_URL}/Review/book/${bookId}`,
  REVIEW_BY_ID: (id) => `${API_URL}/Review/${id}`
};

// DOM Elements
const elements = {
  booksList: document.getElementById('books-list'),
  reviewFormContainer: document.getElementById('review-form-container'),
  reviewForm: document.getElementById('review-form'),
  selectedBookCover: document.getElementById('selected-book-cover'),
  selectedBookTitle: document.getElementById('selected-book-title'),
  selectedBookAuthor: document.getElementById('selected-book-author'),
  bookIdInput: document.getElementById('book-id'),
  reviewIdInput: document.getElementById('review-id'),
  ratingInput: document.getElementById('rating-value'),
  commentInput: document.getElementById('comment'),
  starRating: document.querySelector('.star-rating'),
  cancelReviewBtn: document.getElementById('cancel-review'),
  submitReviewBtn: document.getElementById('submit-review'),
  myReviews: document.getElementById('my-reviews'),
  reviewsList: document.getElementById('reviews-list'),
  messageContainer: document.getElementById('message-container')
};

// State Management
const state = {
  purchasedBooks: [],
  userReviews: [],
  currentBookId: null,
  isEditMode: false,
  currentRating: 0
};

// API Calls
const api = {
  async getPurchasedBooks() {
    try {
      const response = await fetch(ENDPOINTS.PURCHASED_BOOKS);
      if (!response.ok) throw new Error('Failed to fetch purchased books');

      const data = await response.json();
      // Extract users and their purchases from the response
      if (data.success && data.users) {
        // Flatten the purchases from all users to a single array
        let allPurchases = [];
        data.users.forEach((user) => {
          if (user.purchases && Array.isArray(user.purchases)) {
            allPurchases = [...allPurchases, ...user.purchases];
          }
        });
        return allPurchases;
      }
      return [];
    } catch (error) {
      showMessage('Error loading purchased books', 'error');
      console.error('Error fetching purchased books:', error);
      return [];
    }
  },

  async getBookReviews(bookId) {
    try {
      const response = await fetch(ENDPOINTS.BOOK_REVIEWS(bookId));
      if (!response.ok) throw new Error('Failed to fetch book reviews');

      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      showMessage('Error loading book reviews', 'error');
      console.error('Error fetching book reviews:', error);
      return [];
    }
  },

  async getUserReviews() {
    try {
      // This is a simplified approach - in a real app you'd filter by user ID on the server
      const response = await fetch(ENDPOINTS.REVIEWS);
      if (!response.ok) throw new Error('Failed to fetch user reviews');

      const data = await response.json();
      const allReviews = data.success ? data.data : [];

      // We'll filter on the client side for demo purposes
      // In a real app, have an endpoint that returns only the current user's reviews
      return allReviews.filter((review) => {
        // This assumes the backend populates the reviews with user info
        // Adjust as needed based on your actual API response
        return review.isCurrentUser === true;
      });
    } catch (error) {
      showMessage('Error loading your reviews', 'error');
      console.error('Error fetching user reviews:', error);
      return [];
    }
  },

  async submitReview(reviewData) {
    try {
      const options = {
        method: state.isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewData)
      };

      const url = state.isEditMode
        ? ENDPOINTS.REVIEW_BY_ID(state.currentReviewId)
        : ENDPOINTS.REVIEWS;

      const response = await fetch(url, options);

      // Check if the response has content before trying to parse it
      const contentType = response.headers.get('content-type');
      if (
        contentType &&
        contentType.indexOf('application/json') !== -1 &&
        response.status !== 204
      ) {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to submit review');
        }

        return {
          success: data.success,
          data: data.data,
          message: data.message
        };
      } else {
        // Handle empty responses or non-JSON responses
        if (!response.ok) {
          throw new Error(
            `Failed to submit review. Status: ${response.status}`
          );
        }

        // For successful empty responses (like 204 No Content)
        return {
          success: true,
          data: null,
          message: 'Review submitted successfully'
        };
      }
    } catch (error) {
      showMessage(error.message || 'Error submitting review', 'error');
      console.error('Error submitting review:', error);
      return { success: false };
    }
  },

  async deleteReview(reviewId) {
    try {
      const response = await fetch(ENDPOINTS.REVIEW_BY_ID(reviewId), {
        method: 'DELETE'
      });

      // Check if the response has content before trying to parse it
      const contentType = response.headers.get('content-type');
      if (
        contentType &&
        contentType.indexOf('application/json') !== -1 &&
        response.status !== 204
      ) {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to delete review');
        }

        return { success: data.success, message: data.message };
      } else {
        // Handle empty responses or non-JSON responses
        if (!response.ok) {
          throw new Error(
            `Failed to delete review. Status: ${response.status}`
          );
        }

        // For successful empty responses (like 204 No Content)
        return {
          success: true,
          message: 'Review deleted successfully'
        };
      }
    } catch (error) {
      showMessage(error.message || 'Error deleting review', 'error');
      console.error('Error deleting review:', error);
      return { success: false };
    }
  }
};

// UI Rendering
const ui = {
  renderPurchasedBooks(books) {
    if (books.length === 0) {
      elements.booksList.innerHTML =
        '<p class="no-books">You haven\'t purchased any books yet.</p>';
      return;
    }

    elements.booksList.innerHTML = books
      .map(
        (book) => `
            <div class="book-card" data-book-id="${book.bookId}">
                <div class="book-cover">
                    <img src="${
                      book.book.coverImageUrl || '/images/placeholder-cover.jpg'
                    }" alt="${book.book.title}">
                </div>
                <div class="book-info">
                    <h4 class="book-title">${book.book.title}</h4>
                    <p class="book-author">by ${book.book.authorName}</p>
                    <p class="book-price">${parseFloat(book.book.price).toFixed(
                      2
                    )}</p>
                    <div class="book-action">
                        <button class="btn-primary write-review-btn" data-book-id="${
                          book.bookId
                        }">
                            ${book.hasReviewed ? 'Edit Review' : 'Write Review'}
                        </button>
                    </div>
                </div>
            </div>
        `
      )
      .join('');

    // Add event listeners to the review buttons
    document.querySelectorAll('.write-review-btn').forEach((button) => {
      button.addEventListener('click', (e) => {
        const bookId = parseInt(e.target.dataset.bookId);
        ui.openReviewForm(bookId);
      });
    });
  },

  async openReviewForm(bookId) {
    state.currentBookId = bookId;
    state.isEditMode = false;

    // Find the book in our state
    const book = state.purchasedBooks.find((p) => p.bookId === bookId);
    if (!book) return;

    // Reset form
    elements.reviewForm.reset();
    elements.ratingInput.value = '';
    ui.updateStarRating(0);

    // Set selected book info
    elements.selectedBookCover.src =
      book.book.coverImageUrl || '/images/placeholder-cover.jpg';
    elements.selectedBookTitle.textContent = book.book.title;
    elements.selectedBookAuthor.textContent = `by ${book.book.authorName}`;
    elements.bookIdInput.value = bookId;

    // Check if user has already reviewed this book
    const existingReview = state.userReviews.find((r) => r.bookId === bookId);
    if (existingReview) {
      state.isEditMode = true;
      state.currentReviewId = existingReview.id;
      elements.reviewIdInput.value = existingReview.id;
      elements.commentInput.value = existingReview.comment;
      ui.updateStarRating(existingReview.rating);
    }

    // Show the form
    elements.reviewFormContainer.classList.remove('hidden');
    window.scrollTo({
      top: elements.reviewFormContainer.offsetTop,
      behavior: 'smooth'
    });
  },

  updateStarRating(rating) {
    state.currentRating = rating;
    elements.ratingInput.value = rating;

    const stars = elements.starRating.querySelectorAll('i');
    stars.forEach((star, index) => {
      if (index < rating) {
        star.classList.add('active');
      } else {
        star.classList.remove('active');
      }
    });
  },

  renderUserReviews(reviews) {
    if (reviews.length === 0) {
      elements.myReviews.classList.add('hidden');
      return;
    }

    elements.reviewsList.innerHTML = reviews
      .map((review) => {
        // Find the corresponding book
        const book = state.purchasedBooks.find(
          (p) => p.bookId === review.bookId
        );
        if (!book) return ''; // Skip if book not found

        const stars = Array(5)
          .fill(0)
          .map(
            (_, i) =>
              `<i class="fas fa-star ${i < review.rating ? 'active' : ''}"></i>`
          )
          .join('');

        const reviewDate = new Date(review.reviewDate).toLocaleDateString();

        return `
                <div class="review-item" data-review-id="${review.id}">
                    <div class="review-book">
                        <img src="${
                          book.book.coverImageUrl ||
                          '/images/placeholder-cover.jpg'
                        }" alt="${book.book.title}">
                        <div>
                            <h4>${book.book.title}</h4>
                            <p>${book.book.authorName}</p>
                        </div>
                    </div>
                    <div class="review-meta">
                        <div class="review-stars">${stars}</div>
                        <div class="review-date">Reviewed on ${reviewDate}</div>
                    </div>
                    <div class="review-content">
                        <p>${review.comment}</p>
                    </div>
                    <div class="review-actions">
                        <button class="btn-secondary edit-review-btn" data-book-id="${
                          review.bookId
                        }">Edit</button>
                        <button class="btn-secondary delete-review-btn" data-review-id="${
                          review.id
                        }">Delete</button>
                    </div>
                </div>
            `;
      })
      .join('');

    // Add event listeners
    document.querySelectorAll('.edit-review-btn').forEach((button) => {
      button.addEventListener('click', (e) => {
        const bookId = parseInt(e.target.dataset.bookId);
        ui.openReviewForm(bookId);
      });
    });

    document.querySelectorAll('.delete-review-btn').forEach((button) => {
      button.addEventListener('click', async (e) => {
        if (confirm('Are you sure you want to delete this review?')) {
          const reviewId = parseInt(e.target.dataset.reviewId);
          const result = await api.deleteReview(reviewId);
          if (result.success) {
            await loadData();
            showMessage('Review deleted successfully', 'success');
          }
        }
      });
    });

    elements.myReviews.classList.remove('hidden');
  },

  closeReviewForm() {
    elements.reviewFormContainer.classList.add('hidden');
    elements.reviewForm.reset();
    state.currentBookId = null;
    state.isEditMode = false;
  }
};

// Event Handlers
function setupEventListeners() {
  // Star rating
  elements.starRating.querySelectorAll('i').forEach((star) => {
    star.addEventListener('click', (e) => {
      const rating = parseInt(e.target.dataset.rating);
      ui.updateStarRating(rating);
    });

    star.addEventListener('mouseover', (e) => {
      const rating = parseInt(e.target.dataset.rating);
      const stars = elements.starRating.querySelectorAll('i');
      stars.forEach((s, index) => {
        if (index < rating) {
          s.classList.add('active');
        } else {
          s.classList.remove('active');
        }
      });
    });

    star.addEventListener('mouseout', () => {
      ui.updateStarRating(state.currentRating);
    });
  });

  // Cancel review button
  elements.cancelReviewBtn.addEventListener('click', () => {
    ui.closeReviewForm();
  });

  // Review form submission
  elements.reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const bookId = parseInt(elements.bookIdInput.value);
    const rating = parseInt(elements.ratingInput.value);
    const comment = elements.commentInput.value.trim();

    if (!bookId || !rating || !comment) {
      showMessage('Please fill in all fields', 'error');
      return;
    }

    const reviewData = {
      bookId,
      rating,
      comment
    };

    const result = await api.submitReview(reviewData);
    if (result.success) {
      ui.closeReviewForm();
      await loadData();
      showMessage(
        state.isEditMode
          ? 'Review updated successfully'
          : 'Review submitted successfully',
        'success'
      );
    }
  });
}

// Utility Functions
function showMessage(message, type = 'success') {
  const messageElement = document.createElement('div');
  messageElement.className = `message message-${type}`;
  messageElement.innerHTML = `
        ${message}
        <button class="close-message">&times;</button>
    `;

  elements.messageContainer.appendChild(messageElement);

  // Add close button functionality
  const closeBtn = messageElement.querySelector('.close-message');
  closeBtn.addEventListener('click', () => {
    messageElement.style.animation = 'fadeOut 0.3s forwards';
    setTimeout(() => {
      elements.messageContainer.removeChild(messageElement);
    }, 300);
  });

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (elements.messageContainer.contains(messageElement)) {
      messageElement.style.animation = 'fadeOut 0.3s forwards';
      setTimeout(() => {
        if (elements.messageContainer.contains(messageElement)) {
          elements.messageContainer.removeChild(messageElement);
        }
      }, 300);
    }
  }, 5000);
}

// Initialize Data
async function loadData() {
  // Show loading state
  elements.booksList.innerHTML =
    '<div class="loading">Loading your purchased books...</div>';

  // Load purchased books
  state.purchasedBooks = await api.getPurchasedBooks();

  // Load user's reviews
  state.userReviews = await api.getUserReviews();

  // Mark books that have been reviewed
  state.purchasedBooks.forEach((book) => {
    book.hasReviewed = state.userReviews.some(
      (review) => review.bookId === book.bookId
    );
  });

  // Render UI
  ui.renderPurchasedBooks(state.purchasedBooks);
  ui.renderUserReviews(state.userReviews);
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadData();
});
