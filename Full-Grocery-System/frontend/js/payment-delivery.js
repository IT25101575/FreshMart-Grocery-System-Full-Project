/* ============================================
   payment-delivery.js — Student 6
   Payment & Delivery Management (CRUD)
   ============================================ */

const PaymentDeliveryManager = (() => {
  const PAYMENT_KEY = 'freshcart_payments';
  const DELIVERY_KEY = 'freshcart_deliveries';
  const DELIVERY_CONFIG_KEY = 'freshcart_delivery_config';

  const DEFAULT_DELIVERY_CONFIG = {
    standardFee: 2.99,
    expressFee: 4.99,
    scheduledFee: 0.00,
    freeThreshold: 50.00,
    isFixedDistance: true,
    reason: 'Standard flat rate for all delivery zones (fixed fee regardless of distance)',
    updatedAt: new Date().toISOString(),
    updatedBy: 'Delivery Head'
  };

  function getPayments() {
    return JSON.parse(localStorage.getItem(PAYMENT_KEY) || '[]');
  }

  function savePayments(payments) {
    localStorage.setItem(PAYMENT_KEY, JSON.stringify(payments));
  }

  function saveDeliveries(deliveries) {
    localStorage.setItem(DELIVERY_KEY, JSON.stringify(deliveries));
  }

  function genId() {
    return Date.now() + Math.floor(Math.random() * 100);
  }

  /* ── Delivery Pricing Configuration (Fixed for Any Distance) ── */
  function getDeliveryConfig() {
    const raw = localStorage.getItem(DELIVERY_CONFIG_KEY);
    if (!raw) {
      saveDeliveryConfig(DEFAULT_DELIVERY_CONFIG);
      return { ...DEFAULT_DELIVERY_CONFIG };
    }
    try {
      return { ...DEFAULT_DELIVERY_CONFIG, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_DELIVERY_CONFIG };
    }
  }

  function saveDeliveryConfig(cfg) {
    localStorage.setItem(DELIVERY_CONFIG_KEY, JSON.stringify(cfg));
  }

  function updateDeliveryConfig(updates) {
    const current = getDeliveryConfig();
    const standardFee = parseFloat(updates.standardFee);
    const expressFee = parseFloat(updates.expressFee);
    const scheduledFee = updates.scheduledFee != null ? parseFloat(updates.scheduledFee) : 0;
    const freeThreshold = updates.freeThreshold != null ? parseFloat(updates.freeThreshold) : current.freeThreshold;

    if (isNaN(standardFee) || standardFee < 0) throw new Error('Standard delivery fee must be a valid non-negative number');
    if (isNaN(expressFee) || expressFee < 0) throw new Error('Express delivery fee must be a valid non-negative number');

    const updated = {
      ...current,
      standardFee: standardFee,
      expressFee: expressFee,
      scheduledFee: isNaN(scheduledFee) || scheduledFee < 0 ? 0 : scheduledFee,
      freeThreshold: isNaN(freeThreshold) || freeThreshold < 0 ? 0 : freeThreshold,
      reason: updates.reason && updates.reason.trim() ? updates.reason.trim() : current.reason,
      updatedAt: new Date().toISOString(),
      updatedBy: updates.updatedBy || 'Delivery Admin'
    };
    saveDeliveryConfig(updated);
    return updated;
  }

  function getDeliveryFee(type, subtotal = 0) {
    const cfg = getDeliveryConfig();
    const fee = type === 'express' ? cfg.expressFee :
                type === 'standard' ? cfg.standardFee :
                (cfg.scheduledFee || 0);
    if (cfg.freeThreshold > 0 && subtotal >= cfg.freeThreshold && type !== 'express') {
      return 0;
    }
    return fee;
  }

  /* ── Auto-Sync Deliveries With Orders ── */
  function syncDeliveriesWithOrders() {
    let orders = [];
    if (typeof OrderManager !== 'undefined') {
      orders = OrderManager.getOrders();
    } else {
      orders = JSON.parse(localStorage.getItem('freshcart_orders') || '[]');
    }
    if (!orders || orders.length === 0) return;

    let deliveries = JSON.parse(localStorage.getItem(DELIVERY_KEY) || '[]');
    let changed = false;

    orders.forEach((order, idx) => {
      let d = deliveries.find(del => del.orderId === order.id || del.orderId === order.orderId || del.orderCode === order.orderId);

      let targetStatus = 'SCHEDULED';
      if (order.status === 'DELIVERED') targetStatus = 'DELIVERED';
      else if (order.status === 'SHIPPED') targetStatus = 'IN_TRANSIT';
      else if (order.status === 'CANCELLED') targetStatus = 'CANCELLED';
      else if (order.status === 'PENDING' || order.status === 'PROCESSING') targetStatus = 'SCHEDULED';

      if (!d) {
        d = {
          id: order.id ? order.id + 1000 : Date.now() + idx,
          deliveryId: 'DEL-' + String(deliveries.length + 1).padStart(5, '0'),
          orderId: order.id,
          orderCode: order.orderId || ('ORD-' + String(idx + 1).padStart(5, '0')),
          assignedStaffId: (targetStatus === 'DELIVERED' || targetStatus === 'IN_TRANSIT') ? 1007 : null, // 1007 = John Driver
          status: targetStatus,
          scheduledTime: order.createdAt || new Date().toISOString(),
          deliveredAt: order.deliveredAt || (targetStatus === 'DELIVERED' ? (order.createdAt || new Date().toISOString()) : null),
          shippingAddress: order.shippingAddress || 'Customer Address'
        };
        deliveries.push(d);
        changed = true;
      } else {
        if (order.status === 'DELIVERED' && d.status !== 'DELIVERED') {
          d.status = 'DELIVERED';
          d.deliveredAt = order.deliveredAt || new Date().toISOString();
          changed = true;
        } else if (order.status === 'SHIPPED' && d.status !== 'IN_TRANSIT' && d.status !== 'DELIVERED') {
          d.status = 'IN_TRANSIT';
          changed = true;
        } else if (order.status === 'CANCELLED' && d.status !== 'CANCELLED') {
          d.status = 'CANCELLED';
          changed = true;
        }
        if (!d.orderCode && order.orderId) {
          d.orderCode = order.orderId;
          changed = true;
        }
      }
    });

    if (changed) {
      saveDeliveries(deliveries);
    }
  }

  function getDeliveries() {
    syncDeliveriesWithOrders();
    return JSON.parse(localStorage.getItem(DELIVERY_KEY) || '[]');
  }

  /* ── Payment CRUD ── */
  function createPayment(orderId, method, amount) {
    const payments = getPayments();
    const payment = {
      id: genId(),
      paymentId: 'PAY-' + String(payments.length + 1).padStart(5, '0'),
      orderId,
      method: method || 'CARD',
      status: method === 'COD' ? 'PENDING' : 'COMPLETED',
      amount: parseFloat(amount),
      transactionDate: new Date().toISOString()
    };
    payments.push(payment);
    savePayments(payments);
    return payment;
  }

  function readPaymentById(id) {
    return getPayments().find(p => p.id === id) || null;
  }

  function getPaymentByOrder(orderId) {
    return getPayments().find(p => p.orderId === orderId) || null;
  }

  function updatePaymentStatus(paymentId, newStatus) {
    const payments = getPayments();
    const idx = payments.findIndex(p => p.id === paymentId);
    if (idx === -1) throw new Error('Payment not found');
    payments[idx].status = newStatus;
    savePayments(payments);
    return payments[idx];
  }

  function deletePayment(paymentId) {
    const payments = getPayments();
    savePayments(payments.filter(p => p.id !== paymentId));
  }

  /* ── Delivery CRUD ── */
  function createDelivery(orderId, scheduledTime) {
    const deliveries = getDeliveries();
    const delivery = {
      id: genId(),
      deliveryId: 'DEL-' + String(deliveries.length + 1).padStart(5, '0'),
      orderId,
      assignedStaffId: null,
      status: 'SCHEDULED',
      scheduledTime: scheduledTime || null,
      deliveredAt: null
    };
    deliveries.push(delivery);
    saveDeliveries(deliveries);
    return delivery;
  }

  function readDeliveryById(id) {
    return getDeliveries().find(d => d.id === id) || null;
  }

  function getDeliveryByOrder(orderId) {
    return getDeliveries().find(d => d.orderId === orderId) || null;
  }

  function updateDeliveryStatus(deliveryId, newStatus) {
    const deliveries = getDeliveries();
    const idx = deliveries.findIndex(d => d.id === deliveryId);
    if (idx === -1) throw new Error('Delivery not found');
    deliveries[idx].status = newStatus;
    if (newStatus === 'DELIVERED') {
      deliveries[idx].deliveredAt = new Date().toISOString();
    }
    saveDeliveries(deliveries);
    return deliveries[idx];
  }

  function assignStaff(deliveryId, staffId) {
    const deliveries = getDeliveries();
    const idx = deliveries.findIndex(d => d.id === deliveryId);
    if (idx === -1) throw new Error('Delivery not found');
    deliveries[idx].assignedStaffId = staffId;
    saveDeliveries(deliveries);
    return deliveries[idx];
  }

  function deleteDelivery(deliveryId) {
    const deliveries = getDeliveries();
    saveDeliveries(deliveries.filter(d => d.id !== deliveryId));
  }

  return {
    getPayments, createPayment, readPaymentById, getPaymentByOrder, updatePaymentStatus, deletePayment,
    getDeliveries, createDelivery, readDeliveryById, getDeliveryByOrder, updateDeliveryStatus, assignStaff, deleteDelivery,
    getDeliveryConfig, updateDeliveryConfig, getDeliveryFee, syncDeliveriesWithOrders
  };
})();

/* ── Checkout Flow ── */
let selectedPaymentMethod = 'card';
let selectedDeliveryType = 'express';

function selectPayment(el, method) {
  document.querySelectorAll('input[name="payment"]').forEach(r => r.closest('.payment-option').classList.remove('selected'));
  el.classList.add('selected');
  el.querySelector('input').checked = true;
  selectedPaymentMethod = method;

  const cardDetails = document.getElementById('card-details');
  if (cardDetails) {
    cardDetails.style.display = method === 'card' ? 'block' : 'none';
    if (method !== 'card' && typeof FreshValidator !== 'undefined') {
      ['card-number', 'card-expiry', 'card-cvv', 'card-name'].forEach(id => FreshValidator.clearFieldError(id));
    }
  }

  updateCheckoutSummary();
}

function selectDeliveryTime(el, type) {
  document.querySelectorAll('input[name="delivery-time"]').forEach(r => r.closest('.payment-option').classList.remove('selected'));
  el.classList.add('selected');
  el.querySelector('input').checked = true;
  selectedDeliveryType = type;

  const schedulePicker = document.getElementById('schedule-picker');
  if (schedulePicker) {
    schedulePicker.classList.toggle('hidden', type !== 'scheduled');
  }

  updateCheckoutSummary();
}

function updateCheckoutSummary() {
  if (typeof CartManager === 'undefined') return;
  const items = CartManager.getItems();
  const checkoutItems = document.getElementById('checkout-items');

  if (checkoutItems) {
    checkoutItems.innerHTML = items.map(item => {
      if (typeof ProductCatalog === 'undefined') return '';
      const p = ProductCatalog.readProductById(item.productId);
      if (!p) return '';
      const effectivePrice = (p.discountPrice && p.discountPrice < p.price) ? p.discountPrice : p.price;
      const formattedQty = (typeof ProductCatalog.formatQuantity === 'function') 
        ? ProductCatalog.formatQuantity(item.quantity, p) 
        : item.quantity;
      const rawImg = p.imageUrl || '';
      const imgUrl = (typeof FreshMartImage !== 'undefined') ? FreshMartImage.resolveUrl(rawImg) : (rawImg || 'images/products/apples.jpg');
      return '<div class="flex items-center gap-sm" style="padding: 8px 0;">' +
        '<img src="' + imgUrl + '" alt="' + p.name + '" style="width:40px;height:40px;border-radius:var(--radius-sm);object-fit:cover;flex-shrink:0;" onerror="this.onerror=null;this.src=\'images/products/apples.jpg\';">' +
        '<div style="flex: 1;"><div class="body-sm" style="font-weight: 500;">' + p.name + '</div><div class="body-xs text-muted">Amount: ' + formattedQty + '</div></div>' +
        '<div class="font-mono body-sm" style="font-weight: 600;">Rs ' + (effectivePrice * item.quantity).toFixed(2) + '</div></div>';
    }).join('');
  }

  const subtotal = CartManager.getSubtotal();
  const cfg = (typeof PaymentDeliveryManager !== 'undefined') ? PaymentDeliveryManager.getDeliveryConfig() : { standardFee: 2.99, expressFee: 4.99, scheduledFee: 0, freeThreshold: 50, reason: 'Standard flat rate' };
  const delivery = (typeof PaymentDeliveryManager !== 'undefined') ? PaymentDeliveryManager.getDeliveryFee(selectedDeliveryType, subtotal) : (subtotal >= 50 && selectedDeliveryType !== 'express' ? 0 : (selectedDeliveryType === 'standard' ? 2.99 : 4.99));
  const tax = subtotal * 0.08;
  const total = subtotal + delivery + tax;

  // Dynamically update option descriptions with fixed rates
  const descExp = document.getElementById('checkout-desc-express');
  if (descExp) descExp.textContent = '30 minutes — Rs ' + cfg.expressFee.toFixed(2);

  const descStd = document.getElementById('checkout-desc-standard');
  if (descStd) {
    if (cfg.freeThreshold > 0 && subtotal >= cfg.freeThreshold) {
      descStd.textContent = '2 hours — FREE (Order > Rs ' + cfg.freeThreshold.toFixed(0) + ')';
    } else {
      descStd.textContent = '2 hours — Rs ' + cfg.standardFee.toFixed(2);
    }
  }

  const descSched = document.getElementById('checkout-desc-scheduled');
  if (descSched) {
    descSched.textContent = (cfg.scheduledFee > 0) ? ('Pick a time — Rs ' + cfg.scheduledFee.toFixed(2)) : 'Pick a time — Free';
  }

  const policyText = document.getElementById('checkout-delivery-policy-text');
  if (policyText) {
    policyText.textContent = 'Fixed delivery charge for all locations. Note: ' + (cfg.reason || 'Standard rate');
  }

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('checkout-subtotal', 'Rs ' + subtotal.toFixed(2));
  setEl('checkout-delivery', delivery === 0 ? 'FREE' : 'Rs ' + delivery.toFixed(2));
  setEl('checkout-tax', 'Rs ' + tax.toFixed(2));
  setEl('checkout-total', 'Rs ' + total.toFixed(2));
}

async function placeOrder() {
  const session = (typeof AccountManager !== 'undefined') ? AccountManager.getSession() : null;
  if (!session) {
    showToast('Please sign in to place an order', 'error');
    showModal('login-modal');
    return;
  }

  const items = (typeof CartManager !== 'undefined') ? CartManager.getItems() : [];
  if (items.length === 0) {
    showToast('Your cart is empty', 'error');
    return;
  }

  // Stock Verification before placing order
  for (const item of items) {
    const p = (typeof ProductCatalog !== 'undefined') ? ProductCatalog.readProductById(item.productId) : null;
    if (p) {
      if (p.stockQuantity <= 0) {
        showToast(`Cannot place order: "${p.name}" is currently out of stock. Please remove it from your cart.`, 'error');
        return;
      }
      if (item.quantity > p.stockQuantity) {
        const formattedStock = (typeof ProductCatalog.formatQuantity === 'function') ? ProductCatalog.formatQuantity(p.stockQuantity, p) : p.stockQuantity;
        const formattedReq = (typeof ProductCatalog.formatQuantity === 'function') ? ProductCatalog.formatQuantity(item.quantity, p) : item.quantity;
        showToast(`Cannot place order: "${p.name}" exceeds available stock (Requested: ${formattedReq}, Available: ${formattedStock}). Please adjust your cart.`, 'error');
        return;
      }
    }
  }

  const name = document.getElementById('ship-name')?.value.trim();
  const address = document.getElementById('ship-address')?.value.trim();
  const city = document.getElementById('ship-city')?.value.trim();
  const zip = document.getElementById('ship-zip')?.value.trim();
  const phone = document.getElementById('ship-phone')?.value.trim();

  let hasFormError = false;

  // Validate Name
  if (!name || (typeof FreshValidator !== 'undefined' && !FreshValidator.isValidName(name))) {
    if (typeof FreshValidator !== 'undefined') FreshValidator.showFieldError('ship-name', 'Full name must be at least 2 characters (letters only)');
    hasFormError = true;
  } else if (typeof FreshValidator !== 'undefined') {
    FreshValidator.clearFieldError('ship-name');
  }

  // Validate Street Address
  if (!address || (typeof FreshValidator !== 'undefined' && !FreshValidator.isValidAddress(address))) {
    if (typeof FreshValidator !== 'undefined') FreshValidator.showFieldError('ship-address', 'Street address must be at least 5 characters');
    hasFormError = true;
  } else if (typeof FreshValidator !== 'undefined') {
    FreshValidator.clearFieldError('ship-address');
  }

  // Validate City
  if (!city || (typeof FreshValidator !== 'undefined' && !FreshValidator.isValidCity(city))) {
    if (typeof FreshValidator !== 'undefined') FreshValidator.showFieldError('ship-city', 'Please enter a valid city or district (letters only)');
    hasFormError = true;
  } else if (typeof FreshValidator !== 'undefined') {
    FreshValidator.clearFieldError('ship-city');
  }

  // Validate Postal Code
  if (!zip || (typeof FreshValidator !== 'undefined' && !FreshValidator.isValidPostalCode(zip))) {
    if (typeof FreshValidator !== 'undefined') FreshValidator.showFieldError('ship-zip', 'Postal code must be exactly 5 numeric digits (e.g. 00100)');
    hasFormError = true;
  } else if (typeof FreshValidator !== 'undefined') {
    FreshValidator.clearFieldError('ship-zip');
  }

  // Validate Phone Number
  if (!phone || (typeof FreshValidator !== 'undefined' && !FreshValidator.isValidPhone(phone))) {
    if (typeof FreshValidator !== 'undefined') FreshValidator.showFieldError('ship-phone', 'Please enter a valid phone number (e.g. +94 77 123 4567 or 0771234567)');
    hasFormError = true;
  } else if (typeof FreshValidator !== 'undefined') {
    FreshValidator.clearFieldError('ship-phone');
  }

  // Validate Scheduled Delivery (if selected)
  if (selectedDeliveryType === 'scheduled') {
    const scheduleDate = document.getElementById('schedule-date')?.value;
    const scheduleTime = document.getElementById('schedule-time')?.value;
    const today = new Date().toISOString().split('T')[0];

    if (!scheduleDate) {
      showToast('Please select a delivery date', 'error');
      hasFormError = true;
    } else if (scheduleDate < today) {
      showToast('Delivery date cannot be in the past', 'error');
      hasFormError = true;
    }

    if (!scheduleTime) {
      showToast('Please select a preferred delivery time slot', 'error');
      hasFormError = true;
    }
  }

  // Validate Card Details (if card payment selected)
  if (selectedPaymentMethod === 'card') {
    const cardNumber = document.getElementById('card-number')?.value.trim();
    const cardExpiry = document.getElementById('card-expiry')?.value.trim();
    const cardCVV = document.getElementById('card-cvv')?.value.trim();
    const cardName = document.getElementById('card-name')?.value.trim();

    if (!cardNumber || (typeof FreshValidator !== 'undefined' && !FreshValidator.isValidCardNumber(cardNumber))) {
      if (typeof FreshValidator !== 'undefined') FreshValidator.showFieldError('card-number', 'Please enter a valid 16-digit card number');
      hasFormError = true;
    } else if (typeof FreshValidator !== 'undefined') {
      FreshValidator.clearFieldError('card-number');
    }

    if (typeof FreshValidator !== 'undefined') {
      const expCheck = FreshValidator.isValidCardExpiry(cardExpiry);
      if (!expCheck.valid) {
        FreshValidator.showFieldError('card-expiry', expCheck.message);
        hasFormError = true;
      } else {
        FreshValidator.clearFieldError('card-expiry');
      }
    }

    if (!cardCVV || (typeof FreshValidator !== 'undefined' && !FreshValidator.isValidCVV(cardCVV))) {
      if (typeof FreshValidator !== 'undefined') FreshValidator.showFieldError('card-cvv', 'CVV must be 3 or 4 digits');
      hasFormError = true;
    } else if (typeof FreshValidator !== 'undefined') {
      FreshValidator.clearFieldError('card-cvv');
    }

    if (!cardName || (typeof FreshValidator !== 'undefined' && !FreshValidator.isValidCardholderName(cardName))) {
      if (typeof FreshValidator !== 'undefined') FreshValidator.showFieldError('card-name', 'Cardholder name is required (letters only)');
      hasFormError = true;
    } else if (typeof FreshValidator !== 'undefined') {
      FreshValidator.clearFieldError('card-name');
    }
  }

  if (hasFormError) {
    showToast('Please correct the highlighted errors before placing your order', 'error');
    return;
  }

  const fullAddress = address + ', ' + city + ' ' + zip;
  const subtotal = CartManager.getSubtotal();
  const delivery = (typeof PaymentDeliveryManager !== 'undefined') 
    ? PaymentDeliveryManager.getDeliveryFee(selectedDeliveryType, subtotal) 
    : (subtotal >= 50 && selectedDeliveryType !== 'express' ? 0 : (selectedDeliveryType === 'standard' ? 2.99 : 4.99));
  const tax = subtotal * 0.08;
  const total = subtotal + delivery + tax;

  try {
    const order = OrderManager.createOrder(items, session.id, fullAddress, total, { subtotal: subtotal, deliveryFee: delivery, tax: tax });

    if (typeof FreshMartAPI !== 'undefined') {
      try {
        const apiOrderPayload = {
          customerId: session.id,
          subtotal: subtotal,
          deliveryFee: delivery,
          tax: tax,
          totalAmount: total,
          shippingAddress: fullAddress,
          paymentMethod: selectedPaymentMethod.toUpperCase(),
          notes: selectedDeliveryType,
          items: items.map(ci => ({
            productId: ci.productId || ci.id || 1,
            productName: ci.productName || ci.name || 'Grocery Item',
            quantity: ci.quantity || 1,
            unitPrice: ci.unitPrice || ci.price || 0
          }))
        };
        const dbRes = await FreshMartAPI.placeOrder(apiOrderPayload);
        if (dbRes && dbRes.order) {
          order.orderId = dbRes.order.orderCode;
          order.id = dbRes.order.orderId;
        }
      } catch (apiErr) {
        console.warn('[FreshMart] API order placement error:', apiErr);
      }
    }

    const scheduleDate = document.getElementById('schedule-date')?.value;
    const scheduleTime = document.getElementById('schedule-time')?.value;
    let scheduledTime = null;
    if (selectedDeliveryType === 'scheduled' && scheduleDate && scheduleTime) {
      scheduledTime = scheduleDate + 'T' + scheduleTime;
    } else if (selectedDeliveryType === 'express') {
      const d = new Date();
      d.setMinutes(d.getMinutes() + 30);
      scheduledTime = d.toISOString();
    } else {
      const d = new Date();
      d.setHours(d.getHours() + 2);
      scheduledTime = d.toISOString();
    }

    const payment = PaymentDeliveryManager.createPayment(order.id, selectedPaymentMethod.toUpperCase(), total);
    const dRec = PaymentDeliveryManager.createDelivery(order.id, scheduledTime);
    if (dRec && order.orderId) {
      dRec.orderCode = order.orderId;
      dRec.shippingAddress = fullAddress;
      const allDels = JSON.parse(localStorage.getItem('freshcart_deliveries') || '[]');
      const idx = allDels.findIndex(d => d.id === dRec.id);
      if (idx !== -1) {
        allDels[idx].orderCode = order.orderId;
        allDels[idx].shippingAddress = fullAddress;
        localStorage.setItem('freshcart_deliveries', JSON.stringify(allDels));
      }
    }

    // Deduct purchased quantities from stock
    if (typeof ProductCatalog !== 'undefined') {
      const allProducts = ProductCatalog.getProducts();
      items.forEach(ci => {
        const prod = allProducts.find(p => p.id === ci.productId);
        if (prod) {
          prod.stockQuantity = Math.max(0, parseFloat((prod.stockQuantity - ci.quantity).toFixed(3)));
        }
      });
      ProductCatalog.saveProducts(allProducts);
    }

    if (typeof CartManager !== 'undefined') CartManager.clearCart();

    // Generate and display official payment receipt slip with Order ID
    generatePaymentSlip(order, payment, items, selectedDeliveryType, {
      name: name,
      phone: phone,
      address: fullAddress,
      method: selectedPaymentMethod,
      subtotal: subtotal,
      delivery: delivery,
      tax: tax,
      total: total
    });

    showToast('Payment complete! Receipt slip generated for #' + (order.orderId || order.id), 'success');

    window.dispatchEvent(new CustomEvent('orderPlaced', { detail: { orderId: order.id } }));
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ─────────────────────────────────────────────────────────────
   PAYMENT SLIP & RECEIPT GENERATION
   ───────────────────────────────────────────────────────────── */
let _currentSlipOrder = null;

function generatePaymentSlip(order, payment, items, deliveryType, details) {
  _currentSlipOrder = { order, payment, items, deliveryType, details };

  const orderIdStr = order.orderId ? ('#' + order.orderId) : ('#ORD-' + String(order.id).padStart(5, '0'));
  const paymentIdStr = payment ? (payment.paymentId || ('PAY-' + payment.id)) : ('PAY-' + String(order.id).padStart(5, '0'));
  const dateStr = new Date(order.createdAt || new Date()).toLocaleString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const orderIdEl = document.getElementById('slip-order-id');
  const paymentIdEl = document.getElementById('slip-payment-id');
  const dateTimeEl = document.getElementById('slip-date-time');
  const methodEl = document.getElementById('slip-payment-method');
  const custNameEl = document.getElementById('slip-customer-name');
  const custPhoneEl = document.getElementById('slip-customer-phone');
  const custAddrEl = document.getElementById('slip-customer-address');
  const delSlotEl = document.getElementById('slip-delivery-slot');
  const subtotalEl = document.getElementById('slip-subtotal');
  const delFeeEl = document.getElementById('slip-delivery-fee');
  const taxEl = document.getElementById('slip-tax');
  const grandTotalEl = document.getElementById('slip-grand-total');
  const barcodeTextEl = document.getElementById('slip-barcode-text');
  const tbodyEl = document.getElementById('slip-items-tbody');

  if (orderIdEl) orderIdEl.textContent = orderIdStr;
  if (paymentIdEl) paymentIdEl.textContent = paymentIdStr;
  if (dateTimeEl) dateTimeEl.textContent = dateStr;
  if (methodEl) {
    methodEl.textContent = (details.method === 'card') 
      ? 'Credit/Debit Card' 
      : (details.method === 'cod' ? 'Cash on Delivery (COD)' : (details.method || 'Card'));
  }
  if (custNameEl) custNameEl.textContent = details.name || 'Valued Customer';
  if (custPhoneEl) custPhoneEl.textContent = details.phone || '-';
  if (custAddrEl) custAddrEl.textContent = details.address || '-';
  if (delSlotEl) {
    delSlotEl.textContent = (deliveryType === 'express') 
      ? '⚡ Express Delivery (30 mins)' 
      : (deliveryType === 'scheduled' ? '📅 Scheduled Delivery' : '🚚 Standard Delivery (2 hours)');
  }

  // Populate Items Table
  if (tbodyEl) {
    if (items && items.length > 0) {
      tbodyEl.innerHTML = items.map(ci => {
        const prod = (typeof ProductCatalog !== 'undefined') ? ProductCatalog.readProductById(ci.productId) : null;
        const name = prod ? prod.name : (ci.productName || 'Grocery Item');
        const rawImg = prod ? prod.imageUrl : '';
        const imgUrl = (typeof FreshMartImage !== 'undefined') ? FreshMartImage.resolveUrl(rawImg) : (rawImg || 'images/products/apples.jpg');
        const imgTag = '<img src="' + imgUrl + '" alt="' + name + '" style="width:24px;height:24px;object-fit:cover;border-radius:4px;vertical-align:middle;margin-right:8px;" onerror="this.onerror=null;this.src=\'images/products/apples.jpg\';">';
        const unit = (prod && prod.pricingType === 'per_kg') ? 'kg' : ((prod && prod.pricingType === 'per_liter') ? 'L' : 'unit');
        const unitPrice = ci.unitPrice != null ? ci.unitPrice : (prod ? ((prod.discountPrice && prod.discountPrice < prod.price) ? prod.discountPrice : prod.price) : 0);
        const itemTotal = unitPrice * ci.quantity;

        const formattedQty = (typeof ProductCatalog !== 'undefined' && typeof ProductCatalog.formatQuantity === 'function')
          ? ProductCatalog.formatQuantity(ci.quantity, prod)
          : (ci.quantity + ' ' + unit);

        return '<tr style="border-bottom: 1px solid #f3f4f6;">' +
          '<td style="padding: 8px 4px; font-weight: 500;">' + imgTag + name + '</td>' +
          '<td style="padding: 8px 4px; text-align: center; color: #4b5563;">' + formattedQty + '</td>' +
          '<td style="padding: 8px 4px; text-align: right; font-family: var(--font-mono); color: #4b5563;">Rs ' + unitPrice.toFixed(2) + '</td>' +
          '<td style="padding: 8px 4px; text-align: right; font-family: var(--font-mono); font-weight: 700; color: #111827;">Rs ' + itemTotal.toFixed(2) + '</td>' +
          '</tr>';
      }).join('');
    } else {
      tbodyEl.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 12px; color: #9ca3af;">Grocery items verified</td></tr>';
    }
  }

  if (subtotalEl) subtotalEl.textContent = 'Rs ' + (details.subtotal || 0).toFixed(2);
  if (delFeeEl) delFeeEl.textContent = 'Rs ' + (details.delivery != null ? details.delivery : 0).toFixed(2);
  if (taxEl) taxEl.textContent = 'Rs ' + (details.tax || 0).toFixed(2);
  if (grandTotalEl) grandTotalEl.textContent = 'Rs ' + (details.total || order.totalAmount || 0).toFixed(2);
  if (barcodeTextEl) barcodeTextEl.textContent = orderIdStr.replace(/^#/, '');

  // Show Slip Modal
  const slipModal = document.getElementById('payment-slip-modal');
  const slipBackdrop = document.getElementById('payment-slip-backdrop');
  if (slipModal && slipBackdrop) {
    slipBackdrop.classList.add('active');
    slipModal.classList.add('active');
  } else {
    const successModal = document.getElementById('success-modal');
    const successBackdrop = document.getElementById('success-modal-backdrop');
    const orderIdEl = document.getElementById('success-order-id');
    if (orderIdEl) orderIdEl.textContent = orderIdStr;
    if (successModal && successBackdrop) {
      successBackdrop.classList.add('active');
      successModal.classList.add('active');
    }
  }
}

function hidePaymentSlipModal() {
  document.getElementById('payment-slip-backdrop')?.classList.remove('active');
  document.getElementById('payment-slip-modal')?.classList.remove('active');
}

function printPaymentSlip() {
  window.print();
}

function downloadPaymentSlip() {
  if (!_currentSlipOrder) return;
  const { order, payment, items, details } = _currentSlipOrder;
  const orderIdStr = order.orderId ? ('#' + order.orderId) : ('#ORD-' + order.id);
  const paymentIdStr = payment ? (payment.paymentId || ('PAY-' + payment.id)) : ('PAY-' + order.id);
  const dateStr = new Date(order.createdAt || new Date()).toLocaleString();

  let text = '===================================================\n';
  text += '              FRESHMART GROCERY STORES             \n';
  text += '       42 Galle Face, Colombo 03, Sri Lanka        \n';
  text += '      Hotline: +94 11 234 5678 | www.freshmart.lk   \n';
  text += '===================================================\n';
  text += '           OFFICIAL PAYMENT RECEIPT / SLIP         \n';
  text += '                 STATUS: PAID (VERIFIED)           \n';
  text += '===================================================\n\n';
  text += `ORDER ID:        ${orderIdStr}\n`;
  text += `PAYMENT REF:     ${paymentIdStr}\n`;
  text += `DATE & TIME:     ${dateStr}\n`;
  text += `CUSTOMER:        ${details.name || 'Customer'}\n`;
  text += `CONTACT PHONE:   ${details.phone || '-'}\n`;
  text += `DELIVERY TO:     ${details.address || '-'}\n`;
  text += `PAYMENT METHOD:  ${details.method ? details.method.toUpperCase() : 'CARD'}\n`;
  text += '---------------------------------------------------\n';
  text += 'ITEM DESCRIPTION         QTY       PRICE      TOTAL\n';
  text += '---------------------------------------------------\n';
  
  if (items && items.length > 0) {
    items.forEach(ci => {
      const prod = (typeof ProductCatalog !== 'undefined') ? ProductCatalog.readProductById(ci.productId) : null;
      const name = ((prod ? prod.name : (ci.productName || 'Item')) + '               ').slice(0, 20);
      const qty = (String(ci.quantity) + '     ').slice(0, 8);
      const price = ci.unitPrice != null ? ci.unitPrice : (prod ? prod.price : 0);
      const lineTotal = (price * ci.quantity).toFixed(2);
      text += `${name} ${qty} Rs ${price.toFixed(2)}  Rs ${lineTotal}\n`;
    });
  }
  text += '---------------------------------------------------\n';
  text += `SUBTOTAL:                           Rs ${(details.subtotal || 0).toFixed(2)}\n`;
  text += `DELIVERY CHARGE:                    Rs ${(details.delivery != null ? details.delivery : 0).toFixed(2)}\n`;
  text += `TAX (8%):                           Rs ${(details.tax || 0).toFixed(2)}\n`;
  text += '===================================================\n';
  text += `GRAND TOTAL PAID:                   Rs ${(details.total || order.totalAmount || 0).toFixed(2)}\n`;
  text += '===================================================\n';
  text += '   Thank you for ordering fresh with FreshMart!    \n';
  text += '     Retain this payment slip for delivery proof   \n';
  text += '===================================================\n';

  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `FreshMart-Slip-${orderIdStr.replace('#', '')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* ── Admin Payments Rendering ── */
function renderAdminPayments() {
  const tbody = document.getElementById('admin-payments-table');
  if (!tbody) return;

  const payments = PaymentDeliveryManager.getPayments();
  if (payments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center body-sm" style="padding: 40px;">No payment records</td></tr>';
    return;
  }

  const methodLabels = { CARD: 'Credit Card', COD: 'Cash on Delivery', BANK_TRANSFER: 'Bank Transfer' };
  const statusClasses = { PENDING: 'warning', COMPLETED: 'success', FAILED: 'danger', REFUNDED: 'info' };

  tbody.innerHTML = payments.map(p => {
    const date = new Date(p.transactionDate).toLocaleDateString();
    return '<tr>' +
      '<td class="font-mono body-sm">' + (p.paymentId || '#' + p.id) + '</td>' +
      '<td class="font-mono body-sm">#ORD-' + (p.orderId || '') + '</td>' +
      '<td class="body-sm">' + (methodLabels[p.method] || p.method) + '</td>' +
      '<td class="font-mono" style="font-weight: 600;">Rs ' + p.amount.toFixed(2) + '</td>' +
      '<td><span class="badge badge-' + (statusClasses[p.status] || 'neutral') + '">' + p.status + '</span></td>' +
      '<td class="body-sm">' + date + '</td>' +
      '<td><button class="btn btn-ghost btn-sm" onclick="showStatusModal(\'payment\', ' + p.id + ', \'' + p.status + '\', [\'PENDING\',\'COMPLETED\',\'FAILED\',\'REFUNDED\'])">&#9881;</button></td>' +
      '</tr>';
  }).join('');
}

/* ── Admin Deliveries Rendering ── */
function renderAdminDeliveries() {
  const tbody = document.getElementById('admin-deliveries-table');
  if (!tbody) return;

  const deliveries = PaymentDeliveryManager.getDeliveries();
  renderAdminDeliveryPricing();

  if (deliveries.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center body-sm" style="padding: 40px;">No delivery records</td></tr>';
    return;
  }

  const statusClasses = { SCHEDULED: 'info', IN_TRANSIT: 'warning', DELIVERED: 'success', CANCELLED: 'danger' };

  tbody.innerHTML = deliveries.map(d => {
    let staffName = 'Unassigned';
    if (d.assignedStaffId && typeof AccountManager !== 'undefined') {
      const staff = AccountManager.readUserById(d.assignedStaffId);
      if (staff) staffName = staff.name;
    }
    const scheduled = d.scheduledTime ? new Date(d.scheduledTime).toLocaleString() : 'N/A';

    const session = typeof AccountManager !== 'undefined' ? AccountManager.getSession() : null;
    const canAssign = session && (session.role === 'DEPT_DELIVERY' || session.role === 'ADMIN');
    
    let displayCode = d.orderCode;
    if (!displayCode && typeof OrderManager !== 'undefined') {
      const ord = OrderManager.readOrderById(d.orderId) || OrderManager.getOrders().find(o => o.orderId === d.orderId);
      if (ord) displayCode = ord.orderId;
    }
    if (!displayCode) {
      displayCode = String(d.orderId).startsWith('ORD-') ? d.orderId : 'ORD-' + d.orderId;
    }
    if (!displayCode.startsWith('#')) {
      displayCode = '#' + displayCode;
    }

    return '<tr>' +
      '<td class="font-mono body-sm">' + (d.deliveryId || '#' + d.id) + '</td>' +
      '<td class="font-mono body-sm">' + displayCode + '</td>' +
      '<td class="body-sm">' + staffName + '</td>' +
      '<td><span class="badge badge-' + (statusClasses[d.status] || 'neutral') + '">' + d.status + '</span></td>' +
      '<td class="body-sm">' + scheduled + '</td>' +
      '<td><div class="flex gap-xs">' +
      (canAssign ? '<button class="btn btn-outline btn-sm" onclick="showAssignStaffModal(' + d.id + ')" title="Assign Staff">&#128100; Assign</button>' : '') +
      (canAssign ? '<button class="btn btn-ghost btn-sm" onclick="showStatusModal(\'delivery\', ' + d.id + ', \'' + d.status + '\', [\'SCHEDULED\',\'IN_TRANSIT\',\'DELIVERED\',\'CANCELLED\'])">&#9881;</button>' : '') +
      '</div></td>' +
      '</tr>';
  }).join('');
}

/* ── Admin Delivery Pricing Management ── */
function renderAdminDeliveryPricing() {
  const cfg = PaymentDeliveryManager.getDeliveryConfig();
  const stdEl = document.getElementById('disp-standard-fee');
  const expEl = document.getElementById('disp-express-fee');
  const freeEl = document.getElementById('disp-free-threshold');
  const reasonEl = document.getElementById('disp-fee-reason');
  const updatedEl = document.getElementById('delivery-config-updated');
  const reasonTextEl = document.getElementById('delivery-config-reason-display');

  if (stdEl) stdEl.textContent = 'Rs ' + cfg.standardFee.toFixed(2);
  if (expEl) expEl.textContent = 'Rs ' + cfg.expressFee.toFixed(2);
  if (freeEl) freeEl.textContent = cfg.freeThreshold > 0 ? ('Rs ' + cfg.freeThreshold.toFixed(2)) : 'Disabled';
  if (reasonEl) reasonEl.textContent = cfg.reason || 'Standard flat rate';
  if (reasonTextEl) reasonTextEl.textContent = cfg.reason || 'Fixed amount for any distance regardless of kilometers.';
  if (updatedEl) {
    const dt = cfg.updatedAt ? new Date(cfg.updatedAt).toLocaleDateString() : 'Recently';
    updatedEl.textContent = 'Last updated: ' + dt + (cfg.updatedBy ? (' by ' + cfg.updatedBy) : '');
  }

  const editBtn = document.getElementById('btn-edit-delivery-pricing');
  const session = typeof AccountManager !== 'undefined' ? AccountManager.getSession() : null;
  const canEdit = session && (session.role === 'DEPT_DELIVERY' || session.role === 'ADMIN');
  if (editBtn) {
    editBtn.style.display = canEdit ? 'inline-flex' : 'none';
  }
}

function showDeliveryPricingModal() {
  const session = typeof AccountManager !== 'undefined' ? AccountManager.getSession() : null;
  const canEdit = session && (session.role === 'DEPT_DELIVERY' || session.role === 'ADMIN');
  if (!canEdit) {
    if (typeof showToast === 'function') showToast('Only Delivery Head or Admin can modify delivery pricing', 'error');
    return;
  }

  const cfg = PaymentDeliveryManager.getDeliveryConfig();
  const stdInput = document.getElementById('cfg-standard-fee');
  const expInput = document.getElementById('cfg-express-fee');
  const freeInput = document.getElementById('cfg-free-threshold');
  const reasonInput = document.getElementById('cfg-fee-reason');

  if (stdInput) stdInput.value = cfg.standardFee.toFixed(2);
  if (expInput) expInput.value = cfg.expressFee.toFixed(2);
  if (freeInput) freeInput.value = cfg.freeThreshold.toFixed(2);
  if (reasonInput) reasonInput.value = cfg.reason || '';

  if (typeof showModal === 'function') showModal('delivery-pricing-modal');
}

function setPricingReasonPreset(presetText) {
  const reasonInput = document.getElementById('cfg-fee-reason');
  if (reasonInput) {
    reasonInput.value = presetText;
  }
}

function handleSaveDeliveryPricing(e) {
  if (e && e.preventDefault) e.preventDefault();
  const session = typeof AccountManager !== 'undefined' ? AccountManager.getSession() : null;
  const canEdit = session && (session.role === 'DEPT_DELIVERY' || session.role === 'ADMIN');
  if (!canEdit) {
    if (typeof showToast === 'function') showToast('Permission denied: Only Delivery Head or Admin can modify delivery pricing', 'error');
    return false;
  }

  const stdFee = parseFloat(document.getElementById('cfg-standard-fee')?.value);
  const expFee = parseFloat(document.getElementById('cfg-express-fee')?.value);
  const freeThreshold = parseFloat(document.getElementById('cfg-free-threshold')?.value) || 0;
  const reason = document.getElementById('cfg-fee-reason')?.value.trim();

  if (isNaN(stdFee) || stdFee < 0) {
    if (typeof showToast === 'function') showToast('Please enter a valid standard delivery fee', 'error');
    return false;
  }
  if (isNaN(expFee) || expFee < 0) {
    if (typeof showToast === 'function') showToast('Please enter a valid express delivery fee', 'error');
    return false;
  }
  if (!reason) {
    if (typeof showToast === 'function') showToast('Please state a reason for this delivery fee adjustment', 'error');
    return false;
  }

  try {
    PaymentDeliveryManager.updateDeliveryConfig({
      standardFee: stdFee,
      expressFee: expFee,
      freeThreshold: freeThreshold,
      reason: reason,
      updatedBy: session ? session.name : 'Delivery Head'
    });

    if (typeof hideModal === 'function') hideModal('delivery-pricing-modal');
    if (typeof showToast === 'function') showToast('Delivery charges updated successfully!', 'success');
    renderAdminDeliveryPricing();
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message, 'error');
  }
  return false;
}

/* ── Assign Staff Modal ── */
let assignStaffDeliveryId = null;

function showAssignStaffModal(deliveryId) {
  assignStaffDeliveryId = deliveryId;
  const delivery = PaymentDeliveryManager.readDeliveryById(deliveryId);
  if (!delivery) return;

  const select = document.getElementById('assign-staff-select');
  if (!select) return;

  let options = '<option value="">-- Unassigned --</option>';
  if (typeof AccountManager !== 'undefined') {
    const users = AccountManager.readAllUsers();
    const staff = users.filter(u => u.role === 'DELIVERY_STAFF' || u.role === 'DELIVERY_SUPERVISOR' || u.role === 'DEPT_DELIVERY');
    options += staff.map(u => {
      const selected = delivery.assignedStaffId === u.id ? ' selected' : '';
      return '<option value="' + u.id + '"' + selected + '>' + u.name + ' (' + u.role.replace('_', ' ') + ')</option>';
    }).join('');
  }
  select.innerHTML = options;

  const currentLabel = document.getElementById('assign-staff-current');
  if (currentLabel) {
    if (delivery.assignedStaffId && typeof AccountManager !== 'undefined') {
      const current = AccountManager.readUserById(delivery.assignedStaffId);
      currentLabel.textContent = current ? current.name : 'Unknown';
    } else {
      currentLabel.textContent = 'None';
    }
  }

  if (typeof showModal === 'function') showModal('assign-staff-modal');
}

function confirmAssignStaff() {
  if (!assignStaffDeliveryId) return;
  const select = document.getElementById('assign-staff-select');
  if (!select) return;

  const staffId = select.value ? parseInt(select.value) : null;
  try {
    PaymentDeliveryManager.assignStaff(assignStaffDeliveryId, staffId);
    if (typeof hideModal === 'function') hideModal('assign-staff-modal');
    if (typeof showToast === 'function') {
      showToast(staffId ? 'Staff assigned successfully' : 'Staff unassigned', 'success');
    }
    if (typeof renderAdminDeliveries === 'function') renderAdminDeliveries();
  } catch (e) {
    if (typeof showToast === 'function') showToast('Failed to assign staff', 'error');
  }
  assignStaffDeliveryId = null;
}

/* ── Checkout Summary Init ── */
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('checkout-items')) {
    updateCheckoutSummary();

    if (typeof AccountManager !== 'undefined') {
      const session = AccountManager.getSession();
      if (session) {
        const fullUser = AccountManager.readUserById(session.id);
        const nameInput = document.getElementById('ship-name');
        if (nameInput && !nameInput.value) nameInput.value = session.name || '';
        const phoneInput = document.getElementById('ship-phone');
        if (phoneInput && !phoneInput.value && fullUser?.phone) phoneInput.value = fullUser.phone;
        const addrInput = document.getElementById('ship-address');
        if (addrInput && !addrInput.value && fullUser?.address) addrInput.value = fullUser.address;
      }
    }
  }
});
