/* ============================================
   product-admin.js — Student 2
   Product & Category Management (Admin CRUD)
   ============================================ */

const ProductAdmin = (() => {
  const PRODUCT_KEY = 'freshcart_products';
  const CATEGORY_KEY = 'freshcart_categories';

  function getProducts() {
    const raw = localStorage.getItem(PRODUCT_KEY);
    if (!raw || JSON.parse(raw).length === 0) {
      if (typeof defaultProducts !== 'undefined') {
        localStorage.setItem(PRODUCT_KEY, JSON.stringify(defaultProducts));
        return defaultProducts;
      }
    }
    return JSON.parse(raw || '[]');
  }

  function getCategories() {
    const raw = localStorage.getItem(CATEGORY_KEY);
    if (!raw || JSON.parse(raw).length === 0) {
      if (typeof defaultCategories !== 'undefined') {
        localStorage.setItem(CATEGORY_KEY, JSON.stringify(defaultCategories));
        return defaultCategories;
      }
    }
    return JSON.parse(raw || '[]');
  }

  function saveProducts(products) {
    localStorage.setItem(PRODUCT_KEY, JSON.stringify(products));
  }

  function saveCategories(categories) {
    localStorage.setItem(CATEGORY_KEY, JSON.stringify(categories));
  }

  function genId() {
    return Date.now() + Math.floor(Math.random() * 100);
  }

  function createProduct(data) {
    const products = getProducts();
    const product = {
      id: data.id ? parseInt(data.id) : genId(),
      categoryId: parseInt(data.categoryId),
      supplierId: data.supplierId ? parseInt(data.supplierId) : null,
      name: data.name,
      description: data.description || '',
      price: parseFloat(data.price),
      discountPrice: data.discountPrice ? parseFloat(data.discountPrice) : null,
      stockQuantity: parseFloat(data.stockQuantity) || 0,
      unit: data.unit || 'unit',
      emoji: data.emoji || '\u{1F34E}',
      imageUrl: data.imageUrl || 'images/products/apples.jpg'
    };
    products.push(product);
    saveProducts(products);
    return product;
  }

  function updateProduct(id, data) {
    const products = getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Product not found');
    products[idx] = { ...products[idx], ...data };
    if (data.categoryId) products[idx].categoryId = parseInt(data.categoryId);
    if (data.supplierId) products[idx].supplierId = parseInt(data.supplierId);
    if (data.price) products[idx].price = parseFloat(data.price);
    if (data.stockQuantity !== undefined) products[idx].stockQuantity = parseFloat(data.stockQuantity) || 0;
    saveProducts(products);
    return products[idx];
  }

  function deleteProduct(id) {
    const products = getProducts();
    const filtered = products.filter(p => p.id !== id);
    if (filtered.length === products.length) throw new Error('Product not found');
    saveProducts(filtered);
  }

  function createCategory(data) {
    const categories = getCategories();
    if (categories.find(c => c.name.toLowerCase() === data.name.toLowerCase())) {
      throw new Error('Category already exists');
    }
    const cat = { id: genId(), name: data.name, description: data.description || '' };
    categories.push(cat);
    saveCategories(categories);
    return cat;
  }

  function updateCategory(id, data) {
    const categories = getCategories();
    const idx = categories.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Category not found');
    categories[idx] = { ...categories[idx], ...data };
    saveCategories(categories);
    return categories[idx];
  }

  function deleteCategory(id) {
    const categories = getCategories();
    const filtered = categories.filter(c => c.id !== id);
    if (filtered.length === categories.length) throw new Error('Category not found');
    saveCategories(filtered);
  }

  function getCategoryName(id) {
    const cat = getCategories().find(c => Number(c.id) === Number(id));
    return cat ? cat.name : 'Uncategorized';
  }

  return {
    getProducts, getCategories, createProduct, updateProduct, deleteProduct,
    createCategory, updateCategory, deleteCategory, getCategoryName
  };
})();

/* ── Admin UI Functions ── */
function switchAdminTab(tab, el) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.add('hidden'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  const tabEl = document.getElementById('admin-' + tab);
  if (tabEl) tabEl.classList.remove('hidden');
  if (el) el.classList.add('active');

  if (tab === 'products') renderAdminProducts();
  else if (tab === 'categories') renderAdminCategories();
  else if (tab === 'users') renderAdminUsers();
  else if (tab === 'orders' && typeof renderAdminOrders === 'function') renderAdminOrders();
  else if (tab === 'payments' && typeof renderAdminPayments === 'function') renderAdminPayments();
  else if (tab === 'deliveries') {
    if (typeof renderAdminDeliveries === 'function') renderAdminDeliveries();
    if (typeof renderAdminDeliveryPricing === 'function') renderAdminDeliveryPricing();
  }
  else if (tab === 'reviews') {
    if (typeof renderAdminReviews === 'function') renderAdminReviews();
    if (typeof renderAdminReviewsCharts === 'function') renderAdminReviewsCharts();
    if (typeof renderBestSellersPanel === 'function') renderBestSellersPanel();
  }
  else if (tab === 'inquiries' && typeof renderAdminInquiries === 'function') renderAdminInquiries();
  else if (tab === 'suppliers' && typeof renderAdminSuppliers === 'function') renderAdminSuppliers();
  else if (tab === 'revenue') updateAdminStats();

  updateAdminStats();
}

function renderAdminProducts(filter, searchQuery) {
  const tbody = document.getElementById('admin-products-table');
  if (!tbody) return;
  let products = ProductAdmin.getProducts();

  if (filter && filter !== 'all') {
    products = products.filter(p => p.categoryId === parseInt(filter));
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }

  const statEl = document.getElementById('stat-products');
  if (statEl) statEl.textContent = products.length;

  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center body-sm" style="padding: 40px;">No products found</td></tr>';
    return;
  }

  const session = typeof AccountManager !== 'undefined' ? AccountManager.getSession() : null;
  const canEditProducts = session && (session.role === 'DEPT_PRODUCT' || session.role === 'ADMIN');

  const addProductBtn = document.querySelector('button[onclick="showAddProductModal()"]');
  if (addProductBtn) {
    addProductBtn.style.display = canEditProducts ? 'inline-block' : 'none';
  }

  tbody.innerHTML = products.map(p => {
    const catName = ProductAdmin.getCategoryName(p.categoryId);
    const stockClass = p.stockQuantity === 0 ? 'danger' : p.stockQuantity < 50 ? 'warning' : 'success';
    const stockText = p.stockQuantity === 0 ? 'Out of Stock' : p.stockQuantity < 50 ? 'Low Stock' : 'In Stock';
    const hasDiscount = p.discountPrice && Number(p.discountPrice) < Number(p.price);
    const imgUrl = (typeof FreshMartImage !== 'undefined') ? FreshMartImage.resolveUrl(p.imageUrl) : (p.imageUrl || 'images/products/apples.jpg');
    const imgHtml = `<img src="${imgUrl}" alt="${p.name}" style="width:38px;height:38px;object-fit:cover;border-radius:6px;border:1px solid var(--clr-border);flex-shrink:0;" onerror="this.onerror=null;this.src='images/products/apples.jpg';">`;
    return '<tr>' +
      '<td><div class="flex items-center gap-sm">' + imgHtml + '<div><div class="body-md" style="font-weight: 600;">' + p.name + '</div><div class="body-xs text-muted">' + p.unit + '</div></div></div></td>' +
      '<td><span class="chip">' + catName + '</span></td>' +
      '<td class="font-mono" style="font-weight: 600;">' + 
        (hasDiscount 
          ? '<span style="color:var(--clr-primary);">Rs ' + Number(p.discountPrice).toFixed(2) + '</span> <span class="body-xs text-muted" style="text-decoration:line-through;margin-left:4px;">Rs ' + Number(p.price).toFixed(2) + '</span>' 
          : 'Rs ' + Number(p.price).toFixed(2)) + 
      '</td>' +
      '<td class="font-mono">' + p.stockQuantity + '</td>' +
      '<td><span class="badge badge-' + stockClass + '">' + stockText + '</span>' + 
        (hasDiscount ? ' <span class="badge badge-warning" style="margin-left:4px;">SALE</span>' : '') + 
      '</td>' +
      '<td><div class="flex gap-xs">' +
      (canEditProducts ? '<button class="btn btn-ghost btn-sm" onclick="editProduct(' + p.id + ')">&#9998;</button><button class="btn btn-ghost btn-sm" style="color: var(--clr-danger);" onclick="removeProduct(' + p.id + ')">&#128465;</button>' : '') +
      '</div></td>' +
      '</tr>';
  }).join('');
}

function renderAdminCategories() {
  const grid = document.getElementById('categories-grid');
  if (!grid) return;
  const categories = ProductAdmin.getCategories();
  const products = ProductAdmin.getProducts();

  if (categories.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><div class="empty-state-icon">&#128193;</div><h3 class="empty-state-title">No categories yet</h3><p class="empty-state-text">Create your first category to organize products.</p></div>';
    return;
  }
  const session = typeof AccountManager !== 'undefined' ? AccountManager.getSession() : null;
  const canEditProducts = session && (session.role === 'DEPT_PRODUCT' || session.role === 'ADMIN');

  const addCategoryBtn = document.querySelector('button[onclick="showAddCategoryModal()"]');
  if (addCategoryBtn) {
    addCategoryBtn.style.display = canEditProducts ? 'inline-block' : 'none';
  }

  grid.innerHTML = categories.map(c => {
    const count = products.filter(p => p.categoryId === c.id).length;
    return '<div class="card card-elevated" style="padding: 24px;">' +
      '<div class="flex justify-between items-start" style="margin-bottom: 12px;">' +
      '<div><div class="heading-md">' + c.name + '</div><div class="body-sm text-muted" style="margin-top: 4px;">' + (c.description || 'No description') + '</div></div>' +
      (canEditProducts ? '<div class="flex gap-xs"><button class="btn btn-ghost btn-sm" onclick="editCategory(' + c.id + ')">&#9998;</button><button class="btn btn-ghost btn-sm" style="color: var(--clr-danger);" onclick="removeCategory(' + c.id + ')">&#128465;</button></div>' : '') +
      '</div>' +
      '<div class="body-xs text-muted">' + count + ' product' + (count !== 1 ? 's' : '') + ' in this category</div>' +
      '</div>';
  }).join('');
}

function renderAdminUsers() {
  const tbody = document.getElementById('admin-users-table');
  if (!tbody) return;
  let users;
  if (typeof AccountManager !== 'undefined') {
    users = AccountManager.readAllUsers();
  } else {
    users = JSON.parse(localStorage.getItem('freshcart_users') || '[]');
  }

  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center body-sm" style="padding: 40px;">No users found</td></tr>';
    return;
  }

  const session = typeof AccountManager !== 'undefined' ? AccountManager.getSession() : null;
  const canEditUsers = session && (session.role === 'ADMIN');

  const addUserBtn = document.querySelector('button[onclick="showAddUserModal()"]');
  if (addUserBtn) {
    addUserBtn.style.display = canEditUsers ? 'inline-block' : 'none';
  }

  const roleColors = { ADMIN: 'danger', STORE_MANAGER: 'info', INVENTORY_OFFICER: 'warning', DELIVERY_SUPERVISOR: 'info', DELIVERY_STAFF: 'success', CUSTOMER: 'neutral', DEPT_PRODUCT: 'primary', DEPT_ORDER: 'warning', DEPT_DELIVERY: 'success', DEPT_RATING: 'info', SUPPLIER: 'secondary' };
  const roleLabels = { ADMIN: 'Admin', STORE_MANAGER: 'Store Manager', INVENTORY_OFFICER: 'Inventory Officer', DELIVERY_SUPERVISOR: 'Delivery Supervisor', DELIVERY_STAFF: 'Delivery Staff', CUSTOMER: 'Customer', DEPT_PRODUCT: 'Product Head', DEPT_ORDER: 'Order Head', DEPT_DELIVERY: 'Delivery Head', DEPT_RATING: 'Rating Head', SUPPLIER: 'Supplier' };

  tbody.innerHTML = users.map(u => {
    const date = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A';
    const ac = { ADMIN: ['#fee2e2','#ef4444'], DEPT_PRODUCT: ['#e0e7ff','#4f46e5'], DEPT_ORDER: ['#fef3c7','#d97706'], DEPT_DELIVERY: ['#dcfce7','#16a34a'], DEPT_RATING: ['#e0f2fe','#0284c7'], SUPPLIER: ['#f3e8ff','#9333ea'], DELIVERY_STAFF: ['#d1fae5','#059669'] }[u.role] || ['var(--clr-primary-muted)','var(--clr-primary)'];
    
    return '<tr>' +
      '<td><div class="flex items-center gap-sm"><div style="width:32px;height:32px;border-radius:50%;background:'+ac[0]+';display:flex;align-items:center;justify-content:center;font-size:0.85rem;font-weight:700;color:'+ac[1]+';">' + u.name.charAt(0).toUpperCase() + '</div><span class="body-md" style="font-weight: 500;">' + u.name + '</span></div></td>' +
      '<td class="body-sm">' + u.email + '</td>' +
      '<td class="body-sm">' + (u.phone || 'N/A') + '</td>' +
      '<td><span class="badge badge-' + (roleColors[u.role] || 'neutral') + '">' + (roleLabels[u.role] || u.role.replace('_', ' ')) + '</span></td>' +
      '<td class="body-sm">' + date + '</td>' +
      '<td>' + (canEditUsers ? '<div class="flex gap-xs"><button class="btn btn-ghost btn-sm" onclick="editUser(' + u.id + ')">&#9998;</button><button class="btn btn-ghost btn-sm" style="color: var(--clr-danger);" onclick="removeUser(' + u.id + ')">&#128465;</button></div>' : '') + '</td>' +
      '</tr>';
  }).join('');
}

function searchAdminProducts(query) {
  renderAdminProducts(document.getElementById('admin-category-filter')?.value || 'all', query);
}

function filterAdminProducts(catId) {
  const search = document.getElementById('admin-product-search')?.value || '';
  renderAdminProducts(catId, search);
}

/* ── Product Modal ── */
function populateCategorySelects() {
  const cats = ProductAdmin.getCategories();
  const options = '<option value="">Select category</option>' + cats.map(c => '<option value="' + c.id + '">' + c.name + '</option>').join('');
  const productCat = document.getElementById('product-category');
  const filterCat = document.getElementById('admin-category-filter');
  if (productCat) productCat.innerHTML = options;
  if (filterCat) filterCat.innerHTML = '<option value="all">All Categories</option>' + cats.map(c => '<option value="' + c.id + '">' + c.name + '</option>').join('');
}

function showAddProductModal() {
  document.getElementById('product-modal-title').textContent = 'Add Product';
  document.getElementById('product-form').reset();
  document.getElementById('product-id').value = '';
  const previewWrap = document.getElementById('product-image-preview-wrap');
  if (previewWrap) previewWrap.style.display = 'none';
  const fileInput = document.getElementById('product-image-file');
  if (fileInput) fileInput.value = '';
  populateCategorySelects();
  if (typeof loadSupplierDropdown === 'function') loadSupplierDropdown();
  showModal('product-modal');
}

function editProduct(id) {
  const p = ProductAdmin.getProducts().find(pr => pr.id === id);
  if (!p) return;
  document.getElementById('product-modal-title').textContent = 'Edit Product';
  document.getElementById('product-id').value = p.id;
  document.getElementById('product-name').value = p.name;
  document.getElementById('product-description').value = p.description || '';
  document.getElementById('product-price').value = p.price;
  document.getElementById('product-stock').value = p.stockQuantity;
  document.getElementById('product-unit').value = p.unit || 'unit';
  document.getElementById('product-emoji') && (document.getElementById('product-emoji').value = p.emoji || '');
  document.getElementById('product-image').value = p.imageUrl || '';
  
  const previewWrap = document.getElementById('product-image-preview-wrap');
  const previewImg = document.getElementById('product-image-preview');
  const previewName = document.getElementById('product-image-preview-name');
  if (p.imageUrl && previewWrap && previewImg) {
    const resolved = (typeof FreshMartImage !== 'undefined') ? FreshMartImage.resolveUrl(p.imageUrl) : p.imageUrl;
    previewImg.src = resolved;
    if (previewName) previewName.textContent = p.imageUrl.split(/[\\/]/).pop() || p.imageUrl;
    previewWrap.style.display = 'flex';
  } else if (previewWrap) {
    previewWrap.style.display = 'none';
  }

  populateCategorySelects();
  if (typeof loadSupplierDropdown === 'function') loadSupplierDropdown();
  document.getElementById('product-category').value = p.categoryId;
  if (p.supplierId) {
    const suppSelect = document.getElementById('product-supplier');
    if (suppSelect) suppSelect.value = p.supplierId;
  }
  showModal('product-modal');
}

function handleProductImagePathInput(val) {
  const previewWrap = document.getElementById('product-image-preview-wrap');
  const previewImg = document.getElementById('product-image-preview');
  const previewName = document.getElementById('product-image-preview-name');
  if (!val || !val.trim()) {
    if (previewWrap) previewWrap.style.display = 'none';
    return;
  }
  const resolved = (typeof FreshMartImage !== 'undefined') ? FreshMartImage.resolveUrl(val) : val;
  if (previewImg) previewImg.src = resolved;
  if (previewName) previewName.textContent = val.split(/[\\/]/).pop() || val;
  if (previewWrap) previewWrap.style.display = 'flex';
}

function handleProductImageUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    const dataUrl = evt.target.result;
    const imgInput = document.getElementById('product-image');
    if (imgInput) imgInput.value = dataUrl;
    const previewWrap = document.getElementById('product-image-preview-wrap');
    const previewImg = document.getElementById('product-image-preview');
    const previewName = document.getElementById('product-image-preview-name');
    if (previewImg) previewImg.src = dataUrl;
    if (previewName) previewName.textContent = file.name;
    if (previewWrap) previewWrap.style.display = 'flex';
  };
  reader.readAsDataURL(file);
}

function clearProductImage() {
  const imgInput = document.getElementById('product-image');
  if (imgInput) imgInput.value = '';
  const fileInput = document.getElementById('product-image-file');
  if (fileInput) fileInput.value = '';
  const previewWrap = document.getElementById('product-image-preview-wrap');
  if (previewWrap) previewWrap.style.display = 'none';
}

async function saveProduct(e) {
  e.preventDefault();
  try {
    const id = document.getElementById('product-id').value;
    let imgVal = document.getElementById('product-image').value.trim();
    if (imgVal) {
      if (imgVal.includes(':\\')) {
        // Keep Windows absolute path intact so FreshMartServer backend can ingest & copy it!
      } else {
        if (!imgVal.startsWith('data:') && !imgVal.startsWith('http://') && !imgVal.startsWith('https://') && !imgVal.startsWith('images/')) {
          imgVal = 'images/products/' + imgVal;
        }
      }
    } else {
      imgVal = 'images/products/apples.jpg';
    }
    const data = {
      categoryId: document.getElementById('product-category').value ? parseInt(document.getElementById('product-category').value) : null,
      name: document.getElementById('product-name').value.trim(),
      description: document.getElementById('product-description').value.trim(),
      price: parseFloat(document.getElementById('product-price').value) || 0,
      stockQuantity: parseFloat(document.getElementById('product-stock').value) || 0,
      unit: document.getElementById('product-unit').value,
      imageUrl: imgVal,
      supplierId: document.getElementById('product-supplier') && document.getElementById('product-supplier').value ? parseInt(document.getElementById('product-supplier').value) : null,
      available: true
    };
    if (!data.name || !data.categoryId || !data.price) {
      showToast('Please fill in all required fields', 'error');
      return false;
    }
    if (id) {
      if (typeof FreshMartAPI !== 'undefined') {
        const res = await FreshMartAPI.updateProduct(parseInt(id), data).catch(err => console.warn('DB update:', err));
        if (res && res.imageUrl) data.imageUrl = res.imageUrl;
      }
      ProductAdmin.updateProduct(parseInt(id), data);
      showToast('Product updated in database successfully!', 'success');
    } else {
      if (typeof FreshMartAPI !== 'undefined') {
        const res = await FreshMartAPI.createProduct(data).catch(err => console.warn('DB create:', err));
        if (res && res.id) data.id = res.id;
        if (res && res.imageUrl) data.imageUrl = res.imageUrl;
      }
      ProductAdmin.createProduct(data);
      showToast('Product added to database successfully!', 'success');
    }
    hideModal('product-modal');
    renderAdminProducts();
  } catch (err) {
    showToast(err.message, 'error');
  }
  return false;
}

async function removeProduct(id) {
  if (!confirm('Are you sure you want to delete this product from the database?')) return;
  try {
    if (typeof FreshMartAPI !== 'undefined') {
      await FreshMartAPI.deleteProduct(id).catch(err => console.warn('DB delete:', err));
    }
    ProductAdmin.deleteProduct(id);
    showToast('Product deleted from database!', 'success');
    renderAdminProducts();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ── Category Modal ── */
function showAddCategoryModal() {
  document.getElementById('category-modal-title').textContent = 'Add Category';
  document.getElementById('category-form').reset();
  document.getElementById('category-id').value = '';
  showModal('category-modal');
}

function editCategory(id) {
  const c = ProductAdmin.getCategories().find(cat => cat.id === id);
  if (!c) return;
  document.getElementById('category-modal-title').textContent = 'Edit Category';
  document.getElementById('category-id').value = c.id;
  document.getElementById('category-name').value = c.name;
  document.getElementById('category-description').value = c.description || '';
  showModal('category-modal');
}

async function saveCategory(e) {
  e.preventDefault();
  try {
    const id = document.getElementById('category-id').value;
    const data = {
      name: document.getElementById('category-name').value.trim(),
      description: document.getElementById('category-description').value.trim()
    };
    if (!data.name) {
      showToast('Category name is required', 'error');
      return false;
    }
    if (id) {
      if (typeof FreshMartAPI !== 'undefined') {
        await FreshMartAPI.updateCategory(parseInt(id), data).catch(err => console.warn('DB category update:', err));
      }
      ProductAdmin.updateCategory(parseInt(id), data);
      showToast('Category updated in database!', 'success');
    } else {
      if (typeof FreshMartAPI !== 'undefined') {
        const res = await FreshMartAPI.createCategory(data).catch(err => console.warn('DB category create:', err));
        if (res && res.id) data.id = res.id;
      }
      ProductAdmin.createCategory(data);
      showToast('Category created in database!', 'success');
    }
    hideModal('category-modal');
    renderAdminCategories();
    populateCategorySelects();
  } catch (err) {
    showToast(err.message, 'error');
  }
  return false;
}

async function removeCategory(id) {
  if (!confirm('Delete this category? Products will become uncategorized.')) return;
  try {
    if (typeof FreshMartAPI !== 'undefined') {
      await FreshMartAPI.deleteCategory(id).catch(err => console.warn('DB category delete:', err));
    }
    ProductAdmin.deleteCategory(id);
    showToast('Category deleted from database!', 'success');
    renderAdminCategories();
    populateCategorySelects();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ── User Modal (Admin) ── */
function showAddUserModal() {
  document.getElementById('user-modal-title').textContent = 'Add User';
  document.getElementById('user-form').reset();
  document.getElementById('edit-user-id').value = '';
  document.getElementById('password-required').style.display = 'inline';
  document.getElementById('edit-user-password').required = true;
  showModal('user-modal');
}

function editUser(id) {
  let user;
  if (typeof AccountManager !== 'undefined') {
    user = AccountManager.readUserById(id);
  } else {
    user = JSON.parse(localStorage.getItem('freshcart_users') || '[]').find(u => u.id === id);
  }
  if (!user) return;
  document.getElementById('user-modal-title').textContent = 'Edit User';
  document.getElementById('edit-user-id').value = user.id;
  document.getElementById('edit-user-name').value = user.name;
  document.getElementById('edit-user-email').value = user.email;
  document.getElementById('edit-user-phone').value = user.phone || '';
  document.getElementById('edit-user-role').value = user.role;
  document.getElementById('edit-user-address').value = user.address || '';
  document.getElementById('edit-user-password').required = false;
  document.getElementById('password-required').style.display = 'none';
  showModal('user-modal');
}

async function saveUser(e) {
  e.preventDefault();
  try {
    const id = document.getElementById('edit-user-id').value;
    const name = document.getElementById('edit-user-name').value.trim();
    const email = document.getElementById('edit-user-email').value.trim();
    const phone = document.getElementById('edit-user-phone').value.trim();
    const password = document.getElementById('edit-user-password').value;
    const role = document.getElementById('edit-user-role').value;
    const address = document.getElementById('edit-user-address').value.trim();

    if (!name || !email) {
      showToast('Name and email are required', 'error');
      return false;
    }

    if (id) {
      const updates = { name, email, phone, role, address };
      if (password) updates.password = password;
      if (typeof FreshMartAPI !== 'undefined') {
        await FreshMartAPI.updateUser(parseInt(id), updates).catch(err => console.warn('DB user update:', err));
      }
      AccountManager.updateUser(parseInt(id), updates);
      showToast('User updated in database!', 'success');
    } else {
      if (!password || password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return false;
      }
      if (typeof FreshMartAPI !== 'undefined') {
        const res = await FreshMartAPI.createUser({ name, email, password, phone, address, role }).catch(err => console.warn('DB user create:', err));
      }
      AccountManager.createUser(name, email, password, phone, address, role);
      showToast('User created in database!', 'success');
    }
    hideModal('user-modal');
    renderAdminUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
  return false;
}

async function removeUser(id) {
  if (!confirm('Are you sure you want to delete this user from database?')) return;
  try {
    if (typeof FreshMartAPI !== 'undefined') {
      await FreshMartAPI.deleteUser(id).catch(err => console.warn('DB user delete:', err));
    }
    AccountManager.deleteUser(id);
    showToast('User deleted from database!', 'success');
    renderAdminUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ── Status Update Modal ── */
function showStatusModal(entityType, entityId, currentValue, options) {
  document.getElementById('status-entity-type').value = entityType;
  document.getElementById('status-entity-id').value = entityId;
  const select = document.getElementById('status-new-value');
  select.innerHTML = options.map(o => '<option value="' + o + '"' + (o === currentValue ? ' selected' : '') + '>' + o + '</option>').join('');
  showModal('status-modal');
}

async function updateStatus() {
  const entityType = document.getElementById('status-entity-type').value;
  const entityId = parseInt(document.getElementById('status-entity-id').value);
  const newStatus = document.getElementById('status-new-value').value;

  try {
    if (entityType === 'order') {
      if (typeof FreshMartAPI !== 'undefined') {
        await FreshMartAPI.updateOrderStatus(entityId, newStatus).catch(err => console.warn('DB order status update:', err));
      }
      const orders = JSON.parse(localStorage.getItem('freshcart_orders') || '[]');
      const idx = orders.findIndex(o => o.id === entityId);
      if (idx !== -1) { 
        orders[idx].status = newStatus; 
        if (newStatus === 'DELIVERED' && !orders[idx].deliveredAt) {
          orders[idx].deliveredAt = new Date().toISOString();
        }
        localStorage.setItem('freshcart_orders', JSON.stringify(orders)); 

        // Two-way sync: update corresponding delivery record
        const deliveries = JSON.parse(localStorage.getItem('freshcart_deliveries') || '[]');
        const dIdx = deliveries.findIndex(d => d.orderId === entityId || d.orderId === orders[idx].orderId || d.orderCode === orders[idx].orderId);
        if (dIdx !== -1) {
          if (newStatus === 'DELIVERED') {
            deliveries[dIdx].status = 'DELIVERED';
            deliveries[dIdx].deliveredAt = new Date().toISOString();
          } else if (newStatus === 'SHIPPED') {
            deliveries[dIdx].status = 'IN_TRANSIT';
          } else if (newStatus === 'CANCELLED') {
            deliveries[dIdx].status = 'CANCELLED';
          } else if (newStatus === 'PENDING') {
            deliveries[dIdx].status = 'SCHEDULED';
          }
          localStorage.setItem('freshcart_deliveries', JSON.stringify(deliveries));
          if (typeof renderAdminDeliveries === 'function') renderAdminDeliveries();
        }
      }
      if (typeof renderAdminOrders === 'function') renderAdminOrders();
      showToast('Order status updated in database!', 'success');
    } else if (entityType === 'payment') {
      const payments = JSON.parse(localStorage.getItem('freshcart_payments') || '[]');
      const idx = payments.findIndex(p => p.id === entityId);
      if (idx !== -1) { payments[idx].status = newStatus; localStorage.setItem('freshcart_payments', JSON.stringify(payments)); }
      if (typeof renderAdminPayments === 'function') renderAdminPayments();
      showToast('Payment status updated!', 'success');
    } else if (entityType === 'delivery') {
      const deliveries = JSON.parse(localStorage.getItem('freshcart_deliveries') || '[]');
      const idx = deliveries.findIndex(d => d.id === entityId);
      if (idx !== -1) { 
        deliveries[idx].status = newStatus; 
        if (newStatus === 'DELIVERED') {
          deliveries[idx].deliveredAt = new Date().toISOString();
        }
        localStorage.setItem('freshcart_deliveries', JSON.stringify(deliveries)); 

        // Two-way sync: update corresponding order record
        const orders = JSON.parse(localStorage.getItem('freshcart_orders') || '[]');
        const oIdx = orders.findIndex(o => o.id === deliveries[idx].orderId || o.orderId === deliveries[idx].orderId || o.orderId === deliveries[idx].orderCode);
        if (oIdx !== -1) {
          if (newStatus === 'DELIVERED') {
            orders[oIdx].status = 'DELIVERED';
            orders[oIdx].deliveredAt = new Date().toISOString();
          } else if (newStatus === 'IN_TRANSIT') {
            orders[oIdx].status = 'SHIPPED';
          } else if (newStatus === 'CANCELLED') {
            orders[oIdx].status = 'CANCELLED';
          }
          localStorage.setItem('freshcart_orders', JSON.stringify(orders)); 
          if (typeof renderAdminOrders === 'function') renderAdminOrders();
          if (typeof FreshMartAPI !== 'undefined' && orders[oIdx].id) {
            FreshMartAPI.updateOrderStatus(orders[oIdx].id, orders[oIdx].status).catch(e => console.warn(e));
          }
        }
      }
      if (typeof renderAdminDeliveries === 'function') renderAdminDeliveries();
      showToast('Delivery status updated in database!', 'success');
    }
    hideModal('status-modal');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

let lastOrdersHash = '';
let lastPaymentsHash = '';
let lastDeliveriesHash = '';
let lastProductsHash = '';
let lastUsersHash = '';
let lastReviewsHash = '';
let lastInquiriesHash = '';

function renderAllAdminSections() {
  if (!document.getElementById('admin-products-table')) return;
  populateCategorySelects();
  renderAdminProducts();
  if (typeof renderAdminCategories === 'function') renderAdminCategories();
  if (typeof renderAdminUsers === 'function') renderAdminUsers();
  if (typeof renderAdminOrders === 'function') renderAdminOrders();
  if (typeof renderAdminPayments === 'function') renderAdminPayments();
  if (typeof renderAdminDeliveries === 'function') renderAdminDeliveries();
  if (typeof renderAdminReviews === 'function') renderAdminReviews();
  if (typeof renderAdminInquiries === 'function') renderAdminInquiries();
  if (typeof renderAdminSuppliers === 'function') renderAdminSuppliers();
  updateAdminStats();
}

async function syncDatabaseToAdmin() {
  if (typeof FreshMartAPI === 'undefined') return;
  try {
    const [dbProducts, dbCategories, dbUsers, dbOrders, dbInquiries, dbSuppliers] = await Promise.all([
      FreshMartAPI.getProducts().catch(() => null),
      FreshMartAPI.getCategories().catch(() => null),
      FreshMartAPI.getUsers().catch(() => null),
      FreshMartAPI.getOrders().catch(() => null),
      FreshMartAPI.getInquiries().catch(() => null),
      FreshMartAPI.getSuppliers().catch(() => null)
    ]);

    let changed = false;

    if (dbProducts && Array.isArray(dbProducts) && dbProducts.length > 0) {
      const existing = JSON.parse(localStorage.getItem('freshcart_products') || '[]');
      const enriched = dbProducts.map(p => {
        const prev = existing.find(e => Number(e.id) === Number(p.id));
        return {
          ...p,
          id: Number(p.id),
          categoryId: Number(p.categoryId),
          price: Number(p.price),
          stockQuantity: Number(p.stockQuantity),
          discountPrice: (p.discountPrice !== undefined)
            ? (p.discountPrice !== null ? Number(p.discountPrice) : null)
            : (prev && prev.discountPrice !== undefined ? prev.discountPrice : null),
          emoji: p.emoji || (prev ? prev.emoji : '\u{1F34E}'),
          imageUrl: p.imageUrl || (prev ? prev.imageUrl : '') || 'images/products/apples.jpg'
        };
      });
      const newStr = JSON.stringify(enriched);
      if (newStr !== localStorage.getItem('freshcart_products')) {
        localStorage.setItem('freshcart_products', newStr);
        changed = true;
      }
    }

    if (dbCategories && Array.isArray(dbCategories) && dbCategories.length > 0) {
      const newStr = JSON.stringify(dbCategories);
      if (newStr !== localStorage.getItem('freshcart_categories')) {
        localStorage.setItem('freshcart_categories', newStr);
        changed = true;
      }
    }

    if (dbUsers && Array.isArray(dbUsers) && dbUsers.length > 0) {
      const newStr = JSON.stringify(dbUsers);
      if (newStr !== localStorage.getItem('freshcart_users')) {
        localStorage.setItem('freshcart_users', newStr);
        changed = true;
      }
    }

    if (dbOrders && Array.isArray(dbOrders) && dbOrders.length > 0) {
      const mappedOrders = dbOrders.map(o => ({
        id: o.orderId,
        orderId: o.orderCode,
        customerId: o.customerId,
        totalAmount: o.totalAmount,
        subtotal: o.subtotal,
        deliveryFee: o.deliveryFee,
        tax: o.tax,
        status: o.orderStatus,
        shippingAddress: o.shippingAddress,
        createdAt: o.orderDate
      }));
      const newStr = JSON.stringify(mappedOrders);
      if (newStr !== localStorage.getItem('freshcart_orders')) {
        localStorage.setItem('freshcart_orders', newStr);
        changed = true;
      }

      // Sync order items
      const allItems = [];
      dbOrders.forEach(o => {
        if (o.items && Array.isArray(o.items)) {
          o.items.forEach(it => {
            allItems.push({
              id: it.orderItemId || Date.now() + Math.floor(Math.random() * 1000),
              orderId: o.orderId,
              productId: it.productId,
              productName: it.productName,
              quantity: it.quantity,
              unitPrice: it.unitPrice
            });
          });
        }
      });
      if (allItems.length > 0) {
        localStorage.setItem('freshcart_order_items', JSON.stringify(allItems));
      }

      // Sync payments
      const existingPayments = JSON.parse(localStorage.getItem('freshcart_payments') || '[]');
      const updatedPayments = [...existingPayments];
      dbOrders.forEach((o, idx) => {
        if (!updatedPayments.find(p => p.orderId === o.orderId)) {
          updatedPayments.push({
            id: Date.now() + idx + 10,
            paymentId: 'PAY-' + String(updatedPayments.length + 1).padStart(5, '0'),
            orderId: o.orderId,
            method: o.paymentMethod || 'CARD',
            status: o.paymentStatus || 'COMPLETED',
            amount: o.totalAmount,
            transactionDate: o.orderDate || new Date().toISOString()
          });
          changed = true;
        }
      });
      localStorage.setItem('freshcart_payments', JSON.stringify(updatedPayments));

      // Sync deliveries
      const existingDeliveries = JSON.parse(localStorage.getItem('freshcart_deliveries') || '[]');
      const updatedDeliveries = [...existingDeliveries];
      dbOrders.forEach((o, idx) => {
        if (!updatedDeliveries.find(d => d.orderId === o.orderId)) {
          updatedDeliveries.push({
            id: Date.now() + idx + 50,
            deliveryId: 'DEL-' + String(updatedDeliveries.length + 1).padStart(5, '0'),
            orderId: o.orderId,
            orderCode: o.orderCode,
            shippingAddress: o.shippingAddress,
            status: o.deliveryStatus || 'DELIVERED',
            assignedStaffId: 1007,
            scheduledTime: o.orderDate || new Date().toISOString()
          });
          changed = true;
        }
      });
      localStorage.setItem('freshcart_deliveries', JSON.stringify(updatedDeliveries));
    }

    if (dbInquiries && Array.isArray(dbInquiries) && dbInquiries.length > 0) {
      const mappedInq = dbInquiries.map(inq => {
        const fwdTo = (inq.department && inq.department !== 'GENERAL') ? inq.department : (inq.status === 'FORWARDED' ? inq.department : null);
        return {
          id: inq.id,
          customerId: inq.customerId,
          customerName: inq.customerName,
          customerEmail: inq.customerEmail,
          subject: inq.subject,
          message: inq.message,
          department: inq.department,
          forwardedTo: fwdTo,
          status: inq.status,
          adminResponse: inq.adminResponse || '',
          createdAt: inq.createdAt
        };
      });
      const newStr = JSON.stringify(mappedInq);
      if (newStr !== localStorage.getItem('freshcart_inquiries')) {
        localStorage.setItem('freshcart_inquiries', newStr);
        changed = true;
      }
    }

    if (dbSuppliers && Array.isArray(dbSuppliers) && dbSuppliers.length > 0) {
      const mappedSuppliers = dbSuppliers.map(s => ({
        id: s.id,
        company: s.companyName,
        contact: s.contactPerson,
        email: s.email,
        phone: s.phone,
        address: s.address,
        isActive: s.active
      }));
      const newStr = JSON.stringify(mappedSuppliers);
      if (newStr !== localStorage.getItem('freshcart_suppliers')) {
        localStorage.setItem('freshcart_suppliers', newStr);
        changed = true;
      }
    }

    if (changed) {
      renderAllAdminSections();
    }
  } catch (err) {
    console.warn('Live DB sync error:', err);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Immediately render UI with cached/default data
  renderAllAdminSections();

  // 2. Fetch all live data from database
  await syncDatabaseToAdmin();
  renderAllAdminSections();

  if (document.getElementById('admin-products-table')) {
    setTimeout(() => {
      const lowStockProducts = ProductAdmin.getProducts().filter(p => p.stockQuantity < 50);
      if (lowStockProducts.length > 0) {
        showToast(`Warning: ${lowStockProducts.length} product(s) have stock lower than 50. Please check inventory!`, 'error');
      }
    }, 1000);

    lastOrdersHash = (localStorage.getItem('freshcart_orders') || '[]').length + ':' + (localStorage.getItem('freshcart_orders') || '[]').slice(-20);
    lastPaymentsHash = (localStorage.getItem('freshcart_payments') || '[]').length + ':' + (localStorage.getItem('freshcart_payments') || '[]').slice(-20);
    lastDeliveriesHash = (localStorage.getItem('freshcart_deliveries') || '[]').length + ':' + (localStorage.getItem('freshcart_deliveries') || '[]').slice(-20);
    lastProductsHash = (localStorage.getItem('freshcart_products') || '[]').length + ':' + (localStorage.getItem('freshcart_products') || '[]').slice(-20);
    lastUsersHash = (localStorage.getItem('freshcart_users') || '[]').length + ':' + (localStorage.getItem('freshcart_users') || '[]').slice(-20);
    lastReviewsHash = (localStorage.getItem('freshcart_reviews') || '[]').length + ':' + (localStorage.getItem('freshcart_reviews') || '[]').slice(-20);
    lastInquiriesHash = (localStorage.getItem('freshcart_inquiries') || '[]').length + ':' + (localStorage.getItem('freshcart_inquiries') || '[]').slice(-20);
  }
});

function updateAdminStats() {
  const products = ProductAdmin.getProducts();
  const statProd = document.getElementById('stat-products');
  if (statProd) statProd.textContent = products.length;

  if (typeof OrderManager !== 'undefined') {
    const orders = OrderManager.readAllOrders();
    const statOrders = document.getElementById('stat-orders');
    if (statOrders) statOrders.textContent = orders.length;

    const revenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const statRevenue = document.getElementById('stat-revenue');
    if (statRevenue) statRevenue.textContent = 'Rs ' + revenue.toFixed(2);

    const deliveryCost = orders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
    const statDeliveryCost = document.getElementById('stat-delivery-cost');
    if (statDeliveryCost) statDeliveryCost.textContent = 'Rs ' + deliveryCost.toFixed(2);

    const profit = revenue - deliveryCost;
    const statProfit = document.getElementById('stat-profit');
    if (statProfit) statProfit.textContent = 'Rs ' + profit.toFixed(2);

    const pending = orders.filter(o => o.status === 'PENDING').length;
    const statPending = document.getElementById('stat-pending');
    if (statPending) statPending.textContent = pending;

    // Update the new Revenue Tab details
    const revTabGross = document.getElementById('rev-tab-gross');
    if (revTabGross) revTabGross.textContent = 'Rs ' + revenue.toFixed(2);
    const revTabDelivery = document.getElementById('rev-tab-delivery');
    if (revTabDelivery) revTabDelivery.textContent = 'Rs ' + deliveryCost.toFixed(2);
    const revTabNet = document.getElementById('rev-tab-net');
    if (revTabNet) revTabNet.textContent = 'Rs ' + profit.toFixed(2);

    const revTable = document.getElementById('rev-tab-table');
    if (revTable) {
      revTable.innerHTML = orders.map(o => `
        <tr>
          <td>#${o.id}</td>
          <td>${new Date(o.createdAt).toLocaleDateString()}</td>
          <td>Rs ${(o.totalAmount - (o.deliveryFee||0)).toFixed(2)}</td>
          <td>Rs ${(o.deliveryFee||0).toFixed(2)}</td>
          <td><span style="font-weight:600; color:var(--clr-primary);">Rs ${(o.totalAmount||0).toFixed(2)}</span></td>
        </tr>
      `).join('');
    }
  }

  if (typeof PaymentDeliveryManager !== 'undefined') {
    PaymentDeliveryManager.getDeliveries();
  }

  if (typeof ReviewManager !== 'undefined') {
    const reviews = ReviewManager.getAllReviews();
    const statReviews = document.getElementById('stat-reviews');
    if (statReviews) statReviews.textContent = reviews.length;
  }
}

function refreshAdminOrdersData() {
  renderAllAdminSections();
}

/* ── Auto-refresh via storage event (cross-tab) ── */
window.addEventListener('storage', function(e) {
  if (!e.key) return;
  if (e.key.startsWith('freshcart_')) {
    refreshAdminOrdersData();
  }
});

/* ── Auto-refresh via custom events (same-tab customer actions) ── */
window.addEventListener('orderPlaced', refreshAdminOrdersData);
window.addEventListener('inquirySubmitted', refreshAdminOrdersData);
window.addEventListener('reviewSubmitted', refreshAdminOrdersData);
window.addEventListener('userRegistered', refreshAdminOrdersData);

/* ── Auto-refresh via polling (localStorage every 2.5s, Live DB sync every 6s) ── */
function pollAdminData() {
  if (!document.getElementById('admin-orders-table') && !document.getElementById('admin-products-table')) return;

  const ordersStr = localStorage.getItem('freshcart_orders') || '[]';
  const paymentsStr = localStorage.getItem('freshcart_payments') || '[]';
  const deliveriesStr = localStorage.getItem('freshcart_deliveries') || '[]';
  const productsStr = localStorage.getItem('freshcart_products') || '[]';
  const usersStr = localStorage.getItem('freshcart_users') || '[]';
  const reviewsStr = localStorage.getItem('freshcart_reviews') || '[]';
  const inquiriesStr = localStorage.getItem('freshcart_inquiries') || '[]';

  const ordersHash = ordersStr.length + ':' + ordersStr.slice(-20);
  const paymentsHash = paymentsStr.length + ':' + paymentsStr.slice(-20);
  const deliveriesHash = deliveriesStr.length + ':' + deliveriesStr.slice(-20);
  const productsHash = productsStr.length + ':' + productsStr.slice(-20);
  const usersHash = usersStr.length + ':' + usersStr.slice(-20);
  const reviewsHash = reviewsStr.length + ':' + reviewsStr.slice(-20);
  const inquiriesHash = inquiriesStr.length + ':' + inquiriesStr.slice(-20);

  if (ordersHash !== lastOrdersHash || paymentsHash !== lastPaymentsHash || deliveriesHash !== lastDeliveriesHash ||
      productsHash !== lastProductsHash || usersHash !== lastUsersHash || reviewsHash !== lastReviewsHash || inquiriesHash !== lastInquiriesHash) {
    lastOrdersHash = ordersHash;
    lastPaymentsHash = paymentsHash;
    lastDeliveriesHash = deliveriesHash;
    lastProductsHash = productsHash;
    lastUsersHash = usersHash;
    lastReviewsHash = reviewsHash;
    lastInquiriesHash = inquiriesHash;
    refreshAdminOrdersData();
  }
}

setInterval(pollAdminData, 2500);

// Live database polling for admin UI (syncs orders, inquiries, users, products from DB)
setInterval(() => {
  if (document.getElementById('admin-orders-table') || document.getElementById('admin-products-table')) {
    syncDatabaseToAdmin();
  }
}, 6000);
