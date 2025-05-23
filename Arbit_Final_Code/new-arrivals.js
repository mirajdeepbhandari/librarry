// Function to fetch and display new arrival books
function fetchBooks() {
    const token = sessionStorage.getItem("authToken");
    const booksGrid = document.querySelector(".books-grid");
    booksGrid.innerHTML = "<div class='loading'>Loading new arrivals...</div>";

    // Fetch all books from the API
    fetch("http://localhost:5085/api/Book/GetAllBooks", {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then((data) => {
            const booksArray = Array.isArray(data) ? data : data.data || [];
            const newArrivals = booksArray.filter((book) => book.newArrival === true);
            displayBooks(newArrivals);
        })
        .catch((error) => {
            console.error("Error fetching new arrivals:", error);
            booksGrid.innerHTML = `
                <div class="error-message">
                    <p>Failed to load new arrivals. Please try again later.</p>
                    <button class="retry-btn">Retry</button>
                </div>
            `;

            document.querySelector(".retry-btn").addEventListener("click", fetchBooks);
        });
}

// Function to display books in the grid
function displayBooks(books) {
    const booksGrid = document.querySelector(".books-grid");
    booksGrid.innerHTML = "";

    if (!books || books.length === 0) {
        booksGrid.innerHTML = `<div class="no-books">No new arrivals found.</div>`;
        return;
    }

    books.forEach((book) => {
        const bookElement = document.createElement("div");
        bookElement.className = "book";
        bookElement.setAttribute("data-id", book.id || "");

        const hasDiscount = book.discountPercentage && book.discountPercentage > 0;
        const originalPrice = book.price || 0;
        const discountedPrice = hasDiscount
            ? ((originalPrice * (100 - book.discountPercentage)) / 100).toFixed(2)
            : originalPrice.toFixed(2);

        const priceDisplay = hasDiscount
            ? `<s>$${originalPrice.toFixed(2)}</s> $${discountedPrice}`
            : `$${originalPrice.toFixed(2)}`;

        const coverImage = book.coverImageUrl || "https://source.unsplash.com/random/300x450/?book";
        const inStock = book.inventory && book.inventory.quantityInStock > 0;
        const quantity = book.inventory?.quantityInStock ?? "N/A";

        const stockStatus = inStock
            ? `<div class="book-status available">In Stock (${quantity})</div>`
            : `<div class="book-status unavailable">Out of Stock</div>`;

        const newArrivalBadge = book.newArrival ? `<div class="new-arrival-badge">New Arrival</div>` : "";

        const category = book.category || "General";
        const title = book.title || "Untitled Book";
        const author = book.authorName || "Unknown Author";
        const arrivalDate = book.arrivalDate ? `Arrived: ${new Date(book.arrivalDate).toDateString()}` : "";

        bookElement.innerHTML = `
            ${newArrivalBadge}
            <div class="book-category">${book.format || "Paperback"}</div>
            <div class="book-cover" style="background-image: url('${coverImage}')"></div>
            <div class="book-info">
                <div class="arrival-date">${arrivalDate}</div>
                <h3>${title}</h3>
                <p>${author}</p>
                <div class="book-meta">
                    <div>${category}</div>
                    <div>${priceDisplay}</div>
                </div>
                ${stockStatus}
                
                
            </div>
        `;

        // Navigate to product detail page when the book (not the button) is clicked
        bookElement.addEventListener("click", () => {
            const bookId = book.id;
            window.location.href = `product-detail.html?id=${bookId}`;
        });

        // Add to Cart button: stop propagation and redirect to cart.html
        const addToCartBtn = bookElement.querySelector(".book-btn.primary");
        if (addToCartBtn && inStock) {
            addToCartBtn.addEventListener("click", (event) => {
                event.stopPropagation(); // Prevent bookElement click
                // Optionally store book ID or data to cart (localStorage/session)
                window.location.href = "cart.html";
            });
        }

        booksGrid.appendChild(bookElement);
    });
}

// Fetch books on page load
document.addEventListener("DOMContentLoaded", fetchBooks);
