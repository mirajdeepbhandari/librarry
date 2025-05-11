// Function to fetch and display coming soon books
function fetchComingSoonBooks() {
    const booksGrid = document.querySelector(".books-grid");
    booksGrid.innerHTML = "<div class='loading'>Loading coming soon titles...</div>";

    fetch("http://localhost:5085/api/Book/GetAllBooks")
        .then((response) => {
            if (!response.ok) throw new Error("Network error while fetching books.");
            return response.json();
        })
        .then((data) => {
            const booksArray = Array.isArray(data) ? data : data.data || [];
            const comingSoonBooks = booksArray.filter((book) => book.commingSoon === true);
            displayComingSoonBooks(comingSoonBooks);
        })
        .catch((error) => {
            console.error("Error:", error);
            booksGrid.innerHTML = `
                <div class="error-message">
                    <p>Failed to load coming soon books. Try again later.</p>
                    <button class="retry-btn">Retry</button>
                </div>
            `;
            document.querySelector(".retry-btn").addEventListener("click", fetchComingSoonBooks);
        });
}

// Function to display coming soon books
function displayComingSoonBooks(books) {
    const booksGrid = document.querySelector(".books-grid");
    booksGrid.innerHTML = "";

    if (!books || books.length === 0) {
        booksGrid.innerHTML = `<div class="no-books">No upcoming books at the moment.</div>`;
        return;
    }

    books.forEach((book) => {
        const bookElement = document.createElement("div");
        bookElement.className = "book";
        bookElement.setAttribute("data-id", book.id || "");

        const coverImage = book.coverImageUrl || "https://source.unsplash.com/random/300x450/?book";

        const releaseDateText = book.releaseDate
            ? `Releasing: ${new Date(book.releaseDate).toDateString()}`
            : "";

        const category = book.category || "General";
        const title = book.title || "Untitled Book";
        const author = book.authorName || "Unknown Author";
        const price = book.price ? `$${book.price.toFixed(2)}` : "N/A";

        bookElement.innerHTML = `
            <div class="coming-soon-badge">Coming Soon</div>
            <div class="book-category">${book.format || "Paperback"}</div>
            <div class="book-cover" style="background-image: url('${coverImage}')"></div>
            <div class="book-info">
                <div class="release-date">${releaseDateText}</div>
                <h3>${title}</h3>
                <p>${author}</p>
                <div class="book-meta">
                    <div>${category}</div>
                    <div>${price}</div>
                </div>
            </div>
        `;

        booksGrid.appendChild(bookElement);
    });
}

// Fetch coming soon books when DOM is ready
document.addEventListener("DOMContentLoaded", fetchComingSoonBooks);
