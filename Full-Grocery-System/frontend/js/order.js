/* ============================================
   order.js — Student 5
   Order Management (CRUD)
   ============================================ */

const OrderManager = (() => {
  const ORDER_KEY = 'freshcart_orders';
  const ORDER_ITEMS_KEY = 'freshcart_order_items';

  function getOrders() {
    return JSON.parse(localStorage.getItem(ORDER_KEY) || '[]');
  }

  function getOrderItems() {
    return JSON.parse(localStorage.getItem(ORDER_ITEMS_KEY) || '[]');
  }

  function saveOrders(orders) {
    localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
  }

  function saveOrderItems(items) {
    localStorage.setItem(ORDER_ITEMS_KEY, JSON.stringify(items));
  }

  function genId() {
    return Date.now() + Math.floor(Math.random() * 100);
  }

  function createOrder(cartItems, customerId, shippingAddress, totalAmount, meta) {
    const orders = getOrders();
    const allItems = getOrderItems();

    const order = {
      id: genId(),
      orderId: 'ORD-' + String(orders.length + 1).padStart(5, '0'),
      customerId,
      totalAmount: parseFloat(totalAmount),
      subtotal: meta && meta.subtotal != null ? parseFloat(meta.subtotal) : parseFloat(totalAmount),
      deliveryFee: meta && meta.deliveryFee != null ? parseFloat(meta.deliveryFee) : 0,
      tax: meta && meta.tax != null ? parseFloat(meta.tax) : 0,
      status: 'PENDING',
      shippingAddress,
      createdAt: new Date().toISOString()
    };
    orders.push(order);
    saveOrders(orders);

    cartItems.forEach(ci => {
      const product = (typeof ProductCatalog !== 'undefined') ? ProductCatalog.readProductById(ci.productId) : null;
      const effectivePrice = product ? ((product.discountPrice && product.discountPrice < product.price) ? product.discountPrice : product.price) : 0;
      allItems.push({
        id: genId(),
        orderId: order.id,
        productId: ci.productId,
        productName: product ? product.name : 'Unknown',
        productEmoji: product ? product.emoji : '\u{1F4E6}',
        quantity: ci.quantity,
        unitPrice: effectivePrice
      });
    });
    saveOrderItems(allItems);

    return order;
  }

  function readOrderById(id) {
    return getOrders().find(o => o.id === id) || null;
  }

  function readAllOrders() {
    return getOrders();
  }

  function getOrdersByCustomer(customerId) {
    return getOrders().filter(o => o.customerId === customerId);
  }

  function getOrderItemsByOrder(orderId) {
    return getOrderItems().filter(i => i.orderId === orderId);
  }

  function updateOrderStatus(orderId, newStatus) {
    const orders = getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) throw new Error('Order not found');
    orders[idx].status = newStatus;
    saveOrders(orders);
    if (typeof FreshMartAPI !== 'undefined') {
      FreshMartAPI.updateOrderStatus(orderId, newStatus).catch(e => console.warn(e));
    }
    return orders[idx];
  }

  function cancelOrder(orderId) {
    return updateOrderStatus(orderId, 'CANCELLED');
  }

  function deleteOrder(orderId) {
    const orders = getOrders();
    const filtered = orders.filter(o => o.id !== orderId);
    saveOrders(filtered);
    const items = getOrderItems().filter(i => i.orderId !== orderId);
    saveOrderItems(items);
    if (typeof FreshMartAPI !== 'undefined') {
      FreshMartAPI.deleteOrder(orderId).catch(e => console.warn(e));
    }
  }

  return {
    getOrders, createOrder, readOrderById, readAllOrders,
    getOrdersByCustomer, getOrderItemsByOrder, updateOrderStatus, cancelOrder, deleteOrder
  };
})();

/* ── Sample Orders Seed ── */
function initSampleOrders() {
  const orders = JSON.parse(localStorage.getItem('freshcart_orders') || '[]');
  if (orders.length > 0) return;

  const customerId = 1003;
  const now = Date.now();
  const DAY = 86400000;

  const sampleOrders = [
    {
      id: now - 100, orderId: 'ORD-00001', customerId: customerId,
      totalAmount: 34.92, subtotal: 29.94, deliveryFee: 0, tax: 2.98,
      status: 'DELIVERED', shippingAddress: '88 Lake Drive, Colombo 07',
      createdAt: new Date(now - 14 * DAY).toISOString(), deliveredAt: new Date(now - 13 * DAY).toISOString()
    },
    {
      id: now - 200, orderId: 'ORD-00002', customerId: customerId,
      totalAmount: 22.46, subtotal: 18.96, deliveryFee: 0, tax: 1.52,
      status: 'DELIVERED', shippingAddress: '88 Lake Drive, Colombo 07',
      createdAt: new Date(now - 10 * DAY).toISOString(), deliveredAt: new Date(now - 9 * DAY).toISOString()
    },
    {
      id: now - 300, orderId: 'ORD-00003', customerId: customerId,
      totalAmount: 51.88, subtotal: 44.46, deliveryFee: 0, tax: 3.56,
      status: 'DELIVERED', shippingAddress: '15 Temple Road, Negombo',
      createdAt: new Date(now - 7 * DAY).toISOString(), deliveredAt: new Date(now - 6 * DAY).toISOString()
    },
    {
      id: now - 400, orderId: 'ORD-00004', customerId: customerId,
      totalAmount: 15.97, subtotal: 12.98, deliveryFee: 2.99, tax: 1.04,
      status: 'SHIPPED', shippingAddress: '88 Lake Drive, Colombo 07',
      createdAt: new Date(now - 2 * DAY).toISOString(), deliveredAt: null
    },
    {
      id: now - 500, orderId: 'ORD-00005', customerId: customerId,
      totalAmount: 27.44, subtotal: 23.46, deliveryFee: 0, tax: 1.88,
      status: 'PENDING', shippingAddress: '88 Lake Drive, Colombo 07',
      createdAt: new Date(now - 1 * DAY).toISOString(), deliveredAt: null
    }
  ];

  const sampleItems = [
    { orderId: now - 100, items: [
      { productId: 1, productName: 'Organic Avocados', productEmoji: '\u{1F951}', quantity: 2, unitPrice: 2.99 },
      { productId: 8, productName: 'Organic Whole Milk', productEmoji: '\u{1F95B}', quantity: 2, unitPrice: 3.99 },
      { productId: 9, productName: 'Free-Range Eggs', productEmoji: '\u{1F95A}', quantity: 1, unitPrice: 5.99 },
      { productId: 18, productName: 'Banana Bunch', productEmoji: '\u{1F34C}', quantity: 3, unitPrice: 1.99 }
    ]},
    { orderId: now - 200, items: [
      { productId: 12, productName: 'Atlantic Salmon', productEmoji: '\u{1F41F}', quantity: 1, unitPrice: 9.99 },
      { productId: 6, productName: 'Baby Spinach', productEmoji: '\u{1F96C}', quantity: 2, unitPrice: 2.49 },
      { productId: 7, productName: 'Cherry Tomatoes', productEmoji: '\u{1F345}', quantity: 1, unitPrice: 3.29 }
    ]},
    { orderId: now - 300, items: [
      { productId: 13, productName: 'Chicken Breast', productEmoji: '\u{1F357}', quantity: 2, unitPrice: 8.99 },
      { productId: 16, productName: 'Sweet Potatoes', productEmoji: '\u{1F360}', quantity: 3, unitPrice: 2.49 },
      { productId: 5, productName: 'Broccoli Crown', productEmoji: '\u{1F966}', quantity: 2, unitPrice: 2.99 },
      { productId: 14, productName: 'Cold Brew Coffee', productEmoji: '\u2615', quantity: 1, unitPrice: 5.49 }
    ]},
    { orderId: now - 400, items: [
      { productId: 10, productName: 'Sourdough Loaf', productEmoji: '\u{1F35E}', quantity: 1, unitPrice: 6.49 },
      { productId: 17, productName: 'Greek Yogurt', productEmoji: '\u{1F95B}', quantity: 2, unitPrice: 3.29 }
    ]},
    { orderId: now - 500, items: [
      { productId: 2, productName: 'Fresh Strawberries', productEmoji: '\u{1F353}', quantity: 2, unitPrice: 5.49 },
      { productId: 11, productName: 'Croissants (4-pack)', productEmoji: '\u{1F950}', quantity: 1, unitPrice: 5.99 },
      { productId: 15, productName: 'Green Juice Blend', productEmoji: '\u{1F96D}', quantity: 1, unitPrice: 4.99 }
    ]}
  ];

  localStorage.setItem('freshcart_orders', JSON.stringify(sampleOrders));

  const allItems = [];
  sampleOrders.forEach(order => {
    const match = sampleItems.find(si => si.orderId === order.id);
    if (match) {
      match.items.forEach(item => {
        allItems.push({ id: now + Math.floor(Math.random() * 1000), orderId: order.id, ...item });
      });
    }
  });
  localStorage.setItem('freshcart_order_items', JSON.stringify(allItems));
}

/* ── Order Page Rendering ── */
function renderOrdersPage(filterStatus) {
  const session = (typeof AccountManager !== 'undefined') ? AccountManager.getSession() : null;
  const emptyEl = document.getElementById('orders-empty');
  const listEl = document.getElementById('orders-list');
  if (!listEl) return;

  let orders;
  if (session) {
    orders = OrderManager.getOrdersByCustomer(session.id);
  } else {
    orders = OrderManager.readAllOrders();
  }

  if (filterStatus && filterStatus !== 'all') {
    orders = orders.filter(o => o.status === filterStatus.toUpperCase());
  }

  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  renderOrderHistoryStats(orders);
  renderReorderSection(orders);

  if (orders.length === 0) {
    if (emptyEl) emptyEl.classList.remove('hidden');
    listEl.innerHTML = '';
    return;
  }

  if (emptyEl) emptyEl.classList.add('hidden');

  listEl.innerHTML = orders.map(order => {
    const items = OrderManager.getOrderItemsByOrder(order.id);
    const statusClass = getStatusClass(order.status);
    const date = new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const time = new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    return '<div class="order-card fade-in">' +
      '<div class="order-card-header">' +
      '<div class="flex items-center gap-sm"><span class="order-id">' + (order.orderId || '#' + order.id) + '</span><span class="badge badge-' + statusClass + '">' + order.status + '</span></div>' +
      '<span class="order-date">' + date + ' ' + time + '</span>' +
      '</div>' +
      '<div class="order-card-body">' +
      '<div class="order-items-list">' +
      items.slice(0, 3).map(item => {
        const prod = (typeof ProductCatalog !== 'undefined') ? ProductCatalog.readProductById(item.productId) : null;
        const rawImg = (prod && prod.imageUrl) ? prod.imageUrl : (item.imageUrl || '');
        const imgUrl = (typeof FreshMartImage !== 'undefined') ? FreshMartImage.resolveUrl(rawImg) : (rawImg || 'images/products/apples.jpg');
        const thumb = '<img src="' + imgUrl + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-sm);" onerror="this.onerror=null;this.src=\'images/products/apples.jpg\';">';
        return '<div class="order-item-row">' +
        '<div class="order-item-thumb">' + thumb + '</div>' +
        '<div class="order-item-info"><div class="name">' + item.productName + '</div><div class="qty">Qty: ' + item.quantity + '</div></div>' +
        '<div class="price">Rs ' + (item.unitPrice * item.quantity).toFixed(2) + '</div>' +
        '</div>'
      }).join('') +
      (items.length > 3 ? '<div class="body-xs text-muted" style="padding-left: 56px;">+' + (items.length - 3) + ' more items</div>' : '') +
      '</div>' +
      '</div>' +
      '<div class="order-card-footer">' +
      '<span class="order-total">Total: Rs ' + order.totalAmount.toFixed(2) + '</span>' +
      '<div class="flex gap-xs">' +
      '<button class="btn btn-ghost btn-sm" onclick="showOrderDetail(' + order.id + ')">View Details</button>' +
      '<button class="btn btn-outline btn-sm" onclick="showOrderSlip(' + order.id + ')">&#129534; View Slip</button>' +
      '<button class="btn btn-primary btn-sm" onclick="reorderFromOrder(' + order.id + ')">&#128257; Reorder</button>' +
      (order.status === 'PENDING' ? '<button class="btn btn-outline btn-sm" style="color: var(--clr-danger); border-color: var(--clr-danger);" onclick="cancelOrderAction(' + order.id + ')">Cancel</button>' : '') +
      '</div>' +
      '</div></div>';
  }).join('');
}

function renderOrderHistoryStats(orders) {
  const totalEl = document.getElementById('oh-total-orders');
  const spentEl = document.getElementById('oh-total-spent');
  const deliveredEl = document.getElementById('oh-delivered');
  const itemsEl = document.getElementById('oh-items-ordered');

  if (!totalEl) return;

  const totalOrders = orders.length;
  const totalSpent = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const delivered = orders.filter(o => o.status === 'DELIVERED').length;
  const allItems = orders.reduce((s, o) => {
    const items = OrderManager.getOrderItemsByOrder(o.id);
    return s + items.reduce((is, i) => is + (i.quantity || 1), 0);
  }, 0);

  totalEl.textContent = totalOrders;
  spentEl.textContent = 'Rs ' + totalSpent.toFixed(0);
  deliveredEl.textContent = delivered;
  itemsEl.textContent = allItems;
}

function renderReorderSection(orders) {
  const section = document.getElementById('reorder-section');
  const container = document.getElementById('reorder-items');
  if (!section || !container) return;

  const delivered = orders.filter(o => o.status === 'DELIVERED' || o.status === 'SHIPPED');
  if (delivered.length === 0) {
    section.classList.add('hidden');
    return;
  }

  const recent = delivered.slice(0, 5);
  const seenProducts = new Set();
  const quickItems = [];

  recent.forEach(order => {
    const items = OrderManager.getOrderItemsByOrder(order.id);
    items.forEach(item => {
      if (!seenProducts.has(item.productId)) {
        seenProducts.add(item.productId);
        quickItems.push(item);
      }
    });
  });

  if (quickItems.length === 0) {
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');
  container.innerHTML = quickItems.slice(0, 8).map(item => {
    const prod = (typeof ProductCatalog !== 'undefined') ? ProductCatalog.readProductById(item.productId) : null;
    const rawImg = (prod && prod.imageUrl) ? prod.imageUrl : (item.imageUrl || '');
    const imgUrl = (typeof FreshMartImage !== 'undefined') ? FreshMartImage.resolveUrl(rawImg) : (rawImg || 'images/products/apples.jpg');
    const thumb = '<img src="' + imgUrl + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-sm);" onerror="this.onerror=null;this.src=\'images/products/apples.jpg\';">';
    const price = prod ? prod.price : item.unitPrice;
    return '<div class="reorder-item card card-elevated">' +
      '<div class="reorder-item-thumb">' + thumb + '</div>' +
      '<div class="reorder-item-name body-xs">' + item.productName + '</div>' +
      '<div class="font-mono body-xs" style="color: var(--clr-primary); font-weight: 600;">Rs ' + price.toFixed(2) + '</div>' +
      '<button class="btn btn-outline btn-sm" style="font-size: 0.7rem; padding: 4px 10px; margin-top: 4px;" onclick="quickAddToCart(' + item.productId + ')">+ Add</button>' +
    '</div>';
  }).join('');
}

function getStatusClass(status) {
  switch (status) {
    case 'PENDING': return 'warning';
    case 'CONFIRMED': return 'info';
    case 'PROCESSING': return 'info';
    case 'SHIPPED': return 'info';
    case 'DELIVERED': return 'success';
    case 'CANCELLED': return 'danger';
    default: return 'neutral';
  }
}

function filterOrders(status, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  renderOrdersPage(status);
}

function showOrderDetail(orderId) {
  const order = OrderManager.readOrderById(orderId);
  if (!order) return;

  window._detailOrderId = orderId;

  document.getElementById('order-detail-title').textContent = 'Order ' + (order.orderId || '#' + order.id);

  const date = new Date(order.createdAt);
  document.getElementById('detail-date').textContent = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + ' at ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('detail-address').textContent = order.shippingAddress || 'N/A';

  const statusEl = document.getElementById('detail-status');
  if (statusEl) {
    const cls = getStatusClass(order.status);
    statusEl.innerHTML = '<span class="badge badge-' + cls + '">' + order.status + '</span>';
  }

  const paymentEl = document.getElementById('detail-payment');
  if (paymentEl && typeof PaymentDeliveryManager !== 'undefined') {
    const payment = PaymentDeliveryManager.getPaymentByOrder(orderId);
    paymentEl.textContent = payment ? payment.method : 'N/A';
  }

  const items = OrderManager.getOrderItemsByOrder(orderId);
  const itemsEl = document.getElementById('order-detail-items');
  if (itemsEl) {
    itemsEl.innerHTML = items.map(item => {
      const prod = (typeof ProductCatalog !== 'undefined') ? ProductCatalog.readProductById(item.productId) : null;
      const rawImg = (prod && prod.imageUrl) ? prod.imageUrl : (item.imageUrl || '');
      const imgUrl = (typeof FreshMartImage !== 'undefined') ? FreshMartImage.resolveUrl(rawImg) : (rawImg || 'images/products/apples.jpg');
      const thumb = '<img src="' + imgUrl + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-sm);" onerror="this.onerror=null;this.src=\'images/products/apples.jpg\';">';
      const formattedQty = (typeof ProductCatalog !== 'undefined' && ProductCatalog.formatQuantity && prod) 
        ? ProductCatalog.formatQuantity(item.quantity, prod) 
        : item.quantity;
      return '<div class="order-item-row">' +
      '<div class="order-item-thumb">' + thumb + '</div>' +
      '<div class="order-item-info"><div class="name">' + item.productName + '</div><div class="qty">Amount: ' + formattedQty + ' (@ Rs ' + item.unitPrice.toFixed(2) + ')</div></div>' +
      '<div class="price" style="font-weight: 600;">Rs ' + (item.unitPrice * item.quantity).toFixed(2) + '</div>' +
      '</div>'
    }).join('');
  }

  const subtotal = items.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
  const delivery = subtotal >= 50 ? 0 : 4.99;
  const tax = subtotal * 0.08;

  document.getElementById('detail-subtotal').textContent = 'Rs ' + subtotal.toFixed(2);
  document.getElementById('detail-delivery').textContent = delivery === 0 ? 'FREE' : 'Rs ' + delivery.toFixed(2);
  document.getElementById('detail-tax').textContent = 'Rs ' + tax.toFixed(2);
  document.getElementById('detail-total').textContent = 'Rs ' + order.totalAmount.toFixed(2);

  updateTimeline(order.status);
  showModal('order-detail');
}

function updateTimeline(status) {
  const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  const currentIdx = statuses.indexOf(status === 'CANCELLED' ? 'PENDING' : status);
  const steps = document.querySelectorAll('#order-timeline .timeline-step');

  steps.forEach((step, i) => {
    step.classList.remove('active', 'completed');
    if (i < currentIdx) step.classList.add('completed');
    else if (i === currentIdx) step.classList.add('active');
  });
}

function cancelOrderAction(orderId) {
  if (!confirm('Are you sure you want to cancel this order?')) return;
  try {
    OrderManager.cancelOrder(orderId);
    showToast('Order cancelled', 'info');
    renderOrdersPage();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ── Reorder Functions ── */
function reorderFromOrder(orderId) {
  const items = OrderManager.getOrderItemsByOrder(orderId);
  if (!items || items.length === 0) {
    showToast('No items to reorder', 'error');
    return;
  }
  let added = 0;
  items.forEach(item => {
    for (let i = 0; i < (item.quantity || 1); i++) {
      if (typeof CartManager !== 'undefined') {
        CartManager.addItem(item.productId);
        added++;
      }
    }
  });
  if (added > 0) {
    showToast('Items added to cart! (' + added + ' items)', 'success');
    if (typeof CartManager !== 'undefined') CartManager.updateCartBadge();
  }
}

function reorderFromDetail() {
  if (window._detailOrderId) {
    reorderFromOrder(window._detailOrderId);
  }
}

/* ── View History Buttons ── */
function scrollToOrders() {
  const el = document.getElementById('orders-list');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function viewPastOrders() {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(t => { if (t.textContent.trim() === 'Delivered') t.classList.add('active'); });
  renderOrdersPage('delivered');
  scrollToOrders();
}

/* ── Admin Orders Rendering ── */
function renderAdminOrders() {
  const tbody = document.getElementById('admin-orders-table');
  if (!tbody) return;

  const orders = OrderManager.readAllOrders();
  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center body-sm" style="padding: 40px;">No orders yet</td></tr>';
    return;
  }

  const session = typeof AccountManager !== 'undefined' ? AccountManager.getSession() : null;
  const canEdit = session && (session.role === 'DEPT_ORDER' || session.role === 'ADMIN');

  tbody.innerHTML = orders.map(order => {
    const items = OrderManager.getOrderItemsByOrder(order.id);
    const date = new Date(order.createdAt).toLocaleDateString();
    const statusClass = getStatusClass(order.status);

    let customerName = 'Unknown';
    if (typeof AccountManager !== 'undefined') {
      const user = AccountManager.readUserById(order.customerId);
      if (user) customerName = user.name;
    }

    const orderStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

    return '<tr>' +
      '<td class="font-mono body-sm" style="font-weight: 500;">' + (order.orderId || '#' + order.id) + '</td>' +
      '<td class="body-sm">' + customerName + '</td>' +
      '<td class="body-sm">' + items.length + ' item' + (items.length !== 1 ? 's' : '') + '</td>' +
      '<td class="font-mono" style="font-weight: 600;">Rs ' + order.totalAmount.toFixed(2) + '</td>' +
      '<td><span class="badge badge-' + statusClass + '">' + order.status + '</span></td>' +
      '<td class="body-sm">' + date + '</td>' +
      '<td><div class="flex gap-xs">' +
      '<button class="btn btn-ghost btn-sm" onclick="showOrderDetail(' + order.id + ')" title="View Order Details">&#128065;</button>' +
      '<button class="btn btn-ghost btn-sm" onclick="showOrderSlip(' + order.id + ')" title="View Payment Slip">&#129534;</button>' +
      (canEdit ? '<button class="btn btn-ghost btn-sm" onclick="showStatusModal(\'order\', ' + order.id + ', \'' + order.status + '\', ' + JSON.stringify(orderStatuses).replace(/"/g, '&quot;') + ')">&#9881;</button>' : '') +
      '</div></td></tr>';
  }).join('');
}

/* ── Show Payment Slip Modal from Orders Page ── */
function showOrderSlip(orderId) {
  const order = OrderManager.readOrderById(orderId);
  if (!order) {
    if (typeof showToast === 'function') showToast('Order not found', 'error');
    return;
  }

  const items = OrderManager.getOrderItemsByOrder(order.id);
  const payment = (typeof PaymentDeliveryManager !== 'undefined')
    ? PaymentDeliveryManager.getPaymentByOrder(order.id)
    : null;
  const delivery = (typeof PaymentDeliveryManager !== 'undefined')
    ? PaymentDeliveryManager.getDeliveryByOrder(order.id)
    : null;

  const session = (typeof AccountManager !== 'undefined') ? AccountManager.getSession() : null;

  let customerName = 'Customer';
  let customerPhone = '';
  let customerAddress = order.shippingAddress || '';

  if (session && session.id === order.customerId) {
    customerName = session.name;
    customerPhone = session.phone || '';
  } else if (typeof AccountManager !== 'undefined') {
    const u = AccountManager.readUserById(order.customerId);
    if (u) {
      customerName = u.name;
      customerPhone = u.phone || '';
      if (!customerAddress) customerAddress = u.address || '';
    }
  }

  const subtotal = order.subtotal != null ? order.subtotal : (order.totalAmount - (order.deliveryFee || 0) - (order.tax || 0));
  const deliveryFee = order.deliveryFee != null ? order.deliveryFee : 0;
  const tax = order.tax != null ? order.tax : 0;

  const details = {
    name: customerName,
    phone: customerPhone,
    address: customerAddress,
    method: payment ? (payment.method === 'COD' ? 'cod' : 'card') : 'card',
    subtotal: subtotal,
    delivery: deliveryFee,
    tax: tax,
    total: order.totalAmount
  };

  const deliveryType = (delivery && delivery.scheduledTime && delivery.scheduledTime.includes('T'))
    ? 'scheduled'
    : (deliveryFee > 3 ? 'express' : 'standard');

  if (typeof generatePaymentSlip === 'function') {
    generatePaymentSlip(order, payment, items, deliveryType, details);
  } else {
    showToast('Payment slip module loading...', 'info');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSampleOrders();
  if (document.getElementById('orders-list')) {
    renderOrdersPage();
  }
});
