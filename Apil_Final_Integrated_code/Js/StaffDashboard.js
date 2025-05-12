import {
  getToken,
  getUserRole,
  clearSession,
  isTokenExpired
} from './sessionStorage.js';

// API Base URL
const API_BASE_URL = 'http://localhost:5085/api';

// DOM Elements
const claimCodeInput = document.getElementById('claimCode');
const processClaimBtn = document.getElementById('processClaimBtn');
const claimResult = document.getElementById('claimResult');
const currentOrderCard = document.getElementById('currentOrderCard');
const readyPickupOrdersCard = document.getElementById('readyPickupOrdersCard');
const orderDetails = document.getElementById('orderDetails');
const completeOrderBtn = document.getElementById('completeOrderBtn');
const ordersList = document.getElementById('ordersList');
const readyPickupOrdersList = document.getElementById('readyPickupOrdersList');
const orderSearch = document.getElementById('orderSearch');
const orderFilter = document.getElementById('orderFilter');
const noOrders = document.getElementById('noOrders');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const logoutBtn = document.getElementById('logoutBtn');
const readyOrdersLoading = document.getElementById('readyOrdersLoading');
const ordersLoading = document.getElementById('ordersLoading');

// Current Order Data
let currentOrder = null;
let completedOrders = [];
let readyForPickupOrders = [];

// Check auth on page load
function checkAuthentication() {
  const token = getToken();
  const role = getUserRole();
  
  if (!token || isTokenExpired() || role !== 'staff') {
    window.location.href = '../index.html';
    return false;
  }
  return true;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
  if (!checkAuthentication()) return;
  
  // Animation for page load - add a subtle fade-in effect
  document.body.style.opacity = 0;
  setTimeout(() => {
    document.body.style.opacity = 1;
    document.body.style.transition = 'opacity 0.8s ease-in-out';
  }, 100);

  // Load initial data
  await Promise.all([
    loadCompletedOrders(),
    loadReadyPickupOrders()
  ]);

  // Event listeners
  processClaimBtn.addEventListener('click', processClaimCode);
  claimCodeInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') processClaimCode();
  });
  completeOrderBtn.addEventListener('click', completeOrder);
  orderSearch.addEventListener('input', filterOrders);
  orderFilter.addEventListener('change', filterOrders);
  logoutBtn.addEventListener('click', handleLogout);

  // Make completeReadyOrder globally available
  window.completeReadyOrder = completeReadyOrder;
});

// ✅ Process Claim Code
async function processClaimCode() {
  const claimCode = claimCodeInput.value.trim();
  if (!claimCode) {
    showClaimResult('Please enter a claim code', false);
    return;
  }

  try {
    processClaimBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    processClaimBtn.disabled = true;

    const url = `${API_BASE_URL}/Order/process-claim`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ claimCode })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Invalid claim code');
    }

    // Extract order ID from success message using regex
    const orderIdMatch = data.message.match(/#(\d+)/);
    const orderId = orderIdMatch ? parseInt(orderIdMatch[1]) : null;

    if (orderId) {
      showClaimResult(`Order #${orderId} processed successfully!`, true);
      await fetchOrderDetails(orderId);
      claimCodeInput.value = '';
      
      // Add ripple effect to current order card
      addRippleEffect(currentOrderCard);
    } else {
      showClaimResult('Order processed but ID not found in response', true);
    }
  } catch (error) {
    showClaimResult(error.message || 'Error processing claim code', false);
  } finally {
    processClaimBtn.innerHTML = '<i class="fas fa-check"></i> Process';
    processClaimBtn.disabled = false;
  }
}

function showClaimResult(message, isSuccess) {
  claimResult.textContent = message;
  claimResult.className = 'result-message ' + (isSuccess ? 'success' : 'error');
  
  // Add a subtle animation
  claimResult.style.animation = 'fadeIn 0.3s forwards';
  
  setTimeout(() => {
    claimResult.style.animation = 'fadeOut 0.5s forwards';
    setTimeout(() => {
      claimResult.textContent = '';
      claimResult.className = 'result-message';
      claimResult.style.animation = '';
    }, 500);
  }, 4500);
}

async function fetchOrderDetails(orderId) {
  try {
    const response = await fetch(`${API_BASE_URL}/Order/${orderId}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Could not fetch order details');
    }
    
    const order = await response.json();

    currentOrder = order;
    displayOrderDetails(order);
    currentOrderCard.classList.remove('hidden');
    
    // Scroll to current order card with smooth animation
    setTimeout(() => {
      currentOrderCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 300);
  } catch (error) {
    showToast(error.message);
  }
}

function displayOrderDetails(order) {
  const booksHtml = order.orderItems.map(item => `
    <div class="order-book-item">
      <div class="book-title">${escapeHtml(item.bookTitle)}</div>
      <div class="book-author">by ${escapeHtml(item.authorName)}</div>
      <div class="book-price">${item.quantity} × Rs ${item.priceAtOrder.toFixed(2)} = Rs ${item.subtotal.toFixed(2)}</div>
    </div>`).join('');

  orderDetails.innerHTML = `
    <div class="order-detail-row"><span class="order-detail-label">Order ID:</span><span>#${order.id}</span></div>
    <div class="order-detail-row"><span class="order-detail-label">Claim Code:</span><span>${escapeHtml(order.claimCode)}</span></div>
    <div class="order-detail-row"><span class="order-detail-label">Order Date:</span><span>${formatDate(order.orderDate)}</span></div>
    <div class="order-detail-row"><span class="order-detail-label">Status:</span><span>${formatStatus(order.status)}</span></div>
    <div class="order-detail-row"><span class="order-detail-label">Total Amount:</span><span>Rs ${order.finalAmount.toFixed(2)}</span></div>
    <h3 style="margin-top: 15px; color: white;">Items</h3>
    <div class="order-books">${booksHtml}</div>`;
}

// ✅ Complete Order
async function completeOrder() {
  if (!currentOrder) return;

  try {
    completeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    completeOrderBtn.disabled = true;

    const url = `${API_BASE_URL}/Order/complete-order`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ orderId: currentOrder.id })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Could not complete order');
    }

    showToast('Order completed successfully!');
    
    // Add slide-up animation before hiding
    currentOrderCard.style.animation = 'slideUp 0.5s forwards';
    setTimeout(() => {
      currentOrderCard.classList.add('hidden');
      currentOrderCard.style.animation = '';
      currentOrder = null;
    }, 500);
    
    // Refresh orders lists
    await Promise.all([
      loadCompletedOrders(),
      loadReadyPickupOrders()
    ]);
  } catch (error) {
    showToast(error.message);
  } finally {
    completeOrderBtn.innerHTML = '<i class="fas fa-check-circle"></i> Mark as Complete';
    completeOrderBtn.disabled = false;
  }
}

// ✅ Load Ready for Pickup Orders
async function loadReadyPickupOrders() {
  try {
    readyOrdersLoading.style.display = 'flex';
    
    const response = await fetch(`${API_BASE_URL}/Order/all`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Could not load ready for pickup orders');
    }

    const orders = await response.json();
    readyForPickupOrders = orders.filter(o => o.status === 'ready_for_pickup');
    
    displayReadyPickupOrders(readyForPickupOrders);
  } catch (error) {
    showToast('Failed to load ready orders: ' + error.message);
    readyPickupOrdersList.innerHTML = `<p class="no-orders">Error loading orders. Please try again.</p>`;
  } finally {
    readyOrdersLoading.style.display = 'none';
  }
}

function displayReadyPickupOrders(orders) {
  if (!readyPickupOrdersList) return;
  
  if (orders.length === 0) {
    readyPickupOrdersList.innerHTML = `<p class="no-orders">No orders ready for pickup.</p>`;
    return;
  }

  readyPickupOrdersList.innerHTML = orders.map(order => `
    <div class="pickup-order-card">
      <div><strong>Order #${order.id}</strong></div>
      <div>Claim Code: <code>${escapeHtml(order.claimCode)}</code></div>
      <div>Total: Rs ${order.finalAmount.toFixed(2)}</div>
      <button onclick="completeReadyOrder('${escapeHtml(order.claimCode)}')" class="small-btn">
        <i class="fas fa-check-circle"></i> Mark Completed
      </button>
    </div>
  `).join('');
}

// ✅ Load Completed Orders
async function loadCompletedOrders() {
  try {
    ordersLoading.style.display = 'flex';
    
    const response = await fetch(`${API_BASE_URL}/Order/all`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Could not load orders');
    }

    const orders = await response.json();
    completedOrders = orders.filter(o => o.status === 'completed');
    filterOrders();
  } catch (error) {
    showToast('Failed to load completed orders: ' + error.message);
    ordersList.innerHTML = `<p class="no-orders">Error loading orders. Please try again.</p>`;
  } finally {
    ordersLoading.style.display = 'none';
  }
}

// ✅ Filter Orders
function filterOrders() {
  const searchTerm = orderSearch.value.toLowerCase();
  const filterType = orderFilter.value;
  let filteredOrders = [...completedOrders];

  if (searchTerm) {
    filteredOrders = filteredOrders.filter(order =>
      order.id.toString().includes(searchTerm) ||
      order.orderItems.some(item =>
        item.bookTitle.toLowerCase().includes(searchTerm) ||
        item.authorName.toLowerCase().includes(searchTerm)
      )
    );
  }

  const today = new Date(); 
  today.setHours(0, 0, 0, 0);
  
  const weekAgo = new Date(); 
  weekAgo.setDate(weekAgo.getDate() - 7); 
  weekAgo.setHours(0, 0, 0, 0);

  if (filterType === 'today') {
    filteredOrders = filteredOrders.filter(o => new Date(o.orderDate) >= today);
  } else if (filterType === 'week') {
    filteredOrders = filteredOrders.filter(o => new Date(o.orderDate) >= weekAgo);
  }

  displayOrdersList(filteredOrders);
}

function displayOrdersList(orders) {
  if (orders.length === 0) {
    ordersList.innerHTML = '';
    noOrders.classList.remove('hidden');
    return;
  }

  noOrders.classList.add('hidden');

  // Sort by most recent first
  orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

  ordersList.innerHTML = orders.map(order => {
    const titles = order.orderItems.map(i => i.bookTitle).join(', ');
    const count = order.orderItems.reduce((sum, i) => sum + i.quantity, 0);

    return `
      <div class="order-card">
        <div class="order-header">
          <span class="order-id">Order #${order.id}</span>
          <span class="order-date">${formatDate(order.orderDate)}</span>
        </div>
        <div class="order-summary">
          <span class="order-books-count"><i class="fas fa-book"></i> ${count} book${count !== 1 ? 's' : ''}</span>
          <span class="order-amount">Rs ${order.finalAmount.toFixed(2)}</span>
        </div>
        <div class="order-books-preview">${escapeHtml(titles)}</div>
      </div>`;
  }).join('');

  // Add hover effect to order cards
  const orderCards = document.querySelectorAll('.order-card');
  orderCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-5px)';
      card.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.2)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.boxShadow = '';
    });
  });
}

// ✅ Complete Ready Order
async function completeReadyOrder(claimCode) {
  try {
    // First find the order card to apply effects
    const orderCards = document.querySelectorAll('.pickup-order-card');
    let targetCard = null;
    
    orderCards.forEach(card => {
      if (card.textContent.includes(claimCode)) {
        targetCard = card;
      }
    });
    
    if (targetCard) {
      // Add processing visual effect
      targetCard.style.opacity = '0.7';
      targetCard.innerHTML += `<div class="loading-spinner" style="position:absolute; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.3); display:flex; justify-content:center; align-items:center;"><div class="spinner"></div></div>`;
    }

    const response = await fetch(`${API_BASE_URL}/Order/complete-order`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ claimCode })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error completing order');
    }

    // Success animation before removing
    if (targetCard) {
      targetCard.style.animation = 'slideOutRight 0.5s forwards';
      setTimeout(() => {
        targetCard.remove();
      }, 500);
    }

    showToast('Order marked as completed successfully!');
    
    // Refresh both order lists
    await Promise.all([
      loadCompletedOrders(),
      loadReadyPickupOrders()
    ]);
  } catch (error) {
    showToast(error.message);
    
    // Reset card if it exists
    const orderCards = document.querySelectorAll('.pickup-order-card');
    orderCards.forEach(card => {
      if (card.textContent.includes(claimCode)) {
        card.style.opacity = '1';
        const spinner = card.querySelector('.loading-spinner');
        if (spinner) spinner.remove();
      }
    });
  }
}

// ✅ Utility Functions
function showToast(message) {
  toastMessage.textContent = message;
  toast.classList.add('show');
  
  // Clear any existing timeout
  if (toast.timeoutId) clearTimeout(toast.timeoutId);
  
  // Set new timeout
  toast.timeoutId = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function formatStatus(status) {
  switch (status) {
    case 'pending': return 'Pending';
    case 'ready_for_pickup': return 'Ready for Pickup';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    default: return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  }
}

function handleLogout() {
  // Add logout animation
  document.body.style.opacity = 0;
  document.body.style.transition = 'opacity 0.5s ease-in-out';
  
  setTimeout(() => {
    clearSession();
    window.location.href = '../index.html';
  }, 500);
}

function addRippleEffect(element) {
  element.classList.add('ripple-effect');
  setTimeout(() => {
    element.classList.remove('ripple-effect');
  }, 800);
}

// Security: Escape HTML to prevent XSS
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return unsafe;
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Add these keyframe animations to the document
function addAnimationStyles() {
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    
    @keyframes slideUp {
      to { transform: translateY(-20px); opacity: 0; }
    }
    
    @keyframes slideOutRight {
      to { transform: translateX(100%); opacity: 0; }
    }
    
    .ripple-effect {
      animation: ripple 0.8s ease-out;
    }
    
    @keyframes ripple {
      0% { box-shadow: 0 0 0 0 rgba(52, 152, 219, 0.5); }
      70% { box-shadow: 0 0 0 15px rgba(52, 152, 219, 0); }
      100% { box-shadow: 0 0 0 0 rgba(52, 152, 219, 0); }
    }
  `;
  document.head.appendChild(styleEl);
}

// Initialize animations on page load
addAnimationStyles();

// Prevent resubmission when page is refreshed
if (window.history.replaceState) {
  window.history.replaceState(null, null, window.location.href);
}