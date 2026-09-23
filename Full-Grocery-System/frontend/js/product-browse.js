/* ============================================
   Shared UI Utilities (used by all modules)
   ============================================ */

function showModal(id) {
  const backdrop = document.getElementById(id + '-backdrop');
  const modal = document.getElementById(id);
  if (backdrop) backdrop.classList.add('active');
  if (modal) modal.classList.add('active');
}

function hideModal(id) {
  const backdrop = document.getElementById(id + '-backdrop');
  const modal = document.getElementById(id);
  if (backdrop) backdrop.classList.remove('active');
  if (modal) modal.classList.remove('active');
}

function showToast(message, type) {
  type = type || 'info';
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { success: '\u2713', error: '\u2717', warning: '\u26A0', info: '\u2139' };
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.innerHTML = '<span class="toast-icon">' + (icons[type] || '') + '</span>' +
    '<span class="toast-message">' + message + '</span>' +
    '<button class="toast-close" onclick="this.parentElement.classList.add(\'removing\'); setTimeout(() => this.parentElement.remove(), 300);">&times;</button>';
  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }
  }, 3500);
}

/* ============================================
   product-browse.js — Student 3
   Product Search & Browse (Read/Search/Filter)
   ============================================ */

const ProductCatalog = (() => {
  const STORAGE_KEY = 'freshcart_products';
  const CATEGORY_KEY = 'freshcart_categories';

  const defaultCategories = [
    { id: 1, name: 'Fruits', description: 'Fresh seasonal fruits' },
    { id: 2, name: 'Vegetables', description: 'Farm-fresh vegetables' },
    { id: 3, name: 'Dairy', description: 'Milk, cheese, and eggs' },
    { id: 4, name: 'Bakery', description: 'Freshly baked bread and pastries' },
    { id: 5, name: 'Meat', description: 'Quality meats and seafood' },
    { id: 6, name: 'Beverages', description: 'Drinks and refreshments' },
  ];

  const defaultProducts = [
    { id: 1, categoryId: 1, name: 'Organic Avocados', description: 'Creamy Hass avocados, perfectly ripe. Great for guacamole, toast, or salads.', price: 3.99, discountPrice: 2.99, stockQuantity: 50, unit: 'kg', emoji: '\u{1F951}', imageUrl: 'images/products/avocados.jpg' },
    { id: 2, categoryId: 1, name: 'Fresh Strawberries', description: 'Sweet, juicy strawberries picked at peak ripeness. Perfect for smoothies and desserts.', price: 5.49, stockQuantity: 35, unit: 'kg', emoji: '\u{1F353}', imageUrl: 'images/products/strawberries.jpg' },
    { id: 3, categoryId: 1, name: 'Navel Oranges', description: 'Sun-ripened navel oranges, hand-picked for quality. Seedless and bursting with citrus flavor.', price: 4.29, discountPrice: 3.49, stockQuantity: 60, unit: 'kg', emoji: '\u{1F34A}', imageUrl: 'images/products/oranges.jpg' },
    { id: 4, categoryId: 1, name: 'Red Apples', description: 'Crisp and sweet Gala apples, perfect for snacking or baking.', price: 3.79, stockQuantity: 80, unit: 'kg', emoji: '\u{1F34E}', imageUrl: 'images/products/apples.jpg' },
    { id: 5, categoryId: 2, name: 'Broccoli Crown', description: 'Fresh, green broccoli crowns. Steamed, roasted, or stir-fried — nutritious and delicious.', price: 2.99, stockQuantity: 40, unit: 'kg', emoji: '\u{1F966}', imageUrl: 'images/products/broccoli.jpg' },
    { id: 6, categoryId: 2, name: 'Baby Spinach', description: 'Tender baby spinach leaves, triple-washed and ready to eat. Perfect for salads.', price: 3.49, discountPrice: 2.49, stockQuantity: 30, unit: 'kg', emoji: '\u{1F96C}', imageUrl: 'images/products/spinach.jpg' },
    { id: 7, categoryId: 2, name: 'Cherry Tomatoes', description: 'Vine-ripened cherry tomatoes bursting with sweetness.', price: 3.29, stockQuantity: 45, unit: 'kg', emoji: '\u{1F345}', imageUrl: 'images/products/tomatoes.jpg' },
    { id: 8, categoryId: 3, name: 'Organic Whole Milk', description: 'Farm-fresh organic whole milk from grass-fed cows. Rich and creamy.', price: 4.99, discountPrice: 3.99, stockQuantity: 25, unit: 'liter', emoji: '\u{1F95B}', imageUrl: 'images/products/milk.jpg' },
    { id: 9, categoryId: 3, name: 'Free-Range Eggs', description: 'Farm-fresh free-range eggs. Large, golden yolks perfect for any recipe.', price: 5.99, stockQuantity: 40, unit: 'pack', emoji: '\u{1F95A}', imageUrl: 'images/products/eggs.jpg' },
    { id: 10, categoryId: 4, name: 'Sourdough Loaf', description: 'Artisan sourdough bread with a crispy crust and tangy, airy interior.', price: 6.49, stockQuantity: 20, unit: 'unit', emoji: '\u{1F35E}', imageUrl: 'images/products/sourdough.jpg' },
    { id: 11, categoryId: 4, name: 'Croissants (4-pack)', description: 'Buttery, flaky French croissants. Golden brown and perfect with morning coffee.', price: 7.99, discountPrice: 5.99, stockQuantity: 15, unit: 'pack', emoji: '\u{1F950}', imageUrl: 'images/products/croissants.jpg' },
    { id: 12, categoryId: 5, name: 'Atlantic Salmon', description: 'Fresh Atlantic salmon fillet, rich in omega-3. Perfect for grilling or baking.', price: 12.99, discountPrice: 9.99, stockQuantity: 20, unit: 'kg', emoji: '\u{1F41F}', imageUrl: 'images/products/salmon.jpg' },
    { id: 13, categoryId: 5, name: 'Chicken Breast', description: 'Boneless, skinless chicken breasts. Lean protein for healthy meals.', price: 8.99, stockQuantity: 35, unit: 'kg', emoji: '\u{1F357}', imageUrl: 'images/products/chicken.jpg' },
    { id: 14, categoryId: 6, name: 'Cold Brew Coffee', description: 'Smooth, rich cold brew coffee. Low acidity and naturally sweet.', price: 5.49, stockQuantity: 30, unit: 'liter', emoji: '\u{2615}', imageUrl: 'images/products/coffee.jpg' },
    { id: 15, categoryId: 6, name: 'Green Juice Blend', description: 'Cold-pressed green juice with kale, apple, cucumber, and ginger.', price: 6.99, discountPrice: 4.99, stockQuantity: 25, unit: 'liter', emoji: '\u{1F96D}', imageUrl: 'images/products/greenjuice.jpg' },
    { id: 16, categoryId: 2, name: 'Sweet Potatoes', description: 'Organic sweet potatoes, perfect for roasting or mashing.', price: 2.49, stockQuantity: 55, unit: 'kg', emoji: '\u{1F360}', imageUrl: 'images/products/sweetpotatoes.jpg' },
    { id: 17, categoryId: 3, name: 'Greek Yogurt', description: 'Thick and creamy Greek yogurt. High protein, plain or vanilla.', price: 4.49, discountPrice: 3.29, stockQuantity: 30, unit: 'pack', emoji: '\u{1F95B}', imageUrl: 'images/products/yogurt.jpg' },
    { id: 18, categoryId: 1, name: 'Banana Bunch', description: 'Sweet, ripe bananas. Perfect for smoothies, baking, or a quick snack.', price: 1.99, stockQuantity: 100, unit: 'kg', emoji: '\u{1F34C}', imageUrl: 'images/products/bananas.jpg' },
  ];

  function init() {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    if (!stored || parsed.length === 0 || !parsed[0].imageUrl || parsed[0].name !== 'Organic Avocados' || parsed.length < 18 || !parsed[0].imageUrl.startsWith('images/')) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProducts));
    } else {
      let updated = false;
      parsed.forEach(p => {
        if ((p.categoryId === 1 || p.categoryId === 2) && p.unit === 'unit') {
          p.unit = 'kg';
          updated = true;
        }
        if (p.categoryId === 6 && p.unit === 'unit') {
          p.unit = 'liter';
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    }
    if (!localStorage.getItem(CATEGORY_KEY)) {
      localStorage.setItem(CATEGORY_KEY, JSON.stringify(defaultCategories));
    }
    syncFromBackend();
  }

  async function syncFromBackend() {
    if (typeof FreshMartAPI === 'undefined') return;
    try {
      const dbProducts = await FreshMartAPI.getProducts().catch(() => null);
      if (dbProducts && dbProducts.length > 0) {
        const enriched = dbProducts.map(p => {
          const def = defaultProducts.find(d => Number(d.id) === Number(p.id));
          return {
            ...p,
            id: Number(p.id),
            categoryId: Number(p.categoryId),
            price: Number(p.price),
            stockQuantity: Number(p.stockQuantity),
            discountPrice: (p.discountPrice !== undefined)
              ? (p.discountPrice !== null ? Number(p.discountPrice) : null)
              : (def && def.discountPrice !== undefined ? def.discountPrice : null),
            emoji: p.emoji || (def && def.emoji) || '\u{1F34E}',
            imageUrl: p.imageUrl || (def && def.imageUrl) || 'images/products/apples.jpg'
          };
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(enriched));
        if (typeof renderProducts === 'function' && document.getElementById('products-grid')) {
          renderProducts(sortProductList(ProductCatalog.searchAndFilter(currentSearch, currentCategory)));
        }
        if (typeof renderDeals === 'function' && document.getElementById('deals-marquee-inner')) {
          renderDeals();
        }
      }
    } catch (e) {
      console.warn('Backend sync failed, using cached products:', e);
    }
  }

  function getProducts() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  }

  function getCategories() {
    return JSON.parse(localStorage.getItem(CATEGORY_KEY) || '[]');
  }

  function saveProducts(products) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }

  function readProductById(id) {
    if (id === undefined || id === null) return null;
    return getProducts().find(p => Number(p.id) === Number(id)) || null;
  }

  function searchProducts(query) {
    const q = query.toLowerCase();
    return getProducts().filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  }

  function filterByCategory(categoryId) {
    if (categoryId === 'all') return getProducts();
    const products = getProducts();
    if (typeof categoryId === 'string' && isNaN(Number(categoryId))) {
      const cats = getCategories();
      const cat = cats.find(c => c.name.toLowerCase() === categoryId.toLowerCase());
      if (!cat) return [];
      return products.filter(p => Number(p.categoryId) === Number(cat.id));
    }
    return products.filter(p => Number(p.categoryId) === parseInt(categoryId));
  }

  function searchAndFilter(query, categoryId) {
    let results = categoryId === 'all' ? getProducts() : filterByCategory(categoryId);
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    return results;
  }

  function getCategoryName(categoryId) {
    const cat = getCategories().find(c => Number(c.id) === Number(categoryId));
    return cat ? cat.name : 'Uncategorized';
  }

  function getMeasurementType(product) {
    if (!product) return 'unit';
    const unit = (product.unit || '').toLowerCase();
    if (unit === 'kg' || unit === 'g' || product.categoryId === 1 || product.categoryId === 2) {
      return 'weight';
    }
    if (unit === 'liter' || unit === 'l' || unit === 'litre' || unit === 'ml') {
      return 'volume';
    }
    return 'unit';
  }

  function formatQuantity(quantity, product) {
    if (!product) return quantity;
    const mType = getMeasurementType(product);
    if (mType === 'weight') {
      if (quantity < 0.999) {
        const grams = Math.round(quantity * 1000);
        return grams + ' g';
      } else {
        const kg = Number.isInteger(quantity) ? quantity : parseFloat(quantity.toFixed(2));
        return kg + ' kg';
      }
    } else if (mType === 'volume') {
      if (quantity < 0.999) {
        const ml = Math.round(quantity * 1000);
        return ml + ' ml';
      } else {
        const l = Number.isInteger(quantity) ? quantity : parseFloat(quantity.toFixed(2));
        return l + ' L';
      }
    }
    return quantity + (quantity > 1 && product.unit ? ' ' + product.unit + 's' : (product.unit ? ' ' + product.unit : ''));
  }

  return { init, getProducts, getCategories, saveProducts, readProductById, searchProducts, filterByCategory, searchAndFilter, getCategoryName, getMeasurementType, formatQuantity };
})();

/* ── Product Grid Rendering ── */
let currentProducts = [];
let currentSort = 'default';
let currentCategory = 'all';
let currentSearch = '';

function renderProducts(products) {
  currentProducts = products;
  const grid = document.getElementById('products-grid');
  const countEl = document.getElementById('product-count');
  if (!grid) return;

  if (products.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">&#128270;</div>
        <h3 class="empty-state-title">No products found</h3>
        <p class="empty-state-text">Try adjusting your search or filter to find what you're looking for.</p>
      </div>`;
    if (countEl) countEl.textContent = '0 products';
    return;
  }

  if (countEl) countEl.textContent = `${products.length} product${products.length !== 1 ? 's' : ''}`;

  grid.innerHTML = products.map(p => {
    const catName = ProductCatalog.getCategoryName(p.categoryId);
    const stockClass = p.stockQuantity === 0 ? 'out' : p.stockQuantity < 50 ? 'low' : '';
    const stockText = p.stockQuantity === 0 ? 'Out of Stock' : p.stockQuantity < 50 ? `Only ${p.stockQuantity} left` : `${p.stockQuantity} in stock`;
    const hasDiscount = p.discountPrice && p.discountPrice < p.price;
    const imgUrl = (typeof FreshMartImage !== 'undefined') ? FreshMartImage.resolveUrl(p.imageUrl) : (p.imageUrl || 'images/products/apples.jpg');
    return `
      <div class="card product-card fade-in" onclick="showProductDetail(${p.id})">
        <div class="product-image">
          <img src="${imgUrl}" alt="${p.name}" loading="lazy" onerror="this.onerror=null;this.src='images/products/apples.jpg';">
          ${hasDiscount ? `<span class="product-badge sale">-${Math.round((1 - p.discountPrice / p.price) * 100)}%</span>` : ''}
          ${p.stockQuantity < 50 && p.stockQuantity > 0 ? `<span class="product-badge" style="background-color: var(--clr-warning); color: #fff; top: ${hasDiscount ? '38px' : '12px'};">Low Stock</span>` : ''}
        </div>
        <div class="product-quick-actions">
          <button class="btn btn-icon btn-sm btn-primary" data-tooltip="Add to cart" onclick="event.stopPropagation(); quickAddToCart(${p.id})" ${p.stockQuantity === 0 ? 'disabled' : ''}>+</button>
        </div>
        <div class="product-info">
          <div class="product-category">${catName}</div>
          <div class="product-name">${p.name}</div>
          <div class="product-desc">${p.description}</div>
          <div class="product-price-row">
            <div class="product-price">
              ${hasDiscount ? `<span style="text-decoration:line-through;color:var(--clr-text-muted);font-size:0.85em;margin-right:6px;">Rs ${p.price.toFixed(2)}</span>` : ''}
              Rs ${(hasDiscount ? p.discountPrice : p.price).toFixed(2)}
              <span class="unit">/ ${p.unit}</span>
            </div>
            <div class="product-stock ${stockClass}">${stockText}</div>
          </div>
        </div>
      </div>`;
  }).join('');
}

function renderDeals() {
  const container = document.getElementById('deals-marquee-inner');
  if (!container) return;
  const products = ProductCatalog.getProducts().filter(p => p.discountPrice && p.discountPrice < p.price);
  const cardHTML = products.map(p => {
    const discount = Math.round((1 - p.discountPrice / p.price) * 100);
    const imgUrl = (typeof FreshMartImage !== 'undefined') ? FreshMartImage.resolveUrl(p.imageUrl) : (p.imageUrl || 'images/products/apples.jpg');
    return `
      <div class="deal-card" onclick="showProductDetail(${p.id})">
        <div class="deal-img">
          <img src="${imgUrl}" alt="${p.name}" loading="lazy" onerror="this.onerror=null;this.src='images/products/apples.jpg';">
        </div>
        <div class="deal-info">
          <div class="deal-name">${p.name}</div>
          <div class="deal-prices">
            <span class="deal-old">Rs ${p.price.toFixed(2)}</span>
            <span class="deal-new">Rs ${p.discountPrice.toFixed(2)}</span>
          </div>
        </div>
        <div class="deal-discount">-${discount}%</div>
      </div>`;
  }).join('');
  container.innerHTML = cardHTML + cardHTML;
}

function searchProducts() {
  const input = document.getElementById('search-input');
  if (input) currentSearch = input.value;
  const results = ProductCatalog.searchAndFilter(currentSearch, currentCategory);
  renderProducts(sortProductList(results));
}

function filterCategory(cat, el) {
  currentCategory = cat;
  document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
  if (el) el.classList.add('active');
  searchProducts();
}

function sortProducts(sortBy) {
  currentSort = sortBy;
  searchProducts();
}

function sortProductList(products) {
  const sorted = [...products];
  switch (currentSort) {
    case 'price-low': sorted.sort((a, b) => a.price - b.price); break;
    case 'price-high': sorted.sort((a, b) => b.price - a.price); break;
    case 'name': sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
  }
  return sorted;
}

let currentDetailProductId = null;
let currentDetailMeasureType = 'unit';
let detailQty = 1;

function showProductDetail(id) {
  const p = ProductCatalog.readProductById(id);
  if (!p) {
    console.warn('showProductDetail: Product not found for ID', id);
    return;
  }
  currentDetailProductId = Number(p.id);

  document.getElementById('detail-name').textContent = p.name;
  const emojiEl = document.getElementById('detail-emoji');
  const imgUrl = (typeof FreshMartImage !== 'undefined') ? FreshMartImage.resolveUrl(p.imageUrl) : (p.imageUrl || 'images/products/apples.jpg');
  emojiEl.innerHTML = `<img src="${imgUrl}" alt="${p.name}" style="max-height:240px;max-width:100%;object-fit:contain;border-radius:var(--radius-md);" onerror="this.onerror=null;this.src='images/products/apples.jpg';">`;
  document.getElementById('detail-category').textContent = ProductCatalog.getCategoryName(p.categoryId);
  document.getElementById('detail-desc').textContent = p.description;
  const priceEl = document.getElementById('detail-price');
  const hasDiscount = p.discountPrice && p.discountPrice < p.price;
  const effectivePrice = hasDiscount ? p.discountPrice : p.price;
  if (hasDiscount) {
    priceEl.innerHTML = `<span style="text-decoration:line-through;color:var(--clr-text-muted);font-size:0.8em;margin-right:8px;">Rs ${p.price.toFixed(2)}</span>Rs ${p.discountPrice.toFixed(2)}`;
  } else {
    priceEl.textContent = `Rs ${p.price.toFixed(2)}`;
  }
  document.getElementById('detail-unit').textContent = `/ ${p.unit}`;

  const stockEl = document.getElementById('detail-stock');
  if (p.stockQuantity === 0) {
    stockEl.className = 'badge badge-danger';
    stockEl.textContent = 'Out of Stock';
  } else if (p.stockQuantity < 50) {
    stockEl.className = 'badge badge-warning';
    stockEl.textContent = `Only ${p.stockQuantity} left`;
  } else {
    stockEl.className = 'badge badge-success';
    stockEl.textContent = 'In Stock';
  }

  const detailQtyEl = document.getElementById('detail-qty');
  if (detailQtyEl) {
    detailQtyEl.textContent = '1';
    detailQtyEl.dataset.productId = id;
    detailQtyEl.dataset.max = p.stockQuantity;
  }
  detailQty = 1;

  // Setup Custom Measurement or Standard Section
  const mType = ProductCatalog.getMeasurementType(p);
  currentDetailMeasureType = mType;

  const measureSection = document.getElementById('detail-measure-section');
  const standardSection = document.getElementById('detail-standard-section');

  if (mType === 'weight' || mType === 'volume') {
    if (measureSection) measureSection.classList.remove('hidden');
    if (standardSection) standardSection.classList.add('hidden');

    const titleEl = document.getElementById('measure-section-title');
    const subtitleEl = document.getElementById('measure-section-subtitle');
    const unitSelect = document.getElementById('detail-measure-unit');
    const amountInput = document.getElementById('detail-measure-amount');
    const presetsContainer = document.getElementById('measure-presets-container');

    if (mType === 'weight') {
      if (titleEl) titleEl.textContent = 'Specify Desired Weight';
      if (subtitleEl) subtitleEl.textContent = 'Type how much you want (e.g. 100g, 250g, 500g, 1kg)';
      if (unitSelect) {
        unitSelect.innerHTML = '<option value="g">grams (g)</option><option value="kg">kg</option>';
        unitSelect.value = 'g';
      }
      if (amountInput) {
        amountInput.value = '500';
        amountInput.placeholder = 'e.g. 100';
      }

      const presets = [
        { label: '100g', amount: 100, unit: 'g' },
        { label: '250g', amount: 250, unit: 'g' },
        { label: '500g', amount: 500, unit: 'g' },
        { label: '1 kg', amount: 1, unit: 'kg' },
        { label: '2 kg', amount: 2, unit: 'kg' }
      ];

      if (presetsContainer) {
        presetsContainer.innerHTML = presets.map(pr => 
          `<button type="button" class="measure-preset-btn ${pr.amount === 500 && pr.unit === 'g' ? 'active' : ''}" onclick="applyMeasurePreset(${pr.amount}, '${pr.unit}', this)">${pr.label}</button>`
        ).join('');
      }
    } else {
      // volume (liter/ml)
      if (titleEl) titleEl.textContent = 'Specify Desired Volume';
      if (subtitleEl) subtitleEl.textContent = 'Type how much you want (e.g. 200ml, 500ml, 1L)';
      if (unitSelect) {
        unitSelect.innerHTML = '<option value="ml">milliliters (ml)</option><option value="liter">liters (L)</option>';
        unitSelect.value = 'ml';
      }
      if (amountInput) {
        amountInput.value = '500';
        amountInput.placeholder = 'e.g. 250';
      }

      const presets = [
        { label: '250ml', amount: 250, unit: 'ml' },
        { label: '500ml', amount: 500, unit: 'ml' },
        { label: '1 L', amount: 1, unit: 'liter' },
        { label: '1.5 L', amount: 1.5, unit: 'liter' },
        { label: '2 L', amount: 2, unit: 'liter' }
      ];

      if (presetsContainer) {
        presetsContainer.innerHTML = presets.map(pr => 
          `<button type="button" class="measure-preset-btn ${pr.amount === 500 && pr.unit === 'ml' ? 'active' : ''}" onclick="applyMeasurePreset(${pr.amount}, '${pr.unit}', this)">${pr.label}</button>`
        ).join('');
      }
    }

    onDetailMeasureChange();
  } else {
    // Standard count / pack
    if (measureSection) measureSection.classList.add('hidden');
    if (standardSection) standardSection.classList.remove('hidden');
    const stdTotal = document.getElementById('standard-calc-total');
    if (stdTotal) stdTotal.textContent = 'Rs ' + (effectivePrice * detailQty).toFixed(2);
  }

  showModal('product-detail');
}

function applyMeasurePreset(amount, unit, btn) {
  const amountInput = document.getElementById('detail-measure-amount');
  const unitSelect = document.getElementById('detail-measure-unit');
  if (amountInput) amountInput.value = amount;
  if (unitSelect) unitSelect.value = unit;

  document.querySelectorAll('.measure-preset-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  onDetailMeasureChange();
}

function onDetailMeasureChange() {
  const p = ProductCatalog.readProductById(currentDetailProductId);
  if (!p) return;

  const mType = currentDetailMeasureType;
  const amountInput = document.getElementById('detail-measure-amount');
  const unitSelect = document.getElementById('detail-measure-unit');
  const summaryEl = document.getElementById('measure-calc-summary');
  const totalEl = document.getElementById('measure-calc-total');
  const alertEl = document.getElementById('measure-stock-alert');
  const alertText = document.getElementById('measure-stock-alert-text');
  const addBtn = document.getElementById('detail-measure-add-btn');

  let rawAmount = parseFloat(amountInput?.value);
  const selectedUnit = unitSelect?.value || (mType === 'weight' ? 'g' : 'ml');
  const effectivePrice = (p.discountPrice && p.discountPrice < p.price) ? p.discountPrice : p.price;

  // Validation: positive number check
  if (isNaN(rawAmount) || rawAmount <= 0) {
    if (summaryEl) summaryEl.textContent = 'Please enter a valid amount';
    if (totalEl) totalEl.textContent = 'Rs 0.00';
    if (alertEl && alertText) {
      alertText.textContent = 'Please enter a valid amount greater than 0';
      alertEl.classList.remove('hidden');
    }
    if (amountInput) amountInput.classList.add('error');
    if (addBtn) addBtn.disabled = true;
    return;
  }

  let baseQty = 0;
  let displayUnit = selectedUnit;

  if (mType === 'weight') {
    if (selectedUnit === 'g') {
      baseQty = rawAmount / 1000;
      displayUnit = 'g';
    } else {
      baseQty = rawAmount;
      displayUnit = 'kg';
    }
  } else if (mType === 'volume') {
    if (selectedUnit === 'ml') {
      baseQty = rawAmount / 1000;
      displayUnit = 'ml';
    } else {
      baseQty = rawAmount;
      displayUnit = 'L';
    }
  }

  baseQty = parseFloat(baseQty.toFixed(3));

  // Check against Stock Limit
  const cart = (typeof CartManager !== 'undefined') ? CartManager.getCart() : { items: [] };
  const existingCartItem = cart.items.find(i => Number(i.productId) === Number(p.id));
  const alreadyInCart = existingCartItem ? existingCartItem.quantity : 0;
  const totalRequested = parseFloat((alreadyInCart + baseQty).toFixed(3));

  if (p.stockQuantity <= 0) {
    if (alertEl && alertText) {
      alertText.textContent = `${p.name} is currently out of stock!`;
      alertEl.classList.remove('hidden');
    }
    if (amountInput) amountInput.classList.add('error');
    if (addBtn) addBtn.disabled = true;
  } else if (totalRequested > p.stockQuantity) {
    const availableAddition = Math.max(0, parseFloat((p.stockQuantity - alreadyInCart).toFixed(3)));
    const formattedMax = ProductCatalog.formatQuantity(p.stockQuantity, p);
    const formattedAvail = ProductCatalog.formatQuantity(availableAddition, p);
    const formattedInCart = ProductCatalog.formatQuantity(alreadyInCart, p);

    let msg = `Requested amount exceeds available stock! Total stock: ${formattedMax}.`;
    if (alreadyInCart > 0) {
      msg = `Exceeds stock! You already have ${formattedInCart} in cart. You can only add up to ${formattedAvail} more (Total stock: ${formattedMax}).`;
    }

    if (alertEl && alertText) {
      alertText.textContent = msg;
      alertEl.classList.remove('hidden');
    }
    if (amountInput) amountInput.classList.add('error');
    if (addBtn) addBtn.disabled = true;
  } else {
    // Valid and within stock limits
    if (alertEl) alertEl.classList.add('hidden');
    if (amountInput) amountInput.classList.remove('error');
    if (addBtn) addBtn.disabled = false;
  }

  // Live Price Display
  const totalPrice = effectivePrice * baseQty;
  if (summaryEl) {
    const perUnitLabel = mType === 'weight' ? 'kg' : 'liter';
    summaryEl.textContent = `${rawAmount} ${displayUnit} @ Rs ${effectivePrice.toFixed(2)}/${perUnitLabel}`;
  }
  if (totalEl) {
    totalEl.textContent = 'Rs ' + Math.max(0, totalPrice).toFixed(2);
  }
}

function adjustDetailQty(delta) {
  const p = ProductCatalog.readProductById(currentDetailProductId);
  if (!p) return;

  const cart = (typeof CartManager !== 'undefined') ? CartManager.getCart() : { items: [] };
  const existingCartItem = cart.items.find(i => Number(i.productId) === Number(p.id));
  const alreadyInCart = existingCartItem ? existingCartItem.quantity : 0;
  const maxAvailable = Math.max(0, p.stockQuantity - alreadyInCart);

  const alertEl = document.getElementById('standard-stock-alert');
  const alertText = document.getElementById('standard-stock-alert-text');
  const addBtn = document.getElementById('detail-standard-add-btn');

  let nextQty = detailQty + delta;

  if (p.stockQuantity <= 0) {
    detailQty = 0;
    if (alertEl && alertText) {
      alertText.textContent = `${p.name} is currently out of stock!`;
      alertEl.classList.remove('hidden');
    }
    if (addBtn) addBtn.disabled = true;
  } else if (nextQty > maxAvailable) {
    if (alertEl && alertText) {
      alertText.textContent = `Exceeds stock! Only ${p.stockQuantity} available${alreadyInCart > 0 ? ' (' + alreadyInCart + ' already in cart)' : ''}.`;
      alertEl.classList.remove('hidden');
    }
    showToast(`Cannot select more than ${maxAvailable} available items in stock!`, 'warning');
    detailQty = Math.max(1, maxAvailable);
  } else if (nextQty < 1) {
    detailQty = 1;
    if (alertEl) alertEl.classList.add('hidden');
    if (addBtn) addBtn.disabled = false;
  } else {
    detailQty = nextQty;
    if (alertEl) alertEl.classList.add('hidden');
    if (addBtn) addBtn.disabled = false;
  }

  const qtyEl = document.getElementById('detail-qty');
  if (qtyEl) qtyEl.textContent = detailQty;

  const effectivePrice = (p.discountPrice && p.discountPrice < p.price) ? p.discountPrice : p.price;
  const stdTotal = document.getElementById('standard-calc-total');
  if (stdTotal) stdTotal.textContent = 'Rs ' + (effectivePrice * detailQty).toFixed(2);
}

function addToCartFromDetail() {
  const p = ProductCatalog.readProductById(currentDetailProductId);
  if (!p) return;

  const mType = currentDetailMeasureType;
  let finalQty = 1;
  let toastMsg = '';

  const cart = (typeof CartManager !== 'undefined') ? CartManager.getCart() : { items: [] };
  const existingCartItem = cart.items.find(i => Number(i.productId) === Number(p.id));
  const alreadyInCart = existingCartItem ? existingCartItem.quantity : 0;

  if (mType === 'weight' || mType === 'volume') {
    const amount = parseFloat(document.getElementById('detail-measure-amount')?.value);
    const unit = document.getElementById('detail-measure-unit')?.value || (mType === 'weight' ? 'g' : 'ml');
    
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid quantity greater than 0', 'error');
      return;
    }

    if (mType === 'weight') {
      finalQty = unit === 'g' ? (amount / 1000) : amount;
    } else {
      finalQty = unit === 'ml' ? (amount / 1000) : amount;
    }

    finalQty = parseFloat(finalQty.toFixed(3));

    // Stock verification
    if (p.stockQuantity <= 0) {
      showToast(`${p.name} is currently out of stock!`, 'error');
      return;
    }

    if (alreadyInCart + finalQty > p.stockQuantity) {
      const maxAvailable = Math.max(0, parseFloat((p.stockQuantity - alreadyInCart).toFixed(3)));
      const formattedMax = ProductCatalog.formatQuantity(p.stockQuantity, p);
      const formattedAvail = ProductCatalog.formatQuantity(maxAvailable, p);
      showToast(`Cannot add: Requested amount exceeds stock! Only ${formattedAvail} more can be added (Total stock: ${formattedMax})`, 'error');
      return;
    }

    const readable = ProductCatalog.formatQuantity(finalQty, p);
    const effectivePrice = (p.discountPrice && p.discountPrice < p.price) ? p.discountPrice : p.price;
    toastMsg = `Added ${readable} of ${p.name} (Rs ${(effectivePrice * finalQty).toFixed(2)})`;
  } else {
    finalQty = detailQty;
    if (finalQty <= 0) {
      showToast('Quantity must be at least 1', 'error');
      return;
    }
    if (alreadyInCart + finalQty > p.stockQuantity) {
      showToast(`Cannot add: Only ${p.stockQuantity} available in stock!`, 'error');
      return;
    }
    toastMsg = `Added ${finalQty} ${p.name} to cart`;
  }

  if (typeof CartManager !== 'undefined') {
    const added = CartManager.addItem(Number(p.id), finalQty);
    if (added) {
      showToast(toastMsg, 'success');
      hideModal('product-detail');
      detailQty = 1;
    }
  }
}

function quickAddToCart(id) {
  const p = ProductCatalog.readProductById(id);
  if (!p) return;

  if (p.stockQuantity <= 0) {
    showToast(`${p.name} is currently out of stock!`, 'error');
    return;
  }

  const mType = ProductCatalog.getMeasurementType(p);
  if (mType === 'weight' || mType === 'volume') {
    showProductDetail(Number(p.id));
    showToast(`Specify how much ${p.name} you would like (${mType === 'weight' ? 'e.g. 100g, 500g' : 'e.g. 250ml, 500ml'})`, 'info');
  } else {
    const cart = (typeof CartManager !== 'undefined') ? CartManager.getCart() : { items: [] };
    const existing = cart.items.find(i => Number(i.productId) === Number(p.id));
    const alreadyInCart = existing ? existing.quantity : 0;
    if (alreadyInCart + 1 > p.stockQuantity) {
      showToast(`Cannot add more: Only ${p.stockQuantity} available in stock!`, 'error');
      return;
    }
    if (typeof CartManager !== 'undefined') {
      const added = CartManager.addItem(Number(p.id), 1);
      if (added) {
        showToast(`${p.name} added to cart!`, 'success');
      }
    }
  }
}

/* ── Navbar Scroll ── */
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 10);
});

/* ── Search on Enter ── */
document.addEventListener('DOMContentLoaded', () => {
  ProductCatalog.init();
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') searchProducts(); });
  }
  if (document.getElementById('products-grid')) {
    renderProducts(ProductCatalog.getProducts());
  }
  if (document.getElementById('deals-marquee-inner')) {
    renderDeals();
  }
  initHeroCarousel();
});

/* ── Hero Offer Carousel ── */
let heroSlideIndex = 0;
let heroAutoTimer = null;

function initHeroCarousel() {
  const slides = document.querySelectorAll('.hero-slide');
  if (!slides.length) return;
  heroSlideIndex = 0;
  updateHeroSlide();
  startHeroAuto();
}

function updateHeroSlide() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  slides.forEach((s, i) => s.classList.toggle('active', i === heroSlideIndex));
  dots.forEach((d, i) => d.classList.toggle('active', i === heroSlideIndex));
}

function goToHeroSlide(index) {
  heroSlideIndex = index;
  updateHeroSlide();
  resetHeroAuto();
}

function nextHeroSlide() {
  const total = document.querySelectorAll('.hero-slide').length;
  heroSlideIndex = (heroSlideIndex + 1) % total;
  updateHeroSlide();
}

function startHeroAuto() {
  stopHeroAuto();
  heroAutoTimer = setInterval(nextHeroSlide, 3500);
}

function stopHeroAuto() {
  if (heroAutoTimer) { clearInterval(heroAutoTimer); heroAutoTimer = null; }
}

function resetHeroAuto() { stopHeroAuto(); startHeroAuto(); }

function claimDeal(productId) {
  const product = ProductCatalog.readProductById(productId);
  if (!product) return;
  const mType = ProductCatalog.getMeasurementType(product);
  if (mType === 'weight' || mType === 'volume') {
    showProductDetail(Number(product.id));
    showToast(`Specify how much ${product.name} you want for this deal`, 'info');
  } else {
    if (typeof CartManager !== 'undefined') {
      CartManager.addItem(Number(product.id), 1);
      showToast(`${product.name} added to cart!`, 'success');
    }
  }
}

function toggleMobileNav() {
  const nav = document.querySelector('.navbar-nav');
  if (nav) {
    nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
    nav.style.position = 'absolute';
    nav.style.top = '72px';
    nav.style.left = '0';
    nav.style.right = '0';
    nav.style.background = 'white';
    nav.style.flexDirection = 'column';
    nav.style.padding = '16px';
    nav.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
    nav.style.borderRadius = '0 0 12px 12px';
    nav.style.zIndex = '999';
  }
}
