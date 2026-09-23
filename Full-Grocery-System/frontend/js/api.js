/* ==========================================================================
   FreshMart Universal Image Normalizer & Resolver
   Guarantees that ANY product image (PNG, JPEG, WebP, local path, or URL)
   displays reliably across the browser without ever being replaced by emojis.
   ========================================================================== */
const FreshMartImage = {
  resolveUrl: function(url) {
    if (!url || typeof url !== 'string' || !url.trim()) {
      return 'images/products/apples.jpg';
    }
    const clean = url.trim();
    if (clean.startsWith('data:') || clean.startsWith('http://') || clean.startsWith('https://')) {
      return clean;
    }
    // Windows local absolute path (e.g. C:\... or D:\...)
    if (clean.includes(':\\')) {
      return 'http://localhost:8080/api/images?path=' + encodeURIComponent(clean);
    }
    // Relative path in webroot
    if (clean.startsWith('images/')) {
      return clean;
    }
    // Bare filename or nested path
    const filename = clean.replace(/^.*[\\\/]/, '');
    return 'images/products/' + filename;
  },
  DEFAULT_PLACEHOLDER: 'images/products/apples.jpg'
};
if (typeof window !== 'undefined') {
  window.FreshMartImage = FreshMartImage;
}

const FreshMartAPI = (() => {
  const BASE_URL = 'http://localhost:8080/api';

  // 1. Health
  async function checkHealth() {
    try {
      const res = await fetch(BASE_URL + '/health');
      return await res.json();
    } catch (err) {
      return { status: 'OFFLINE', database: 'DISCONNECTED', error: err.message };
    }
  }

  // 2. Auth & Users CRUD
  async function signup(userData) {
    const res = await fetch(BASE_URL + '/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Signup failed');
    }
    return data;
  }

  async function login(credentials) {
    const res = await fetch(BASE_URL + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Login failed');
    }
    return data;
  }

  async function getUsers() {
    const res = await fetch(BASE_URL + '/users');
    if (!res.ok) throw new Error('Failed to fetch users from database');
    return await res.json();
  }

  async function createUser(userData) {
    const res = await fetch(BASE_URL + '/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create user');
    return data;
  }

  async function updateUser(id, userData) {
    const res = await fetch(BASE_URL + '/users?id=' + encodeURIComponent(id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...userData })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update user');
    return data;
  }

  async function deleteUser(id) {
    const res = await fetch(BASE_URL + '/users?id=' + encodeURIComponent(id), {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete user');
    return data;
  }

  // 3. Products CRUD
  async function getProducts() {
    const res = await fetch(BASE_URL + '/products');
    if (!res.ok) throw new Error('Failed to fetch products from database');
    return await res.json();
  }

  async function createProduct(productData) {
    const res = await fetch(BASE_URL + '/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create product');
    return data;
  }

  async function updateProduct(id, productData) {
    const res = await fetch(BASE_URL + '/products?id=' + encodeURIComponent(id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...productData })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update product');
    return data;
  }

  async function deleteProduct(id) {
    const res = await fetch(BASE_URL + '/products?id=' + encodeURIComponent(id), {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete product');
    return data;
  }

  // 4. Categories CRUD
  async function getCategories() {
    const res = await fetch(BASE_URL + '/categories');
    if (!res.ok) throw new Error('Failed to fetch categories from database');
    return await res.json();
  }

  async function createCategory(categoryData) {
    const res = await fetch(BASE_URL + '/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryData)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create category');
    return data;
  }

  async function updateCategory(id, categoryData) {
    const res = await fetch(BASE_URL + '/categories?id=' + encodeURIComponent(id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...categoryData })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update category');
    return data;
  }

  async function deleteCategory(id) {
    const res = await fetch(BASE_URL + '/categories?id=' + encodeURIComponent(id), {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete category');
    return data;
  }

  // 5. Orders CRUD
  async function placeOrder(orderData) {
    const res = await fetch(BASE_URL + '/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to place order');
    return data;
  }

  async function getOrders(customerId) {
    const url = customerId ? (BASE_URL + '/orders?customerId=' + encodeURIComponent(customerId)) : (BASE_URL + '/orders');
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch orders from database');
    return await res.json();
  }

  async function updateOrderStatus(orderId, newStatus) {
    const res = await fetch(BASE_URL + '/orders?id=' + encodeURIComponent(orderId), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: Number(orderId), status: newStatus })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update order status');
    return data;
  }

  async function deleteOrder(orderId) {
    const res = await fetch(BASE_URL + '/orders?id=' + encodeURIComponent(orderId), {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete order');
    return data;
  }

  // 6. Inquiries CRUD
  async function submitInquiry(inquiryData) {
    const res = await fetch(BASE_URL + '/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inquiryData)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to submit inquiry');
    return data;
  }

  async function getInquiries(customerId) {
    const url = customerId ? (BASE_URL + '/inquiries?customerId=' + encodeURIComponent(customerId)) : (BASE_URL + '/inquiries');
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch inquiries from database');
    return await res.json();
  }

  async function respondInquiry(inquiryId, responseText) {
    const res = await fetch(BASE_URL + '/inquiries/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inquiryId: Number(inquiryId), response: responseText })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to respond to inquiry');
    return data;
  }

  async function forwardInquiry(inquiryId, department) {
    const res = await fetch(BASE_URL + '/inquiries/forward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inquiryId: Number(inquiryId), department: department })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to forward inquiry');
    return data;
  }

  async function deleteInquiry(inquiryId) {
    const res = await fetch(BASE_URL + '/inquiries?id=' + encodeURIComponent(inquiryId), {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete inquiry');
    return data;
  }

  // 6.5 Promotions CRUD (Direct MS SQL Server FreshMartDB)
  async function getPromotions() {
    const res = await fetch(BASE_URL + '/promotions');
    if (!res.ok) throw new Error('Failed to fetch promotions from database');
    return await res.json();
  }

  async function applyPromotion(productId, percentage, discountPrice) {
    const res = await fetch(BASE_URL + '/promotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: Number(productId),
        discountPercentage: Number(percentage),
        discountPrice: discountPrice !== undefined && discountPrice !== null ? Number(discountPrice) : null
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to apply promotion');
    return data;
  }

  async function removePromotion(productId) {
    const res = await fetch(BASE_URL + '/promotions?productId=' + encodeURIComponent(productId), {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to remove promotion');
    return data;
  }

  // 7. Suppliers CRUD
  async function getSuppliers() {
    const res = await fetch(BASE_URL + '/suppliers');
    if (!res.ok) throw new Error('Failed to fetch suppliers from database');
    return await res.json();
  }

  async function createSupplier(supplierData) {
    const res = await fetch(BASE_URL + '/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supplierData)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create supplier');
    return data;
  }

  async function updateSupplier(id, supplierData) {
    const res = await fetch(BASE_URL + '/suppliers?id=' + encodeURIComponent(id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...supplierData })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update supplier');
    return data;
  }

  async function deleteSupplier(id) {
    const res = await fetch(BASE_URL + '/suppliers?id=' + encodeURIComponent(id), {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete supplier');
    return data;
  }

  // 8. Live Database Status Indicator Badge
  async function updateStatusBadge() {
    try {
      const health = await checkHealth();
      let badge = document.getElementById('live-db-badge');
      if (!badge) {
        badge = document.createElement('div');
        badge.id = 'live-db-badge';
        badge.style.cssText = 'position:fixed; bottom:16px; right:16px; z-index:99999; padding:6px 14px; border-radius:20px; font-size:12px; font-weight:700; font-family:system-ui, -apple-system, sans-serif; box-shadow:0 3px 12px rgba(0,0,0,0.18); display:flex; align-items:center; gap:6px; transition:all 0.3s;';
        document.body.appendChild(badge);
      }
      if (health.status === 'UP' && health.database === 'CONNECTED') {
        badge.style.background = '#dcfce7';
        badge.style.color = '#15803d';
        badge.style.border = '1px solid #86efac';
        badge.innerHTML = '&#9679; Database: CONNECTED (Port 8080)';
        badge.title = 'Backend is connected to Microsoft SQL Server (FreshMartDB)';
      } else {
        badge.style.background = '#fee2e2';
        badge.style.color = '#b91c1c';
        badge.style.border = '1px solid #fca5a5';
        badge.innerHTML = '&#9679; Backend: OFFLINE (Port 8080)';
        badge.title = 'Run FreshMartServer.java in IntelliJ or double-click start-backend.bat';
      }
    } catch (e) {
      console.warn('Status badge error:', e);
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', updateStatusBadge);
    setInterval(updateStatusBadge, 8000);
  }

  // 12. Shopping Cart CRUD & Sync (shopping_carts & cart_items)
  async function getCart(customerId = 1003) {
    try {
      const res = await fetch(`${BASE_URL}/cart?customerId=${encodeURIComponent(customerId)}`);
      return await res.json();
    } catch (e) {
      console.warn('API getCart error:', e);
      return { success: false, items: [] };
    }
  }

  async function addToCart(customerId = 1003, productId, quantity = 1) {
    try {
      const res = await fetch(`${BASE_URL}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: Number(customerId), productId: Number(productId), quantity: Number(quantity) })
      });
      return await res.json();
    } catch (e) {
      console.warn('API addToCart error:', e);
      return { success: false };
    }
  }

  async function updateCartItem(customerId = 1003, productId, quantity) {
    try {
      const res = await fetch(`${BASE_URL}/cart`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: Number(customerId), productId: Number(productId), quantity: Number(quantity) })
      });
      return await res.json();
    } catch (e) {
      console.warn('API updateCartItem error:', e);
      return { success: false };
    }
  }

  async function removeFromCart(customerId = 1003, productId) {
    try {
      const res = await fetch(`${BASE_URL}/cart`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: Number(customerId), productId: Number(productId) })
      });
      return await res.json();
    } catch (e) {
      console.warn('API removeFromCart error:', e);
      return { success: false };
    }
  }

  async function clearCart(customerId = 1003) {
    try {
      const res = await fetch(`${BASE_URL}/cart?customerId=${encodeURIComponent(customerId)}&clear=true`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (e) {
      console.warn('API clearCart error:', e);
      return { success: false };
    }
  }

  async function syncCart(customerId = 1003, items = []) {
    try {
      const res = await fetch(`${BASE_URL}/cart/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: Number(customerId), items: items })
      });
      return await res.json();
    } catch (e) {
      console.warn('API syncCart error:', e);
      return { success: false };
    }
  }

  return {
    BASE_URL,
    checkHealth,
    // Auth & Users
    signup,
    login,
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    // Products
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    // Categories
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    // Orders
    placeOrder,
    getOrders,
    updateOrderStatus,
    deleteOrder,
    // Inquiries
    submitInquiry,
    getInquiries,
    respondInquiry,
    forwardInquiry,
    deleteInquiry,
    // Promotions
    getPromotions,
    applyPromotion,
    removePromotion,
    // Suppliers
    getSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    // Cart (shopping_carts & cart_items)
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    syncCart,
    updateStatusBadge
  };
})();

if (typeof window !== 'undefined') {
  window.FreshMartAPI = FreshMartAPI;
}