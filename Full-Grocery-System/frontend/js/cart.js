/* ============================================
   cart.js — Student 4
   Shopping Cart Management (CRUD)
   ============================================ */

const CartManager = (() => {
  const CART_KEY = 'freshcart_cart';

  function getCurrentCustomerId() {
    if (typeof AccountManager !== 'undefined' && typeof AccountManager.getSession === 'function') {
      const session = AccountManager.getSession();
      if (session && session.id) return Number(session.id);
    }
    return 1003; // Default customer in FreshMartDB
  }

  function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY) || '{"items":[],"userId":null}');
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
  }

  function getItems() {
    return getCart().items || [];
  }

  function addItem(productId, quantity) {
    productId = Number(productId);
    const product = (typeof ProductCatalog !== 'undefined') ? ProductCatalog.readProductById(productId) : null;
    const cart = getCart();
    const existing = cart.items.find(i => Number(i.productId) === productId);
    const currentQty = existing ? existing.quantity : 0;
    const newTotal = parseFloat((currentQty + quantity).toFixed(3));

    if (product) {
      if (product.stockQuantity <= 0) {
        showToast(`Cannot add: "${product.name}" is out of stock!`, 'error');
        return false;
      }
      if (newTotal > product.stockQuantity) {
        const formattedStock = (typeof ProductCatalog.formatQuantity === 'function') 
          ? ProductCatalog.formatQuantity(product.stockQuantity, product) 
          : product.stockQuantity;
        showToast(`Cannot add: Requested quantity exceeds available stock (${formattedStock}) for "${product.name}"!`, 'error');
        return false;
      }
    }

    if (existing) {
      existing.quantity = newTotal;
    } else {
      cart.items.push({ productId, quantity: parseFloat(quantity.toFixed(3)) });
    }
    saveCart(cart);
    if (document.getElementById('cart-items-list')) renderCartPage();

    // Live Database Sync: Persist to shopping_carts & cart_items
    if (typeof FreshMartAPI !== 'undefined' && typeof FreshMartAPI.addToCart === 'function') {
      const custId = getCurrentCustomerId();
      FreshMartAPI.addToCart(custId, productId, quantity).catch(e => console.warn('DB cart add sync:', e));
    }

    return true;
  }

  function updateQuantity(productId, quantity) {
    productId = Number(productId);
    const cart = getCart();
    quantity = parseFloat(Number(quantity).toFixed(3));
    const product = (typeof ProductCatalog !== 'undefined') ? ProductCatalog.readProductById(productId) : null;
    if (product && quantity > product.stockQuantity) {
      const formattedStock = (typeof ProductCatalog.formatQuantity === 'function') 
        ? ProductCatalog.formatQuantity(product.stockQuantity, product) 
        : product.stockQuantity;
      showToast(`Cannot update quantity: Maximum available stock for "${product.name}" is ${formattedStock}!`, 'error');
      return cart;
    }
    if (quantity <= 0.001) {
      cart.items = cart.items.filter(i => Number(i.productId) !== productId);
    } else {
      const item = cart.items.find(i => Number(i.productId) === productId);
      if (item) item.quantity = quantity;
    }
    saveCart(cart);
    if (document.getElementById('cart-items-list')) renderCartPage();

    // Live Database Sync: Persist to shopping_carts & cart_items
    if (typeof FreshMartAPI !== 'undefined' && typeof FreshMartAPI.updateCartItem === 'function') {
      const custId = getCurrentCustomerId();
      FreshMartAPI.updateCartItem(custId, productId, quantity).catch(e => console.warn('DB cart update sync:', e));
    }

    return cart;
  }

  function removeItem(productId) {
    productId = Number(productId);
    const cart = getCart();
    cart.items = cart.items.filter(i => Number(i.productId) !== productId);
    saveCart(cart);
    showToast('Item removed from cart', 'info');
    if (document.getElementById('cart-items-list')) renderCartPage();

    // Live Database Sync: Remove from cart_items
    if (typeof FreshMartAPI !== 'undefined' && typeof FreshMartAPI.removeFromCart === 'function') {
      const custId = getCurrentCustomerId();
      FreshMartAPI.removeFromCart(custId, productId).catch(e => console.warn('DB cart remove sync:', e));
    }

    return cart;
  }

  function clearCart() {
    localStorage.setItem(CART_KEY, JSON.stringify({ items: [], userId: null }));
    updateCartBadge();
    showToast('Cart cleared', 'info');
    if (document.getElementById('cart-items-list')) renderCartPage();

    // Live Database Sync: Clear from cart_items
    if (typeof FreshMartAPI !== 'undefined' && typeof FreshMartAPI.clearCart === 'function') {
      const custId = getCurrentCustomerId();
      FreshMartAPI.clearCart(custId).catch(e => console.warn('DB cart clear sync:', e));
    }
  }

  async function syncWithDatabase() {
    if (typeof FreshMartAPI === 'undefined' || typeof FreshMartAPI.getCart !== 'function') return;
    try {
      const custId = getCurrentCustomerId();
      const dbRes = await FreshMartAPI.getCart(custId);
      const localCart = getCart();
      const localItems = localCart.items || [];

      if (dbRes && dbRes.success && Array.isArray(dbRes.items)) {
        if (dbRes.items.length > 0) {
          localCart.items = dbRes.items.map(it => ({
            productId: Number(it.productId),
            quantity: Number(it.quantity)
          }));
          localCart.userId = custId;
          localStorage.setItem(CART_KEY, JSON.stringify(localCart));
          updateCartBadge();
          if (document.getElementById('cart-items-list')) renderCartPage();
        } else if (localItems.length > 0) {
          await FreshMartAPI.syncCart(custId, localItems);
        }
      }
    } catch (e) {
      console.warn('Cart syncWithDatabase error:', e);
    }
  }

  function getItemCount() {
    return getItems().length;
  }

  function getSubtotal() {
    if (typeof ProductCatalog === 'undefined') return 0;
    return getItems().reduce((sum, item) => {
      const product = ProductCatalog.readProductById(item.productId);
      if (!product) return sum;
      const effectivePrice = (product.discountPrice && product.discountPrice < product.price) ? product.discountPrice : product.price;
      return sum + (effectivePrice * item.quantity);
    }, 0);
  }

  function updateCartBadge() {
    const badges = document.querySelectorAll('#cart-badge');
    const count = getItemCount();
    badges.forEach(b => {
      b.textContent = count;
      b.classList.toggle('hidden', count === 0);
    });
  }

  return { getCart, getItems, addItem, updateQuantity, removeItem, clearCart, getItemCount, getSubtotal, updateCartBadge, syncWithDatabase, getCurrentCustomerId };
})();

function renderCartPage() {
  const items = CartManager.getItems();
  const listEl = document.getElementById('cart-items-list');
  const emptyEl = document.getElementById('cart-empty');
  const contentEl = document.getElementById('cart-content');
  const countText = document.getElementById('cart-count-text');

  if (!listEl) return;

  if (items.length === 0) {
    if (emptyEl) emptyEl.classList.remove('hidden');
    if (contentEl) contentEl.classList.add('hidden');
    if (countText) countText.textContent = '0 items in your cart';
    return;
  }

  if (emptyEl) emptyEl.classList.add('hidden');
  if (contentEl) contentEl.classList.remove('hidden');
  if (countText) countText.textContent = CartManager.getItemCount() + ' item' + (CartManager.getItemCount() !== 1 ? 's' : '') + ' in your cart';

  listEl.innerHTML = items.map(item => {
    if (typeof ProductCatalog === 'undefined') return '';
    const p = ProductCatalog.readProductById(item.productId);
    if (!p) return '';

    const effectivePrice = (p.discountPrice && p.discountPrice < p.price) ? p.discountPrice : p.price;
    const mType = (typeof ProductCatalog.getMeasurementType === 'function') ? ProductCatalog.getMeasurementType(p) : 'unit';
    const formattedQty = (typeof ProductCatalog.formatQuantity === 'function') ? ProductCatalog.formatQuantity(item.quantity, p) : item.quantity;
    const lineTotal = effectivePrice * item.quantity;

    let controlHtml = '';
    if (mType === 'weight') {
      controlHtml = '<div class="quantity-control weight-control">' +
        '<button title="Decrease 100g" onclick="adjustCartMeasure(' + p.id + ', -0.1)">-</button>' +
        '<span class="qty-value measure-qty-value">' + formattedQty + '</span>' +
        '<button title="Increase 100g" onclick="adjustCartMeasure(' + p.id + ', 0.1)">+</button>' +
        '</div>';
    } else if (mType === 'volume') {
      controlHtml = '<div class="quantity-control volume-control">' +
        '<button title="Decrease 250ml" onclick="adjustCartMeasure(' + p.id + ', -0.25)">-</button>' +
        '<span class="qty-value measure-qty-value">' + formattedQty + '</span>' +
        '<button title="Increase 250ml" onclick="adjustCartMeasure(' + p.id + ', 0.25)">+</button>' +
        '</div>';
    } else {
      controlHtml = '<div class="quantity-control">' +
        '<button onclick="updateCartItemQty(' + p.id + ', ' + (item.quantity - 1) + ')">-</button>' +
        '<span class="qty-value">' + item.quantity + '</span>' +
        '<button onclick="updateCartItemQty(' + p.id + ', ' + (item.quantity + 1) + ')">+</button>' +
        '</div>';
    }

    const imgUrl = (typeof FreshMartImage !== 'undefined') ? FreshMartImage.resolveUrl(p.imageUrl) : (p.imageUrl || 'images/products/apples.jpg');
    return '<div class="cart-item fade-in">' +
      '<div class="cart-item-image"><img src="' + imgUrl + '" alt="' + p.name + '" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-md);" onerror="this.onerror=null;this.src=\'images/products/apples.jpg\';"></div>' +
      '<div class="cart-item-details">' +
      '<div class="cart-item-name">' + p.name + '</div>' +
      '<div class="cart-item-meta">Rs ' + effectivePrice.toFixed(2) + ' / ' + p.unit + '</div>' +
      '</div>' +
      '<div class="cart-item-actions">' +
      controlHtml +
      '<div class="cart-item-price">Rs ' + lineTotal.toFixed(2) + '</div>' +
      '<button class="btn btn-ghost btn-sm" style="color: var(--clr-danger); font-size: 0.78rem;" onclick="removeCartItem(' + p.id + ')">&#128465; Remove</button>' +
      '</div></div>';
  }).join('');

  updateCartSummary();
}

function adjustCartMeasure(productId, delta) {
  const cart = CartManager.getCart();
  const item = cart.items.find(i => i.productId === productId);
  if (!item) return;

  const product = (typeof ProductCatalog !== 'undefined') ? ProductCatalog.readProductById(productId) : null;
  const newQty = parseFloat((item.quantity + delta).toFixed(3));

  if (delta > 0 && product && newQty > product.stockQuantity) {
    const formattedStock = (typeof ProductCatalog.formatQuantity === 'function') 
      ? ProductCatalog.formatQuantity(product.stockQuantity, product) 
      : product.stockQuantity;
    showToast(`Cannot increase: Maximum available stock for "${product.name}" is ${formattedStock}!`, 'warning');
    return;
  }

  if (newQty <= 0.05) {
    CartManager.removeItem(productId);
  } else {
    CartManager.updateQuantity(productId, newQty);
  }
}

function updateCartItemQty(productId, qty) {
  const product = (typeof ProductCatalog !== 'undefined') ? ProductCatalog.readProductById(productId) : null;
  if (product && qty > product.stockQuantity) {
    const formattedStock = (typeof ProductCatalog.formatQuantity === 'function') 
      ? ProductCatalog.formatQuantity(product.stockQuantity, product) 
      : product.stockQuantity;
    showToast(`Cannot increase: Maximum available stock for "${product.name}" is ${formattedStock}!`, 'warning');
    return;
  }
  CartManager.updateQuantity(productId, qty);
}

function removeCartItem(productId) {
  CartManager.removeItem(productId);
}

function clearCart() {
  CartManager.clearCart();
}

function updateCartSummary() {
  const subtotal = CartManager.getSubtotal();
  let deliveryFee = 2.99;
  let freeThreshold = 50.0;
  
  if (typeof PaymentDeliveryManager !== 'undefined') {
    const cfg = PaymentDeliveryManager.getDeliveryConfig();
    freeThreshold = cfg.freeThreshold;
    deliveryFee = (freeThreshold > 0 && subtotal >= freeThreshold) ? 0 : cfg.standardFee;
  } else {
    try {
      const raw = localStorage.getItem('freshcart_delivery_config');
      if (raw) {
        const cfg = JSON.parse(raw);
        freeThreshold = cfg.freeThreshold;
        deliveryFee = (freeThreshold > 0 && subtotal >= freeThreshold) ? 0 : cfg.standardFee;
      }
    } catch (e) {}
  }

  const tax = subtotal * 0.08;
  const total = subtotal + deliveryFee + tax;

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('summary-subtotal', 'Rs ' + subtotal.toFixed(2));
  setEl('summary-delivery', deliveryFee === 0 ? 'FREE' : 'Rs ' + deliveryFee.toFixed(2));
  setEl('summary-tax', 'Rs ' + tax.toFixed(2));
  setEl('summary-total', 'Rs ' + total.toFixed(2));
}

/* ── Init on page load ── */
document.addEventListener('DOMContentLoaded', () => {
  CartManager.updateCartBadge();
  if (document.getElementById('cart-items-list')) {
    renderCartPage();
  }
  CartManager.syncWithDatabase();
});
