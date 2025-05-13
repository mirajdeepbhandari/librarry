function fetchDiscountedBooks() {
    const token = sessionStorage.getItem("authToken");
    const booksGrid = document.querySelector(".books-grid");
    booksGrid.innerHTML = "<div class='loading'>Loading discounted books...</div>";

    fetch("http://localhost:5085/api/DiscountFilter", {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
        .then((response) => {
            if (!response.ok) throw new Error("Failed to fetch discounted books.");
            return response.json();
        })
        .then((data) => {
            const booksArray = Array.isArray(data.data) ? data.data : [];

            if (booksArray.length === 0) {
                booksGrid.innerHTML = "<div class='no-books'>No discounted books available at the moment.</div>";
                return;
            }

            booksGrid.innerHTML = ""; // Clear loading

            booksArray.forEach((book) => {
                const {
                    id,
                    title,
                    authorName,
                    price,
                    format,
                    discountedPrice,
                    discountPercentage,
                    coverImageUrl,
                    quantityInStock
                } = book;

                const bookElement = document.createElement("div");
                bookElement.className = "book";
                bookElement.setAttribute("data-id", id);

                const imageUrl = coverImageUrl || "https://source.unsplash.com/random/300x450/?book";

                bookElement.innerHTML = `
                    <div class="deal-badge">${discountPercentage}% OFF</div>
                    <div class="book-category">${format || "Paperback"}</div>
                    <div class="book-cover" style="background-image: url('${imageUrl}')"></div>
                    <div class="book-info">
                        <h3>${title || "Untitled"}</h3>
                        <p>${authorName || "Unknown Author"}</p>
                        <div class="book-meta">
                            <div>Genre</div>
                            <div class="discount-percentage">${discountPercentage}% OFF</div>
                            <div>
                                <span class="original-price">$${price.toFixed(2)}</span> $${discountedPrice.toFixed(2)}
                            </div>
                        </div>
                        <div class="book-status available">In Stock (${quantityInStock})</div>
                        
                `;

                // Navigate to product detail on click
                bookElement.addEventListener("click", () => {
                    window.location.href = `product-detail.html?id=${id}`;
                });

                booksGrid.appendChild(bookElement);
            });
        })
        .catch((error) => {
            console.error("Error loading discounted books:", error);
            booksGrid.innerHTML = `
                <div class="error-message">
                    <p>Failed to load discounted books. Please try again later.</p>
                    <button class="retry-btn">Retry</button>
                </div>
            `;
            document.querySelector(".retry-btn").addEventListener("click", fetchDiscountedBooks);
        });
}

// Call the function when the DOM is ready
document.addEventListener("DOMContentLoaded", fetchDiscountedBooks);
