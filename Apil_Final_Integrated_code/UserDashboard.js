// Global variables to store book data and filter state
let allBooks = [];
let currentFilters = {
    authors: [],
    formats: [],
    languages: [],
    availability: [],
    minPrice: 0,
    maxPrice: 1000,
    isBestseller: false,
    isAwardWinner: false,
    isNewRelease: false,
    newArrival: false,
    commingSoon: false
};

// Function to fetch books from API
function fetchBooks(page = 1) {
    const booksContainer = document.getElementById('books-container');
    const paginationContainer = document.getElementById('pagination-container');
    
    // Show loading spinner
    booksContainer.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
        </div>
    `;
    
    // Fetch books from API
    fetch('http://localhost:5085/api/Book/GetAllBooks')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Store all books for filtering
            allBooks = data.data;
            
            // Initialize filters based on available data
            initializeFilters();
            
            // Render all books initially
            renderBooks(allBooks);
            
            // Render pagination if needed
            if (data.recordsTotal > 12) {
                renderPagination(data.recordsTotal, page);
            } else {
                paginationContainer.innerHTML = '';
            }
        })
        .catch(error => {
            console.error('Error fetching books:', error);
            booksContainer.innerHTML = `
                <div class="error-message">
                    <h4>Oops! Something went wrong</h4>
                    <p>We couldn't load the books. Please try again later.</p>
                    <button class="filter-btn apply" onclick="fetchBooks()">Try Again</button>
                </div>
            `;
        });
}

// Function to render books on the page
function renderBooks(books) {
    const booksContainer = document.getElementById('books-container');
    
    if (books.length === 0) {
        booksContainer.innerHTML = `
            <div class="no-results">
                <h4>No books found</h4>
                <p>Try adjusting your filters to see more results.</p>
            </div>
        `;
        return;
    }
    
    let booksHTML = '';
    
    books.forEach(book => {
        // Format price to have 2 decimal places
        const formattedPrice = book.price.toFixed(2);
        
        // Check if book is available
        const availabilityStatus = book.inventory.isAvailable ? 
            `<span class="available">In Stock (${book.inventory.quantityInStock})</span>` : 
            '<span class="unavailable">Out of Stock</span>';
        
        // Create badges for special statuses
        let badgesHTML = '';
        if (book.isBestseller) badgesHTML += '<span class="badge bestseller">Bestseller</span>';
        if (book.isAwardWinner) badgesHTML += '<span class="badge award">Award Winner</span>';
        if (book.isNewRelease) badgesHTML += '<span class="badge new-release">New Release</span>';
        if (book.newArrival) badgesHTML += '<span class="badge new-arrival">New Arrival</span>';
        if (book.commingSoon) badgesHTML += '<span class="badge coming-soon">Coming Soon</span>';
        
        booksHTML += `
            <div class="book">
                <div class="book-cover">
                    <img src="${book.coverImageUrl}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/150x225?text=No+Cover'">
                    ${badgesHTML}
                </div>
                <div class="book-details">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">By ${book.authorName}</p>
                    <p class="book-format">${book.format} | ${book.pageCount} pages | ${book.language}</p>
                    <p class="book-isbn">ISBN: ${book.isbn}</p>
                    <p class="book-description">${book.description.substring(0, 100)}${book.description.length > 100 ? '...' : ''}</p>
                    <div class="book-bottom">
                        <div class="book-price">$${formattedPrice}</div>
                        <div class="book-availability">${availabilityStatus}</div>
                    </div>
                    <div class="book-actions">
                        <button class="add-to-cart-btn">Add to Cart</button>
                        <button class="view-details-btn" onclick="viewBookDetails(${book.id})">View Details</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    booksContainer.innerHTML = booksHTML;
}

// Function to initialize filters based on available data
function initializeFilters() {
    // Extract unique values for each filter
    const authors = [...new Set(allBooks.map(book => book.authorName))];
    const formats = [...new Set(allBooks.map(book => book.format))];
    const languages = [...new Set(allBooks.map(book => book.language))];
    
    // Find min and max prices
    const prices = allBooks.map(book => book.price);
    const minPrice = Math.floor(Math.min(...prices));
    const maxPrice = Math.ceil(Math.max(...prices));
    
    // Update price inputs
    document.getElementById('min-price1').value = minPrice;
    document.getElementById('min-price1').min = minPrice;
    document.getElementById('max-price1').value = maxPrice;
    document.getElementById('max-price1').max = maxPrice;
    currentFilters.minPrice = minPrice;
    currentFilters.maxPrice = maxPrice;
    
    // Populate author filter options
    const authorOptionsContainer = document.querySelector('.filter-group1:nth-child(1) .filter-options1');
    authorOptionsContainer.innerHTML = '';
    authors.forEach(author => {
        authorOptionsContainer.innerHTML += `
            <label class="filter-option1">
                <input type="checkbox" name="author" value="${author}"> ${author}
            </label>
        `;
    });
    
    // Populate format filter options
    const formatOptionsContainer = document.querySelector('.filter-subgroup1:nth-child(2) .filter-options1');
    formatOptionsContainer.innerHTML = '';
    formats.forEach(format => {
        formatOptionsContainer.innerHTML += `
            <label class="filter-option1">
                <input type="checkbox" name="format" value="${format}"> ${format}
            </label>
        `;
    });
    
    // Populate language filter options
    const languageOptionsContainer = document.querySelector('.filter-subgroup1:nth-child(1) .filter-options1');
    languageOptionsContainer.innerHTML = '';
    languages.forEach(language => {
        languageOptionsContainer.innerHTML += `
            <label class="filter-option1">
                <input type="checkbox" name="language" value="${language}"> ${language}
            </label>
        `;
    });
    
    // Set up special category filters
    const categoriesContainer = document.querySelector('.filter-group1:nth-child(2) .filter-options1');
    categoriesContainer.innerHTML = `
        <label class="filter-option1"><input type="checkbox" name="category" value="bestseller"> Bestsellers</label>
        <label class="filter-option1"><input type="checkbox" name="category" value="award-winner"> Award Winners</label>
        <label class="filter-option1"><input type="checkbox" name="category" value="new-release"> New Releases</label>
        <label class="filter-option1"><input type="checkbox" name="category" value="new-arrival"> New Arrivals</label>
        <label class="filter-option1"><input type="checkbox" name="category" value="coming-soon"> Coming Soon</label>
    `;
    
    // Set up event listeners for filters
    setupFilterEventListeners();
}

// Function to set up event listeners for filters
function setupFilterEventListeners() {
    // Author checkboxes
    document.querySelectorAll('input[name="author"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateFilterState();
        });
    });
    
    // Format checkboxes
    document.querySelectorAll('input[name="format"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateFilterState();
        });
    });
    
    // Language checkboxes
    document.querySelectorAll('input[name="language"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateFilterState();
        });
    });
    
    // Category checkboxes
    document.querySelectorAll('input[name="category"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateFilterState();
        });
    });
    
    // Availability checkboxes
    document.querySelectorAll('input[name="availability"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateFilterState();
        });
    });
    
    // Price range inputs
    document.getElementById('min-price1').addEventListener('input', () => {
        updateFilterState();
    });
    
    document.getElementById('max-price1').addEventListener('input', () => {
        updateFilterState();
    });
    
    // Apply button
    document.querySelector('.filter-btn1.apply1').addEventListener('click', () => {
        applyFilters();
    });
    
    // Reset button
    document.querySelector('.filter-btn1.reset1').addEventListener('click', () => {
        resetFilters();
    });
}

// Function to update the filter state based on user selections
function updateFilterState() {
    // Update author filters
    currentFilters.authors = Array.from(document.querySelectorAll('input[name="author"]:checked'))
        .map(checkbox => checkbox.value);
    
    // Update format filters
    currentFilters.formats = Array.from(document.querySelectorAll('input[name="format"]:checked'))
        .map(checkbox => checkbox.value);
    
    // Update language filters
    currentFilters.languages = Array.from(document.querySelectorAll('input[name="language"]:checked'))
        .map(checkbox => checkbox.value);
    
    // Update availability filters
    currentFilters.availability = Array.from(document.querySelectorAll('input[name="availability"]:checked'))
        .map(checkbox => checkbox.value);
    
    // Update price range
    currentFilters.minPrice = parseFloat(document.getElementById('min-price1').value) || 0;
    currentFilters.maxPrice = parseFloat(document.getElementById('max-price1').value) || 1000;
    
    // Update category filters
    const categoryCheckboxes = document.querySelectorAll('input[name="category"]:checked');
    currentFilters.isBestseller = Array.from(categoryCheckboxes).some(cb => cb.value === 'bestseller');
    currentFilters.isAwardWinner = Array.from(categoryCheckboxes).some(cb => cb.value === 'award-winner');
    currentFilters.isNewRelease = Array.from(categoryCheckboxes).some(cb => cb.value === 'new-release');
    currentFilters.newArrival = Array.from(categoryCheckboxes).some(cb => cb.value === 'new-arrival');
    currentFilters.commingSoon = Array.from(categoryCheckboxes).some(cb => cb.value === 'coming-soon');
}

// Function to apply filters to the book data
function applyFilters() {
    let filteredBooks = [...allBooks];
    
    // Filter by authors
    if (currentFilters.authors.length > 0) {
        filteredBooks = filteredBooks.filter(book => 
            currentFilters.authors.includes(book.authorName)
        );
    }
    
    // Filter by formats
    if (currentFilters.formats.length > 0) {
        filteredBooks = filteredBooks.filter(book => 
            currentFilters.formats.includes(book.format)
        );
    }
    
    // Filter by languages
    if (currentFilters.languages.length > 0) {
        filteredBooks = filteredBooks.filter(book => 
            currentFilters.languages.includes(book.language)
        );
    }
    
    // Filter by availability
    if (currentFilters.availability.length > 0) {
        filteredBooks = filteredBooks.filter(book => {
            if (currentFilters.availability.includes('in-stock')) {
                return book.inventory.isAvailable;
            } else if (currentFilters.availability.includes('out-of-stock')) {
                return !book.inventory.isAvailable;
            }
            return true;
        });
    }
    
    // Filter by price range
    filteredBooks = filteredBooks.filter(book => 
        book.price >= currentFilters.minPrice && 
        book.price <= currentFilters.maxPrice
    );
    
    // Filter by categories
    if (currentFilters.isBestseller || 
        currentFilters.isAwardWinner || 
        currentFilters.isNewRelease || 
        currentFilters.newArrival || 
        currentFilters.commingSoon) {
        
        filteredBooks = filteredBooks.filter(book => 
            (currentFilters.isBestseller ? book.isBestseller : false) ||
            (currentFilters.isAwardWinner ? book.isAwardWinner : false) ||
            (currentFilters.isNewRelease ? book.isNewRelease : false) ||
            (currentFilters.newArrival ? book.newArrival : false) ||
            (currentFilters.commingSoon ? book.commingSoon : false)
        );
    }
    
    // Render filtered books
    renderBooks(filteredBooks);
}

// Function to reset all filters
function resetFilters() {
    // Uncheck all checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Reset price range
    const minPriceInput = document.getElementById('min-price1');
    const maxPriceInput = document.getElementById('max-price1');
    minPriceInput.value = minPriceInput.min;
    maxPriceInput.value = maxPriceInput.max;
    
    // Reset filter state
    currentFilters = {
        authors: [],
        formats: [],
        languages: [],
        availability: [],
        minPrice: parseFloat(minPriceInput.min) || 0,
        maxPrice: parseFloat(maxPriceInput.max) || 1000,
        isBestseller: false,
        isAwardWinner: false,
        isNewRelease: false,
        newArrival: false,
        commingSoon: false
    };
    
    // Render all books
    renderBooks(allBooks);
}

// Function to render pagination
function renderPagination(total, currentPage) {
    const paginationContainer = document.getElementById('pagination-container');
    const totalPages = Math.ceil(total / 12); // Assuming 12 books per page
    
    let paginationHTML = '<div class="pagination">';
    
    // Previous button
    paginationHTML += `
        <button class="page-btn prev ${currentPage === 1 ? 'disabled' : ''}" 
            ${currentPage === 1 ? 'disabled' : `onclick="fetchBooks(${currentPage - 1})"`}>
            &laquo; Previous
        </button>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <button class="page-btn number ${i === currentPage ? 'active' : ''}" 
                onclick="fetchBooks(${i})">
                ${i}
            </button>
        `;
    }
    
    // Next button
    paginationHTML += `
        <button class="page-btn next ${currentPage === totalPages ? 'disabled' : ''}" 
            ${currentPage === totalPages ? 'disabled' : `onclick="fetchBooks(${currentPage + 1})"`}>
            Next &raquo;
        </button>
    `;
    
    paginationHTML += '</div>';
    paginationContainer.innerHTML = paginationHTML;
}

// Function to view book details (placeholder)
function viewBookDetails(bookId) {
    alert(`View details for book ID: ${bookId}`);
    // You can implement a modal or redirect to a details page
}

// Initialize the book store
document.addEventListener('DOMContentLoaded', () => {
    fetchBooks();
});