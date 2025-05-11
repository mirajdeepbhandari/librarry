// Function to fetch books from the API
function fetchBooks() {
    const booksGrid = document.querySelector(".books-grid");
    booksGrid.innerHTML = "<div class='loading'>Loading bestsellers...</div>";

    // Fetch all books from the API
    fetch("http://localhost:5085/api/Book/GetAllBooks")
        .then((response) => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then((data) => {
            const booksArray = Array.isArray(data) ? data : data.data || [];
            const bestsellers = booksArray.filter((book) => book.isBestseller === true);
            displayBooks(bestsellers);
        })
        .catch((error) => {
            console.error("Error fetching bestsellers:", error);
            booksGrid.innerHTML = `
                <div class="error-message">
                    <p>Failed to load bestsellers. Please try again later.</p>
                    <button class="retry-btn">Retry</button>
                </div>
            `;

            // Add retry button event listener
            document.querySelector(".retry-btn").addEventListener("click", fetchBooks);
        });
}

// Function to display books in the grid
function displayBooks(books) {
    const booksGrid = document.querySelector(".books-grid");
    booksGrid.innerHTML = "";

    if (!books || books.length === 0) {
        booksGrid.innerHTML = '<div class="no-books">No bestsellers found matching your criteria.</div>';
        return;
    }

    books.forEach((book) => {
        const bookElement = document.createElement("div");
        bookElement.className = "book-card";

        // Handle discount
        const hasDiscount = book.discountPercentage && book.discountPercentage > 0;
        const originalPrice = book.price || 0;
        const discountedPrice = hasDiscount
            ? ((originalPrice * (100 - book.discountPercentage)) / 100).toFixed(2)
            : originalPrice.toFixed(2);

        const priceDisplay = hasDiscount
            ? `<s>$${originalPrice.toFixed(2)}</s> $${discountedPrice}`
            : `$${originalPrice.toFixed(2)}`;

        // Stock
        const stockStatus = book.inventory.quantityInStock
            ? '<div class="book-status available">In Stock</div>'
            : '<div class="book-status unavailable">Out of Stock</div>';

        // Cover image fallback
        const coverImage = book.coverImageUrl || "https://source.unsplash.com/random/200x300/?book";

        // Discount badge
        const discountBadge = hasDiscount
            ? `<div class="sale-badge">${book.discountPercentage}% OFF</div>`
            : "";

        // Bestseller badge
        const bestsellerBadge = book.isBestseller
            ? `<div class="bestseller-badge">Bestseller</div>`
            : "";

        bookElement.innerHTML = `
            <div class="book-card-wrapper">
                <div class="book-cover" style="background-image: url('${coverImage}')"></div>
                <div class="book-info">
                    ${bestsellerBadge}
                    <h3 class="book-title">${book.title || "Unknown Title"}</h3>
                    <p class="book-author">${book.authorName || "Unknown Author"}</p>
                    <div class="book-meta">
                        <div class="book-price">${priceDisplay}</div>
                        ${stockStatus}
                    </div>
                    <div class="book-actions">
                        <button class="book-btn primary" ${!book.inventory.quantityInStock ? "disabled" : ""}>
                            ${book.inventory.quantityInStock ? "Add to Cart" : "Out of Stock"}
                        </button>
                    </div>
                    <div class="book-quantity">
                        <small>Quantity: ${book.inventory.quantityInStock ?? "N/A"}</small>
                    </div>
                </div>
            </div>
        `;

       // Add click event to navigate to product detail page
bookElement.addEventListener("click", () => {
    window.location.href = `product-detail.html?id=${book.id}`;
});

booksGrid.appendChild(bookElement);

    });

    // Add event listeners for actions (Add to Cart, Wishlist)
    document.querySelectorAll(".book-btn.primary").forEach((btn) => {
        if (!btn.hasAttribute("disabled")) {
            btn.addEventListener("click", addToCart);
        }
    });

    document.querySelectorAll(".book-btn.secondary").forEach((btn) => {
        btn.addEventListener("click", toggleWishlist);
    });
}

function addToCart(event) {
    event.stopPropagation(); // Prevent triggering parent click
    console.log("Book added to cart!");
    // Navigate to cart page or perform add to cart logic here
    window.location.href = "cart.html"; // or any appropriate cart route
}


// Toggle Wishlist function (temporary placeholder)
function toggleWishlist() {
    console.log("Book added to wishlist!");
}

// Call the fetchBooks function when the page loads
document.addEventListener("DOMContentLoaded", fetchBooks);
