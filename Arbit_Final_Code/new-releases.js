// Function to fetch and display new release books
// function fetchBooks() {
//     const token = sessionStorage.getItem("authToken");
//     if (!token) {
//         console.error("No authentication token found.");
//         return;
//     }

//     const booksGrid = document.querySelector(".books-grid");
//     booksGrid.innerHTML = "<div class='loading'>Loading new releases...</div>";

//     // Fetch all books from the API
//     fetch("http://localhost:5085/api/Book/GetAllBooks", {
//         method: 'GET',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//         }
//     })
//         .then((response) => {
//             console.log("Response Status:", response.status);
//             if (!response.ok) {
//                 throw new Error("Network response was not ok");
//             }
//             return response.json();
//         })
//         .then((data) => {
//             const booksArray = Array.isArray(data) ? data : data.data || [];
//             const newReleases = booksArray.filter((book) => book.isNewRelease === true);
//             displayBooks(newReleases);
//         })
//         .catch((error) => {
//             console.error("Error fetching new releases:", error);
//             booksGrid.innerHTML = `
//                 <div class="error-message">
//                     <p>Failed to load new releases. Please try again later.</p>
//                     <button class="retry-btn">Retry</button>
//                 </div>
//             `;

//             // Add retry button event listener
//             document.querySelector(".retry-btn").addEventListener("click", fetchBooks);
//         });
// }


// Function to display books in the grid
function displayBooks(books) {
    
    const booksGrid = document.querySelector(".books-grid");
    booksGrid.innerHTML = "";

    if (!books || books.length === 0) {
        booksGrid.innerHTML = `
            <div class="no-books">No new releases found.</div>
        `;
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

        const newReleaseBadge = book.isNewRelease
            ? `<div class="new-release-badge">New Release</div>`
            : "";

        const category = book.category || "General";
        const title = book.title || "Untitled Book";
        const author = book.authorName || "Unknown Author";
        const releaseDate = book.releaseDate ? `Released: ${new Date(book.releaseDate).toDateString()}` : "";

        bookElement.innerHTML = `
            ${newReleaseBadge}
            <div class="book-category">${book.format || "Paperback"}</div>
            <div class="book-cover" style="background-image: url('${coverImage}')"></div>
            <div class="book-info">
                <div class="release-date">${releaseDate}</div>
                <h3>${title}</h3>
                <p>${author}</p>
                <div class="book-meta">
                    <div>${category}</div>
                    <div>${priceDisplay}</div>
                </div>
                ${stockStatus}

               
                
            </div>
        `;

        booksGrid.appendChild(bookElement);
    });
}

function fetchBooks() {
    const token = sessionStorage.getItem("authToken");
    const booksGrid = document.querySelector(".books-grid");
    booksGrid.innerHTML = "<div class='loading'>Loading new releases...</div>";

    fetch("http://localhost:5085/api/Book/GetAllBooks", {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
        .then((response) => {
            if (!response.ok) throw new Error("Network response was not ok");
            return response.json();
        })

        
        .then((data) => {
            const booksArray = Array.isArray(data.data) ? data.data : [];
            const newReleases = booksArray.filter((book) => book.isNewRelease === true);

            if (newReleases.length === 0) {
                booksGrid.innerHTML = "<div class='no-books'>No new releases available.</div>";
                return;
            }

            booksGrid.innerHTML = "";

            newReleases.forEach((book) => {
                const {
                    id,
                    title,
                    authorName,
                    price,
                    format,
                    coverImageUrl,
                    inventory
                } = book;

                const quantityInStock = inventory?.quantityInStock ?? 0;
                const isAvailable = inventory?.isAvailable ?? false;

                const bookDiv = document.createElement("div");
                bookDiv.className = "book";

                bookDiv.innerHTML = `
                    <div class="book-category">${format || "Unknown Genre"}</div>
                    <div class="book-cover" style="background-image: url('${coverImageUrl || "https://source.unsplash.com/random/200x300/?book,new"}')"></div>
                    <div class="book-info">
                        <h3>${title}</h3>
                        <p>${authorName}</p>
                        <div class="book-meta">
                            <div>$${price.toFixed(2)}</div>
                        </div>
                        <div class="book-status ${isAvailable ? "available" : "unavailable"}">
                            ${isAvailable ? "In Stock" : "Out of Stock"}
                        </div>
                       
                        
                    </div>
                `;

                // ✅ Navigate to product detail on click
                bookDiv.addEventListener("click", () => {
                    window.location.href = `product-detail.html?id=${id}`;
                });

                 
                

                booksGrid.appendChild(bookDiv);
            });
        })
        .catch((error) => {
            console.error("Error fetching new releases:", error);
            booksGrid.innerHTML = `
                <div class="error-message">
                    <p>Failed to load new releases. Please try again later.</p>
                    <button class="retry-btn">Retry</button>
                </div>
            `;
            document.querySelector(".retry-btn").addEventListener("click", fetchBooks);
        });
}




document.addEventListener("DOMContentLoaded", fetchBooks);



