let globalBookId = null; 
let globalBookTitle = "";

document.addEventListener("DOMContentLoaded", async () => {
    const token = sessionStorage.getItem("authToken");
    const params = new URLSearchParams(window.location.search);
    const bookId = params.get("id");

    if (!bookId) return alert("Book ID missing in URL");

    try {
        const response = await fetch(`http://localhost:5085/api/Book/${bookId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch book. Status: " + response.status);
        }

        const result = await response.json();
        if (!result.success) throw new Error("Failed to fetch book");

        const book = result.data;
        globalBookId = book.id;
        globalBookTitle = book.title;

        // Populate UI with book info...
        document.getElementById("main-product-image").src = book.coverImageUrl;
        document.querySelector(".thumbnail img").src = book.coverImageUrl;
        document.querySelector(".thumbnail").dataset.img = book.coverImageUrl;
        document.querySelector(".product-title").textContent = book.title;
        document.querySelector(".product-author a").textContent = book.authorName;
        document.querySelector(".product-price").textContent = `$${book.price}`;
        document.getElementById("publisher").textContent = book.publisherName;
        document.getElementById("isbn").textContent = book.isbn;
        document.getElementById("book-description").textContent = book.description || "No description available.";
        document.getElementById("pub-date").textContent = new Date(book.publicationDate).toLocaleDateString();

        const availability = document.querySelector(".product-availability");
        availability.innerHTML = book.inventory.isAvailable
            ? `<i class="fas fa-check-circle"></i> In Stock`
            : `<i class="fas fa-times-circle"></i> Out of Stock`;

    } catch (error) {
        console.error("Error fetching book:", error);
        alert("Failed to load book details. Please try again later.");
    }
});

document.getElementById("add-to-cart-btn").addEventListener("click", () => {
    const quantity = parseInt(document.getElementById("quantity").value);
    if (!globalBookId || isNaN(quantity) || quantity < 1) {
        alert("Invalid quantity or book not loaded.");
        return;
    }

    addToCart(globalBookId, quantity, globalBookTitle);
});


async function addToCart(bookId, quantity, bookTitle) {
    const token = sessionStorage.getItem("authToken");

    try {
        const response = await fetch(`http://localhost:5085/api/Cart/add?bookId=${bookId}&quantity=${quantity}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const text = await response.text(); // capture raw error response
            throw new Error(`Server returned ${response.status}. Message: ${text}`);
        }

        const result = await response.json(); // Only attempt if you know the server returns JSON
        if (!result.success) {
            throw new Error(result.message || 'Failed to add to cart.');
        }

        const messageDiv = document.getElementById("cart-message");
        messageDiv.style.color = "green";
        messageDiv.textContent = `${quantity} x "${bookTitle}" added to cart successfully!`;


    } catch (error) {
        console.error("Error adding to cart:", error);
        alert("Something went wrong while adding to cart.\n" + error.message);
    }
}


document.addEventListener("DOMContentLoaded", function () {
    const quantityInput = document.getElementById("quantity");
    const decreaseBtn = document.getElementById("decrease-qty");
    const increaseBtn = document.getElementById("increase-qty");

    decreaseBtn.addEventListener("click", () => {
        let current = parseInt(quantityInput.value);
        if (current > 1) {
            quantityInput.value = current - 1;
        }
    });

    increaseBtn.addEventListener("click", () => {
        let current = parseInt(quantityInput.value);
        quantityInput.value = current + 1;
    });
});
