import {
  getToken,
  getUserRole,
  getUserInfoFromToken,
  isTokenExpired,
  clearSession
} from './sessionStorage.js';

const API_BASE_URL = 'http://localhost:5085/api';
const token = getToken();
const userInfo = getUserInfoFromToken();

// DOM Elements
const cartItemsContainer = document.getElementById('cart-items');
const subtotalSpan = document.getElementById('subtotal');
const taxSpan = document.getElementById('tax');
const totalSpan = document.getElementById('total');
const checkoutBtn = document.getElementById('checkout-btn');
const cancelCartBtn = document.getElementById('cancel-cart-btn');
const emptyMessage = document.getElementById('cart-empty-message');
const cartContent = document.getElementById('cart-content');
const toast = document.getElementById('notification-toast');
const toastMessage = document.getElementById('toast-message');
const toastIcon = document.getElementById('toast-icon');
const paymentTotal = document.getElementById('payment-total');

// Auth Check
if (!token || isTokenExpired()) {
  clearSession();
  window.location.href = '../index.html';
}

// Load cart on DOM ready
window.addEventListener('DOMContentLoaded', loadCart);

// Event Listeners
cancelCartBtn.addEventListener('click', cancelCart);
checkoutBtn.addEventListener('click', placeOrder);

async function loadCart() {
  try {
    const res = await fetch(`${API_BASE_URL}/Cart`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    const cart = data.cart || data.Cart;

    if (!data.success || !cart || !cart.cartItems || cart.cartItems.length === 0) {
      cartContent.classList.add('hidden');
      emptyMessage.classList.remove('hidden');
      return;
    }

    const items = cart.cartItems;
    renderCartItems(items);
    calculateSummary(items);
  } catch (err) {
    showToast('Failed to load cart', 'error');
  }
}

function renderCartItems(items) {
  cartItemsContainer.innerHTML = '';
  items.forEach((item) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${item.book.coverImageUrl}" alt="${item.book.title}" width="50" /></td>
      <td>${item.book.title}</td>
      <td>Rs ${item.book.price.toFixed(2)}</td>
      <td>${item.quantity}</td>
      <td>Rs ${(item.quantity * item.book.price).toFixed(2)}</td>
      <td><button class="remove-btn" data-id="${item.id}"><i class="fas fa-trash"></i></button></td>
    `;
    cartItemsContainer.appendChild(tr);
  });

  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const itemId = e.currentTarget.dataset.id;
      await removeCartItem(itemId);
    });
  });
}

function calculateSummary(items) {
  let subtotal = 0;
  items.forEach(item => {
    subtotal += item.quantity * item.book.price;
  });

  const tax = subtotal * 0.07;
  const total = subtotal + tax;

  subtotalSpan.textContent = `Rs ${subtotal.toFixed(2)}`;
  taxSpan.textContent = `Rs ${tax.toFixed(2)}`;
  totalSpan.textContent = `Rs ${total.toFixed(2)}`;
  paymentTotal.textContent = `Rs ${total.toFixed(2)}`;
}

async function removeCartItem(itemId) {
  try {
    const res = await fetch(`${API_BASE_URL}/Cart/remove/${itemId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const data = await res.json();
    showToast(data.message || 'Item removed', 'success');
    loadCart();
  } catch {
    showToast('Failed to remove item', 'error');
  }
}

async function cancelCart() {
  try {
    const res = await fetch(`${API_BASE_URL}/Cart/cancel`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const data = await res.json();
    showToast(data.message || 'Cart canceled', 'success');
    loadCart();
  } catch {
    showToast('Failed to cancel cart', 'error');
  }
}

async function placeOrder() {
  try {
    checkoutBtn.disabled = true;
    checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    const res = await fetch(`${API_BASE_URL}/Order/place`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Failed to place order.');

    showToast(`Order placed! Claim Code: ${data.claimCode}`, 'success');

    cartItemsContainer.innerHTML = '';
    subtotalSpan.textContent = 'Rs 0.00';
    taxSpan.textContent = 'Rs 0.00';
    totalSpan.textContent = 'Rs 0.00';
    cartContent.classList.add('hidden');
    emptyMessage.classList.remove('hidden');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    checkoutBtn.disabled = false;
    checkoutBtn.innerHTML = 'Make Payment';
  }
}

function showToast(message, type = 'info') {
  toastMessage.textContent = message;
  toastIcon.className = 'fas ' + (type === 'success'
    ? 'fa-check-circle'
    : type === 'error'
    ? 'fa-times-circle'
    : 'fa-info-circle');
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}
