document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('auth_token'); // Assuming JWT is stored in localStorage
  const userId = localStorage.getItem('user_id'); // Or get from claims

  const cartItemsContainer = document.getElementById('cart-items');
  const cartEmptyMessage = document.getElementById('cart-empty-message');
  const subtotalEl = document.getElementById('subtotal');
  const taxEl = document.getElementById('tax');
  const totalEl = document.getElementById('total');
  const paymentTotalEl = document.getElementById('payment-total');

  const checkoutBtn = document.getElementById('checkout-btn');
  const cancelCartBtn = document.getElementById('cancel-cart-btn');

  const paymentModal = document.getElementById('payment-modal');
  const closeModalBtn = document.querySelector('.close-modal');
  const confirmPaymentBtn = document.getElementById('confirm-payment-btn');
  const modalCloseBtns = document.querySelectorAll('.close-modal-btn');

  const toast = document.getElementById('notification-toast');
  const toastIcon = document.getElementById('toast-icon');
  const toastMessage = document.getElementById('toast-message');

  let cartData = [];

  // Show Toast Notification
  function showToast(message, success = true) {
    toastIcon.className = `fas ${
      success ? 'fa-check-circle' : 'fa-exclamation-circle'
    }`;
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }

  // Load Cart Items
  async function loadCart() {
    try {
      const res = await fetch('/api/cart', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!data.success) {
        cartEmptyMessage.classList.remove('hidden');
        cartItemsContainer.innerHTML = '';
        updateSummary(0);
        return;
      }

      cartData = data.Cart.Items || [];
      renderCart(cartData);
    } catch (err) {
      console.error(err);
      showToast('Failed to load cart.', false);
    }
  }

  // Render Cart Items
  function renderCart(items) {
    if (items.length === 0) {
      cartEmptyMessage.classList.remove('hidden');
      cartItemsContainer.innerHTML = '';
      updateSummary(0);
      return;
    }

    cartEmptyMessage.classList.add('hidden');
    cartItemsContainer.innerHTML = '';

    items.forEach((item) => {
      const row = document.createElement('tr');
      row.innerHTML = `
                <td><img src="${item.Book.CoverImage}" alt="${
        item.Book.Title
      }" width="50"></td>
                <td>${item.Book.Title}</td>
                <td>$${parseFloat(item.Book.Price).toFixed(2)}</td>
                <td>
                    <input type="number" min="1" value="${
                      item.Quantity
                    }" class="quantity-input" data-id="${item.Id}">
                </td>
                <td class="item-total">$${(
                  item.Book.Price * item.Quantity
                ).toFixed(2)}</td>
                <td>
                    <button class="action-btn remove-btn" data-id="${
                      item.Id
                    }"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
      cartItemsContainer.appendChild(row);
    });

    updateSummary(items.reduce((sum, i) => sum + i.Book.Price * i.Quantity, 0));
    setupEventListeners();
  }

  // Setup Event Listeners for quantity inputs and remove buttons
  function setupEventListeners() {
    document.querySelectorAll('.quantity-input').forEach((input) => {
      input.addEventListener('change', handleQuantityChange);
    });

    document.querySelectorAll('.remove-btn').forEach((btn) => {
      btn.addEventListener('click', handleRemoveItem);
    });
  }

  // Handle Quantity Change
  async function handleQuantityChange(e) {
    const itemId = parseInt(e.target.dataset.id);
    const newQty = parseInt(e.target.value);

    if (newQty < 1) {
      e.target.value = 1;
      return;
    }

    try {
      const res = await fetch(`/api/cart/update/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: newQty })
      });

      const data = await res.json();
      if (data.success) {
        showToast('Cart updated.');
        loadCart();
      } else {
        showToast('Failed to update cart.', false);
      }
    } catch (err) {
      console.error(err);
      showToast('Error updating cart.', false);
    }
  }

  // Handle Remove Item
  async function handleRemoveItem(e) {
    const itemId = parseInt(e.target.closest('button').dataset.id);

    try {
      const res = await fetch(`/api/cart/remove/${itemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (data.success) {
        showToast('Item removed.');
        loadCart();
      } else {
        showToast('Failed to remove item.', false);
      }
    } catch (err) {
      console.error(err);
      showToast('Error removing item.', false);
    }
  }

  // Update Subtotal, Tax, Total
  function updateSummary(total) {
    const tax = total * 0.07;
    const grandTotal = total + tax;

    subtotalEl.textContent = `$${total.toFixed(2)}`;
    taxEl.textContent = `$${tax.toFixed(2)}`;
    totalEl.textContent = `$${grandTotal.toFixed(2)}`;
    paymentTotalEl.textContent = `$${grandTotal.toFixed(2)}`;
  }

  // Open Payment Modal
  checkoutBtn.addEventListener('click', () => {
    if (cartData.length === 0) {
      showToast('Your cart is empty.', false);
      return;
    }
    paymentModal.classList.add('active');
  });

  // Close Payment Modal
  function closePaymentModal() {
    paymentModal.classList.remove('active');
  }

  closeModalBtn.addEventListener('click', closePaymentModal);
  modalCloseBtns.forEach((btn) => {
    btn.addEventListener('click', closePaymentModal);
  });

  // Confirm Payment
  confirmPaymentBtn.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/cart/make-payment', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (data.success) {
        showToast('Payment successful!');
        closePaymentModal();
        loadCart();
      } else {
        showToast('Payment failed.', false);
      }
    } catch (err) {
      console.error(err);
      showToast('Error processing payment.', false);
    }
  });

  // Cancel Cart
  cancelCartBtn.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/cart/cancel', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (data.success) {
        showToast('Cart canceled.');
        loadCart();
      } else {
        showToast('Failed to cancel cart.', false);
      }
    } catch (err) {
      console.error(err);
      showToast('Error canceling cart.', false);
    }
  });

  // Initial Load
  loadCart();
});
