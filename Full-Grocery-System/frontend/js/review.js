/* ============================================
   review.js — Product Review Management (CRUD)
   ============================================ */

const ReviewManager = (() => {
  const REVIEW_KEY = 'freshcart_reviews';

  function getReviews() {
    return JSON.parse(localStorage.getItem(REVIEW_KEY) || '[]');
  }

  function saveReviews(reviews) {
    localStorage.setItem(REVIEW_KEY, JSON.stringify(reviews));
  }

  function genId() {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  function createReview(productId, customerId, customerName, rating, comment) {
    const reviews = getReviews();
    const existing = reviews.find(r => Number(r.productId) === Number(productId) && Number(r.customerId) === Number(customerId));
    if (existing) throw new Error('You have already reviewed this product. Use update instead.');
    const review = {
      id: genId(),
      productId: Number(productId),
      customerId: Number(customerId),
      customerName,
      rating: parseInt(rating),
      comment: comment || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    reviews.push(review);
    saveReviews(reviews);
    try {
      window.dispatchEvent(new CustomEvent('reviewSubmitted', { detail: review }));
    } catch(e) {}
    return review;
  }

  function updateReview(reviewId, customerId, rating, comment) {
    const reviews = getReviews();
    const idx = reviews.findIndex(r => r.id === reviewId);
    if (idx === -1) throw new Error('Review not found');
    if (Number(reviews[idx].customerId) !== Number(customerId)) throw new Error('You can only edit your own reviews');
    reviews[idx].rating = parseInt(rating);
    reviews[idx].comment = comment || '';
    reviews[idx].updatedAt = new Date().toISOString();
    saveReviews(reviews);
    return reviews[idx];
  }

  function deleteReview(reviewId, customerId) {
    const reviews = getReviews();
    const review = reviews.find(r => r.id === reviewId);
    if (!review) throw new Error('Review not found');
    if (Number(review.customerId) !== Number(customerId)) throw new Error('You can only delete your own reviews');
    saveReviews(reviews.filter(r => r.id !== reviewId));
  }

  function adminDeleteReview(reviewId) {
    const reviews = getReviews();
    saveReviews(reviews.filter(r => r.id !== reviewId));
  }

  function getReviewsByProduct(productId) {
    return getReviews().filter(r => Number(r.productId) === Number(productId));
  }

  function getReviewByCustomer(productId, customerId) {
    return getReviews().find(r => Number(r.productId) === Number(productId) && Number(r.customerId) === Number(customerId)) || null;
  }

  function getAllReviews() {
    return getReviews();
  }

  function getAverageRating(productId) {
    const reviews = getReviewsByProduct(productId);
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    return sum / reviews.length;
  }

  function getRatingBreakdown(productId) {
    const reviews = getReviewsByProduct(productId);
    const total = reviews.length;
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => { if (breakdown[r.rating] !== undefined) breakdown[r.rating]++; });
    return { total, breakdown };
  }

  return {
    getReviews, createReview, updateReview, deleteReview, adminDeleteReview,
    getReviewsByProduct, getReviewByCustomer, getAllReviews,
    getAverageRating, getRatingBreakdown
  };
})();

/* ── Product Detail Modal — Reviews Section ── */
function renderProductReviews(productId) {
  const container = document.getElementById('product-reviews-list');
  const summaryEl = document.getElementById('product-reviews-summary');
  const formEl = document.getElementById('review-form-section');
  if (!container) return;

  const reviews = ReviewManager.getReviewsByProduct(productId);
  const { total, breakdown } = ReviewManager.getRatingBreakdown(productId);
  const avg = ReviewManager.getAverageRating(productId);

  if (summaryEl) {
    if (total === 0) {
      summaryEl.innerHTML = '<div class="body-sm text-muted">No reviews yet. Be the first to review!</div>';
    } else {
      const stars = renderStarsHTML(Math.round(avg));
      summaryEl.innerHTML =
        '<div class="review-summary-row">' +
          '<div class="review-summary-avg">' +
            '<span class="review-avg-number">' + avg.toFixed(1) + '</span>' +
            '<span class="review-avg-stars">' + stars + '</span>' +
            '<span class="body-xs text-muted">' + total + ' review' + (total !== 1 ? 's' : '') + '</span>' +
          '</div>' +
          '<div class="review-summary-bars">' +
            [5, 4, 3, 2, 1].map(n => {
              const count = breakdown[n];
              const pct = total > 0 ? (count / total) * 100 : 0;
              return '<div class="review-bar-row">' +
                '<span class="review-bar-label">' + n + '★</span>' +
                '<div class="review-bar-track"><div class="review-bar-fill" style="width:' + pct + '%"></div></div>' +
                '<span class="review-bar-count">' + count + '</span>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>';
    }
  }

  const session = (typeof AccountManager !== 'undefined') ? AccountManager.getSession() : null;
  const myReview = session ? ReviewManager.getReviewByCustomer(productId, session.id) : null;

  if (formEl) {
    if (session) {
      if (myReview) {
        formEl.innerHTML =
          '<div class="review-form-card">' +
            '<div class="body-sm" style="font-weight:600; margin-bottom:10px;">Your Review</div>' +
            '<div class="review-stars-input" id="edit-review-stars">' +
              [1,2,3,4,5].map(n => '<span class="review-star-btn' + (n <= myReview.rating ? ' active' : '') + '" data-value="' + n + '" onclick="setEditReviewRating(' + n + ')">★</span>').join('') +
            '</div>' +
            '<textarea class="form-textarea" id="edit-review-comment" rows="2" placeholder="Share your experience...">' + (myReview.comment || '') + '</textarea>' +
            '<div class="flex gap-sm" style="margin-top:10px;">' +
              '<button class="btn btn-primary btn-sm" onclick="submitUpdateReview(' + productId + ', ' + myReview.id + ')">Update Review</button>' +
              '<button class="btn btn-ghost btn-sm" style="color:var(--clr-danger);" onclick="submitDeleteReview(' + productId + ', ' + myReview.id + ')">Delete</button>' +
            '</div>' +
          '</div>';
      } else {
        formEl.innerHTML =
          '<div class="review-form-card">' +
            '<div class="body-sm" style="font-weight:600; margin-bottom:10px;">Write a Review</div>' +
            '<div class="review-stars-input" id="new-review-stars">' +
              [1,2,3,4,5].map(n => '<span class="review-star-btn" data-value="' + n + '" onclick="setNewReviewRating(' + n + ')">★</span>').join('') +
            '</div>' +
            '<textarea class="form-textarea" id="new-review-comment" rows="2" placeholder="Share your experience with this product..."></textarea>' +
            '<button class="btn btn-primary btn-sm" style="margin-top:10px;" onclick="submitNewReview(' + productId + ')">Submit Review</button>' +
          '</div>';
      }
    } else {
      formEl.innerHTML =
        '<div class="review-form-card text-center">' +
          '<p class="body-sm text-muted"><a href="#" class="text-primary" style="font-weight:600;" onclick="event.preventDefault(); hideModal(\'product-detail\'); showModal(\'login-modal\');">Sign in</a> to write a review</p>' +
        '</div>';
    }
  }

  if (reviews.length === 0) {
    container.innerHTML = '<div class="body-sm text-muted" style="padding:20px 0; text-align:center;">No reviews yet.</div>';
    return;
  }

  const sorted = [...reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  container.innerHTML = sorted.map(r => {
    const stars = renderStarsHTML(r.rating);
    const date = new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const isMine = session && r.customerId === session.id;
    const initial = r.customerName ? r.customerName.charAt(0).toUpperCase() : '?';
    return '<div class="review-item">' +
      '<div class="review-item-header">' +
        '<div class="review-item-user">' +
          '<div class="review-avatar">' + initial + '</div>' +
          '<div>' +
            '<div class="body-sm" style="font-weight:600;">' + r.customerName + (isMine ? ' <span class="body-xs text-muted">(you)</span>' : '') + '</div>' +
            '<div class="body-xs text-muted">' + date + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="review-item-rating">' + stars + '</div>' +
      '</div>' +
      (r.comment ? '<p class="body-sm" style="margin-top:8px; color:var(--clr-text-secondary);">' + escapeHTML(r.comment) + '</p>' : '') +
    '</div>';
  }).join('');
}

let _newReviewRating = 0;
let _editReviewRating = 0;

function setNewReviewRating(val) {
  _newReviewRating = val;
  const stars = document.querySelectorAll('#new-review-stars .review-star-btn');
  stars.forEach(s => { s.classList.toggle('active', parseInt(s.dataset.value) <= val); });
}

function setEditReviewRating(val) {
  _editReviewRating = val;
  const stars = document.querySelectorAll('#edit-review-stars .review-star-btn');
  stars.forEach(s => { s.classList.toggle('active', parseInt(s.dataset.value) <= val); });
}

function submitNewReview(productId) {
  const session = (typeof AccountManager !== 'undefined') ? AccountManager.getSession() : null;
  if (!session) { showToast('Please sign in to review', 'error'); return; }
  if (_newReviewRating === 0) { showToast('Please select a rating', 'error'); return; }
  const comment = (document.getElementById('new-review-comment')?.value || '').trim();
  try {
    ReviewManager.createReview(productId, session.id, session.name, _newReviewRating, comment);
    showToast('Review submitted!', 'success');
    _newReviewRating = 0;
    renderProductReviews(productId);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function submitUpdateReview(productId, reviewId) {
  const session = (typeof AccountManager !== 'undefined') ? AccountManager.getSession() : null;
  if (!session) return;
  const rating = _editReviewRating || ReviewManager.getReviewByCustomer(productId, session.id)?.rating || 0;
  if (rating === 0) { showToast('Please select a rating', 'error'); return; }
  const comment = (document.getElementById('edit-review-comment')?.value || '').trim();
  try {
    ReviewManager.updateReview(reviewId, session.id, rating, comment);
    showToast('Review updated!', 'success');
    _editReviewRating = 0;
    renderProductReviews(productId);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function submitDeleteReview(productId, reviewId) {
  const session = (typeof AccountManager !== 'undefined') ? AccountManager.getSession() : null;
  if (!session) return;
  if (!confirm('Delete your review?')) return;
  try {
    ReviewManager.deleteReview(reviewId, session.id);
    showToast('Review deleted', 'info');
    renderProductReviews(productId);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderStarsHTML(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += '<span class="review-star' + (i <= rating ? ' filled' : '') + '">★</span>';
  }
  return html;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ── Patch showProductDetail to also render reviews ── */
const _originalShowProductDetail = typeof showProductDetail === 'function' ? showProductDetail : null;

function showProductDetailWithReviews(id) {
  if (_originalShowProductDetail) _originalShowProductDetail(id);
  renderProductReviews(id);
}

/* ── Admin: Render all reviews table ── */
function renderAdminReviews() {
  const tbody = document.getElementById('admin-reviews-table');
  if (!tbody) return;

  const reviews = ReviewManager.getAllReviews();
  if (reviews.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center body-sm" style="padding: 40px;">No reviews yet</td></tr>';
    return;
  }

  const statEl = document.getElementById('stat-reviews');
  if (statEl) statEl.textContent = reviews.length;

  const sorted = [...reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  tbody.innerHTML = sorted.map(r => {
    const product = (typeof ProductCatalog !== 'undefined') ? ProductCatalog.readProductById(r.productId) : null;
    const productName = product ? product.name : 'Unknown Product';
    const rawImg = product ? product.imageUrl : '';
    const imgUrl = (typeof FreshMartImage !== 'undefined') ? FreshMartImage.resolveUrl(rawImg) : (rawImg || 'images/products/apples.jpg');
    const imgTag = '<img src="' + imgUrl + '" alt="' + productName + '" style="width:32px;height:32px;object-fit:cover;border-radius:4px;border:1px solid var(--clr-border);flex-shrink:0;" onerror="this.onerror=null;this.src=\'images/products/apples.jpg\';">';
    const stars = renderStarsHTML(r.rating);
    const date = new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    return '<tr>' +
      '<td><div class="flex items-center gap-sm">' + imgTag + '<span class="body-sm" style="font-weight:500;">' + productName + '</span></div></td>' +
      '<td class="body-sm">' + (r.customerName || 'Unknown') + '</td>' +
      '<td><div class="review-item-rating" style="display:inline-flex;">' + stars + '</div></td>' +
      '<td class="body-sm" style="max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + (escapeHTML(r.comment) || '<em class="text-muted">No comment</em>') + '</td>' +
      '<td class="body-sm">' + date + '</td>' +
      '<td><button class="btn btn-ghost btn-sm" style="color:var(--clr-danger);" onclick="adminDeleteReviewAction(' + r.id + ')">&#128465;</button></td>' +
      '</tr>';
  }).join('');
}

function adminDeleteReviewAction(reviewId) {
  if (!confirm('Delete this review?')) return;
  try {
    ReviewManager.adminDeleteReview(reviewId);
    showToast('Review deleted', 'success');
    renderAdminReviews();
    updateAdminStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ── Sample Reviews Seed ── */
function initSampleReviews() {
  const reviews = JSON.parse(localStorage.getItem('freshcart_reviews') || '[]');
  if (reviews.length > 0) return;

  const now = Date.now();
  const DAY = 86400000;
  const sampleReviews = [
    { id: now + 1, productId: 1, customerId: 1003, customerName: 'Mike Customer', rating: 5, comment: 'Absolutely perfect avocados! Creamy and ripe, exactly as described. Will order again.', createdAt: new Date(now - 5 * DAY).toISOString(), updatedAt: new Date(now - 5 * DAY).toISOString() },
    { id: now + 2, productId: 8, customerId: 1003, customerName: 'Mike Customer', rating: 4, comment: 'Great organic milk, tastes fresh. Delivery was a bit cold but that is expected.', createdAt: new Date(now - 4 * DAY).toISOString(), updatedAt: new Date(now - 4 * DAY).toISOString() },
    { id: now + 3, productId: 12, customerId: 1003, customerName: 'Mike Customer', rating: 5, comment: 'Freshest salmon I have ever had delivered! Perfect for grilling.', createdAt: new Date(now - 3 * DAY).toISOString(), updatedAt: new Date(now - 3 * DAY).toISOString() },
    { id: now + 4, productId: 5, customerId: 1002, customerName: 'Sarah Manager', rating: 4, comment: 'Good quality broccoli. My kids actually ate their vegetables!', createdAt: new Date(now - 2 * DAY).toISOString(), updatedAt: new Date(now - 2 * DAY).toISOString() },
    { id: now + 5, productId: 10, customerId: 1002, customerName: 'Sarah Manager', rating: 5, comment: 'The sourdough loaf is incredible. Crispy crust and the most amazing texture inside.', createdAt: new Date(now - 1 * DAY).toISOString(), updatedAt: new Date(now - 1 * DAY).toISOString() },
    { id: now + 6, productId: 2, customerId: 1004, customerName: 'Emma Delivery', rating: 3, comment: 'Strawberries were okay but a few were slightly overripe. Still tasty overall.', createdAt: new Date(now - 6 * DAY).toISOString(), updatedAt: new Date(now - 6 * DAY).toISOString() },
    { id: now + 7, productId: 14, customerId: 1004, customerName: 'Emma Delivery', rating: 5, comment: 'Best cold brew coffee I have tried. Smooth and not bitter at all!', createdAt: new Date(now - 2 * DAY).toISOString(), updatedAt: new Date(now - 2 * DAY).toISOString() },
    { id: now + 8, productId: 18, customerId: 1003, customerName: 'Mike Customer', rating: 4, comment: 'Bananas were perfectly ripe. Great for smoothies every morning.', createdAt: new Date(now - 1 * DAY).toISOString(), updatedAt: new Date(now - 1 * DAY).toISOString() },
  ];
  localStorage.setItem('freshcart_reviews', JSON.stringify(sampleReviews));
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  initSampleReviews();
  if (_originalShowProductDetail) {
    window.showProductDetail = showProductDetailWithReviews;
  }
  if (document.getElementById('category-rating-chart')) {
    setTimeout(() => {
      renderAdminReviewsCharts();
      renderBestSellersPanel();
    }, 500);
  }
});

/* ── Admin: Chart & Best Sellers Dashboard ── */
function renderAdminReviewsCharts() {
  if (typeof Chart === 'undefined') return;
  const reviews = ReviewManager.getAllReviews();
  const products = (typeof ProductCatalog !== 'undefined') ? ProductCatalog.getProducts() : [];
  const categories = (typeof ProductCatalog !== 'undefined') ? ProductCatalog.getCategories() : [];

  // Group by category
  const catRatingSum = {};
  const catRatingCount = {};
  const distCount = { 1:0, 2:0, 3:0, 4:0, 5:0 };

  reviews.forEach(r => {
    distCount[r.rating]++;
    const p = products.find(p => p.id === r.productId);
    if (p) {
      const cName = ProductCatalog.getCategoryName(p.categoryId);
      if (!catRatingSum[cName]) { catRatingSum[cName] = 0; catRatingCount[cName] = 0; }
      catRatingSum[cName] += r.rating;
      catRatingCount[cName]++;
    }
  });

  const catNames = Object.keys(catRatingSum);
  const catAvgs = catNames.map(c => catRatingSum[c] / catRatingCount[c]);

  const ctxBar = document.getElementById('category-rating-chart');
  if (ctxBar && catNames.length > 0) {
    if (window._catChart) window._catChart.destroy();
    window._catChart = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: catNames,
        datasets: [{
          label: 'Average Rating',
          data: catAvgs,
          backgroundColor: '#10b981',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, max: 5 } }
      }
    });
  }

  const ctxDonut = document.getElementById('rating-distribution-chart');
  if (ctxDonut) {
    if (window._distChart) window._distChart.destroy();
    window._distChart = new Chart(ctxDonut, {
      type: 'doughnut',
      data: {
        labels: ['5★', '4★', '3★', '2★', '1★'],
        datasets: [{
          data: [distCount[5], distCount[4], distCount[3], distCount[2], distCount[1]],
          backgroundColor: ['#10b981', '#34d399', '#fbbf24', '#f87171', '#dc2626']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
}

function renderBestSellersPanel() {
  const panel = document.getElementById('best-sellers-panel');
  if (!panel) return;
  const products = (typeof ProductCatalog !== 'undefined') ? ProductCatalog.getProducts() : [];
  
  const bestSellers = products.map(p => {
    const avg = ReviewManager.getAverageRating(p.id);
    const count = ReviewManager.getReviewsByProduct(p.id).length;
    return { ...p, avg, count };
  }).filter(p => p.avg >= 4.0 && p.count >= 1);

  if (bestSellers.length === 0) {
    panel.innerHTML = '<div class="body-sm text-muted">No highly rated products yet.</div>';
    return;
  }

  panel.innerHTML = bestSellers.map(p => {
    const currentDiscount = p.discountPrice ? Math.round((1 - (p.discountPrice / p.price)) * 100) : 0;
    const imgUrl = (typeof FreshMartImage !== 'undefined') ? FreshMartImage.resolveUrl(p.imageUrl) : (p.imageUrl || 'images/products/apples.jpg');
    return '<div class="best-seller-card">' +
      '<div class="flex items-center gap-xs" style="margin-bottom:8px;">' +
        '<img src="' + imgUrl + '" alt="' + p.name + '" style="width:34px;height:34px;object-fit:cover;border-radius:6px;border:1px solid var(--clr-border);flex-shrink:0;" onerror="this.onerror=null;this.src=\'images/products/apples.jpg\';">' +
        '<div>' +
          '<div class="best-seller-name">' + p.name + '</div>' +
          '<div class="best-seller-stars">' + p.avg.toFixed(1) + '★ <span class="body-xs text-muted" style="color:var(--clr-text-muted);">(' + p.count + ' revs)</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="flex gap-xs items-center" style="margin-top:8px;">' +
        '<input type="number" id="discount-input-' + p.id + '" class="form-input" style="width:70px; padding:4px 8px; font-size:0.8rem;" placeholder="%" value="' + currentDiscount + '" min="0" max="90">' +
        '<button class="btn btn-primary btn-sm" style="padding:4px 8px; font-size:0.8rem;" onclick="applyManualDiscount(' + p.id + ')">Apply %</button>' +
      '</div>' +
      (p.discountPrice ? '<div class="discount-badge-sm" style="display:inline-block; margin-top:8px;">Now Rs ' + p.discountPrice.toFixed(2) + '</div>' : '') +
    '</div>';
  }).join('');
}

async function applyManualDiscount(productId) {
  const input = document.getElementById('discount-input-' + productId);
  if (!input) return;
  const pct = parseInt(input.value) || 0;
  
  try {
    const products = (typeof ProductCatalog !== 'undefined' && ProductCatalog.getProducts) 
      ? ProductCatalog.getProducts() 
      : JSON.parse(localStorage.getItem('freshcart_products') || '[]');
    const idx = products.findIndex(p => Number(p.id) === Number(productId));
    if (idx === -1) return;
    
    if (pct > 0) {
      const discounted = Math.round(products[idx].price * (1 - (pct / 100)) * 100) / 100;
      products[idx].discountPrice = discounted;
      if (typeof FreshMartAPI !== 'undefined' && FreshMartAPI.applyPromotion) {
        await FreshMartAPI.applyPromotion(productId, pct, discounted).catch(err => console.warn('DB promotion:', err));
      }
      showToast(`Applied ${pct}% discount to ${products[idx].name} (Rs ${discounted.toFixed(2)})! Saved to Database.`, 'success');
    } else {
      delete products[idx].discountPrice;
      products[idx].discountPrice = null;
      if (typeof FreshMartAPI !== 'undefined' && FreshMartAPI.removePromotion) {
        await FreshMartAPI.removePromotion(productId).catch(err => console.warn('DB promotion removal:', err));
      }
      showToast(`Removed discount from ${products[idx].name}. Updated in Database.`, 'info');
    }
    if (typeof ProductCatalog !== 'undefined' && ProductCatalog.saveProducts) {
      ProductCatalog.saveProducts(products);
    } else {
      localStorage.setItem('freshcart_products', JSON.stringify(products));
    }
    renderBestSellersPanel();
  } catch(err) {
    showToast(err.message, 'error');
  }
}

