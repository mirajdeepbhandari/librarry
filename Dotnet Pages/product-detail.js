
document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const bookId = params.get("id");

    if (!bookId) return alert("Book ID missing in URL");

    try {
        const response = await fetch(`http://localhost:5085/api/Book/${bookId}`);
        const result = await response.json();

        if (!result.success) throw new Error("Failed to fetch book");

        const book = result.data;

        // Images
        document.getElementById("main-product-image").src = book.coverImageUrl;
        document.querySelector(".thumbnail img").src = book.coverImageUrl;
        document.querySelector(".thumbnail").dataset.img = book.coverImageUrl;

        // Text Fields
        document.querySelector(".product-title").textContent = book.title;
        document.querySelector(".product-author a").textContent = book.authorName;
        document.querySelector(".product-price").textContent = `$${book.price}`;
        document.getElementById("publisher").textContent = book.publisherName;
        document.getElementById("isbn").textContent = book.isbn;
        document.getElementById("book-description").textContent = book.description || "No description available.";

        const pubDate = new Date(book.publicationDate);
        document.getElementById("pub-date").textContent = pubDate.toLocaleDateString();

        // Availability
        const availability = document.querySelector(".product-availability");
        if (book.inventory.isAvailable) {
            availability.innerHTML = `<i class="fas fa-check-circle"></i> In Stock`;
        } else {
            availability.innerHTML = `<i class="fas fa-times-circle"></i> Out of Stock`;
        }

    } catch (error) {
        console.error("Error fetching book:", error);
    }
});

