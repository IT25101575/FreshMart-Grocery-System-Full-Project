/* ============================================================
   inquiry.js — Customer Inquiry & Support Ticket Management
   Module 1: User Account & Inquiries Management
   
   Roles & Permissions:
     CUSTOMER          → Add, Edit, Delete, View OWN inquiries only
     ADMIN             → View ALL, Edit ANY, Delete ANY, Forward to dept
     STORE_MANAGER     → Answer ORDER and RATING forwarded inquiries
     DELIVERY_SUPERVISOR → Answer DELIVERY forwarded inquiries
     INVENTORY_OFFICER → Answer PRODUCT forwarded inquiries
   
   Status Flow: PENDING → FORWARDED → ANSWERED → CLOSED
   ============================================================ */

const InquiryManager = (() => {
  const STORAGE_KEY = 'freshcart_inquiries';

  /* ── Storage helpers ── */
  function getInquiries() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  }
  function saveInquiries(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
  function genId() {
    return Date.now() + Math.floor(Math.random() * 9000);
  }

  /* ── Role → Department mapping ── */
  const ROLE_DEPT_MAP = {
    DEPT_ORDER:    ['ORDER'],
    DEPT_RATING:   ['RATING'],
    DEPT_DELIVERY: ['DELIVERY'],
    DEPT_PRODUCT:  ['PRODUCT'],
    ADMIN:         ['DELIVERY', 'ORDER', 'PRODUCT', 'RATING']
  };

  function getDepartmentsForRole(role) {
    return ROLE_DEPT_MAP[role] || [];
  }

  /* ─────────────────────────────────────────
     CUSTOMER OPERATIONS
  ───────────────────────────────────────── */

  // CREATE: Customer submits a new inquiry
  function createInquiry(customerId, customerName, subject, message, extra = {}) {
    if (!subject || !subject.trim() || !message || !message.trim()) {
      throw new Error('Subject and message are required.');
    }
    const inquiry = {
      id: genId(),
      customerId: customerId || (extra.customerId || 1003),
      customerName: customerName || (extra.name || 'Customer'),
      customerPhone: extra.phone || '',
      customerAddress: extra.address || '',
      orderId: extra.orderId ? String(extra.orderId).trim() : null,
      department: extra.department || 'GENERAL',
      subject: subject.trim(),
      message: message.trim(),
      status: 'PENDING',
      adminResponse: '',
      forwardedTo: (extra.department && extra.department !== 'GENERAL') ? extra.department : null,
      departmentAnswer: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const list = getInquiries();
    list.push(inquiry);
    saveInquiries(list);

    if (typeof FreshMartAPI !== 'undefined') {
      FreshMartAPI.submitInquiry({
        customerId: inquiry.customerId,
        subject: inquiry.subject,
        message: inquiry.message,
        department: inquiry.department
      }).then(res => {
        if (res && res.id) inquiry.id = res.id;
      }).catch(e => console.warn('Inquiry DB save:', e));
    }

    try {
      window.dispatchEvent(new CustomEvent('inquirySubmitted', { detail: inquiry }));
    } catch(e) {}

    return inquiry;
  }

  // READ: Get all inquiries for a specific customer
  function getMyInquiries(customerId) {
    return getInquiries()
      .filter(i => i.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // UPDATE: Customer edits their own inquiry (only PENDING or FORWARDED)
  function updateMyInquiry(inquiryId, customerId, subject, message) {
    const list = getInquiries();
    const idx = list.findIndex(i => i.id === inquiryId);
    if (idx === -1) throw new Error('Inquiry not found.');
    if (list[idx].customerId !== customerId) throw new Error('You can only edit your own inquiries.');
    if (list[idx].status === 'ANSWERED' || list[idx].status === 'CLOSED') {
      throw new Error('Cannot edit an inquiry that has been answered or closed.');
    }
    if (!subject.trim() || !message.trim()) throw new Error('Subject and message are required.');
    list[idx].subject = subject.trim();
    list[idx].message = message.trim();
    list[idx].updatedAt = new Date().toISOString();
    saveInquiries(list);
    return list[idx];
  }

  // DELETE: Customer deletes their own inquiry
  function deleteMyInquiry(inquiryId, customerId) {
    const list = getInquiries();
    const inquiry = list.find(i => i.id === inquiryId);
    if (!inquiry) throw new Error('Inquiry not found.');
    if (inquiry.customerId !== customerId) throw new Error('You can only delete your own inquiries.');
    saveInquiries(list.filter(i => i.id !== inquiryId));
    if (typeof FreshMartAPI !== 'undefined') {
      FreshMartAPI.deleteInquiry(inquiryId).catch(e => console.warn(e));
    }
  }

  /* ─────────────────────────────────────────
     ADMIN OPERATIONS
  ───────────────────────────────────────── */

  // READ: Get all inquiries (admin view)
  function getAllInquiries() {
    return getInquiries().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // READ: Get single inquiry by ID
  function getInquiryById(id) {
    return getInquiries().find(i => i.id === id) || null;
  }

  // FORWARD: Admin forwards inquiry to a department
  function forwardInquiry(inquiryId, department) {
    const list = getInquiries();
    const idx = list.findIndex(i => i.id === inquiryId);
    if (idx === -1) throw new Error('Inquiry not found.');
    const validDepts = ['DELIVERY', 'ORDER', 'PRODUCT', 'RATING'];
    if (!validDepts.includes(department)) throw new Error('Invalid department.');
    list[idx].forwardedTo = department;
    list[idx].status = 'FORWARDED';
    list[idx].updatedAt = new Date().toISOString();
    saveInquiries(list);
    return list[idx];
  }

  // EDIT: Admin edits any inquiry
  function adminEditInquiry(inquiryId, subject, message, adminResponse) {
    const list = getInquiries();
    const idx = list.findIndex(i => i.id === inquiryId);
    if (idx === -1) throw new Error('Inquiry not found.');
    if (subject !== undefined) list[idx].subject = subject.trim();
    if (message !== undefined) list[idx].message = message.trim();
    if (adminResponse !== undefined) {
      list[idx].adminResponse = adminResponse.trim();
      if (typeof FreshMartAPI !== 'undefined') {
        FreshMartAPI.respondInquiry(inquiryId, adminResponse.trim()).catch(e => console.warn(e));
      }
    }
    list[idx].updatedAt = new Date().toISOString();
    saveInquiries(list);
    return list[idx];
  }

  // DELETE: Admin deletes any inquiry
  function adminDeleteInquiry(inquiryId) {
    const list = getInquiries();
    if (!list.find(i => i.id === inquiryId)) throw new Error('Inquiry not found.');
    saveInquiries(list.filter(i => i.id !== inquiryId));
    if (typeof FreshMartAPI !== 'undefined') {
      FreshMartAPI.deleteInquiry(inquiryId).catch(e => console.warn(e));
    }
  }

  // CLOSE: Admin closes an inquiry
  function closeInquiry(inquiryId) {
    const list = getInquiries();
    const idx = list.findIndex(i => i.id === inquiryId);
    if (idx === -1) throw new Error('Inquiry not found.');
    list[idx].status = 'CLOSED';
    list[idx].updatedAt = new Date().toISOString();
    saveInquiries(list);
  }

  /* ─────────────────────────────────────────
     DEPARTMENT HEAD OPERATIONS
  ───────────────────────────────────────── */

  // ANSWER: Department head answers a forwarded inquiry
  function answerInquiry(inquiryId, role, answer) {
    const list = getInquiries();
    const idx = list.findIndex(i => i.id === inquiryId);
    if (idx === -1) throw new Error('Inquiry not found.');
    const inq = list[idx];
    if (inq.status !== 'FORWARDED') throw new Error('This inquiry has not been forwarded yet.');
    const allowedDepts = getDepartmentsForRole(role);
    if (!allowedDepts.includes(inq.forwardedTo)) {
      throw new Error('This inquiry is not forwarded to your department.');
    }
    if (!answer.trim()) throw new Error('Answer cannot be empty.');
    list[idx].departmentAnswer = answer.trim();
    list[idx].status = 'ANSWERED';
    list[idx].updatedAt = new Date().toISOString();
    saveInquiries(list);
    if (typeof FreshMartAPI !== 'undefined') {
      FreshMartAPI.respondInquiry(inquiryId, answer.trim()).catch(e => console.warn(e));
    }
    return list[idx];
  }

  // READ: Get inquiries forwarded to a specific department (for dept heads)
  function getInquiriesByDepartment(department) {
    return getInquiries()
      .filter(i => i.forwardedTo === department && i.status === 'FORWARDED')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /* ─────────────────────────────────────────
     SAMPLE DATA SEEDING
  ───────────────────────────────────────── */
  function initSampleInquiries() {
    if (getInquiries().length > 0) return;
    const now = Date.now();
    const DAY = 86400000;
    const samples = [
      {
        id: now + 1, customerId: 1003, customerName: 'Mike Customer',
        subject: 'Delivery delay on my last order',
        message: 'My order #ORD-1001 was supposed to arrive yesterday but it still has not. Could you please look into this?',
        status: 'FORWARDED', forwardedTo: 'DELIVERY', adminResponse: '',
        departmentAnswer: '', createdAt: new Date(now - 3 * DAY).toISOString(), updatedAt: new Date(now - 2 * DAY).toISOString()
      },
      {
        id: now + 2, customerId: 1003, customerName: 'Mike Customer',
        subject: 'Wrong product received',
        message: 'I ordered Organic Avocados but received regular ones. Please arrange a replacement.',
        status: 'ANSWERED', forwardedTo: 'PRODUCT', adminResponse: 'We are sorry for the inconvenience.',
        departmentAnswer: 'We have arranged a replacement delivery for tomorrow between 9AM-12PM. Please keep the incorrect items for pickup.',
        createdAt: new Date(now - 5 * DAY).toISOString(), updatedAt: new Date(now - 4 * DAY).toISOString()
      },
      {
        id: now + 3, customerId: 1003, customerName: 'Mike Customer',
        subject: 'How do I cancel an order?',
        message: 'I placed an order 10 minutes ago and would like to cancel it. What is the process?',
        status: 'PENDING', forwardedTo: null, adminResponse: '',
        departmentAnswer: '', createdAt: new Date(now - 1 * DAY).toISOString(), updatedAt: new Date(now - 1 * DAY).toISOString()
      },
      {
        id: now + 4, customerId: 1002, customerName: 'Sarah Manager',
        subject: 'Product rating seems incorrect',
        message: 'The avocado rating shows 4.2 but I have seen many negative reviews. Please review the rating system.',
        status: 'FORWARDED', forwardedTo: 'RATING', adminResponse: '',
        departmentAnswer: '', createdAt: new Date(now - 2 * DAY).toISOString(), updatedAt: new Date(now - 2 * DAY).toISOString()
      }
    ];
    saveInquiries(samples);
  }

  return {
    createInquiry, getMyInquiries, updateMyInquiry, deleteMyInquiry,
    getAllInquiries, getInquiryById, forwardInquiry, adminEditInquiry, adminDeleteInquiry, closeInquiry,
    answerInquiry, getInquiriesByDepartment, getDepartmentsForRole,
    initSampleInquiries
  };
})();

/* ================================================================
   UI RENDERING — Customer Inquiry Page (inquiries.html)
   ================================================================ */

let _editingInquiryId = null;

function renderMyInquiries() {
  const session = (typeof AccountManager !== 'undefined') ? AccountManager.getSession() : null;
  const container = document.getElementById('my-inquiries-list');
  const emptyEl = document.getElementById('inquiries-empty');
  if (!container) return;

  if (!session) {
    container.innerHTML = '';
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }

  const list = InquiryManager.getMyInquiries(session.id);

  if (list.length === 0) {
    container.innerHTML = '';
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }
  if (emptyEl) emptyEl.classList.add('hidden');

  container.innerHTML = list.map(inq => {
    const statusInfo = getStatusInfo(inq.status, inq.forwardedTo);
    const canEdit = inq.status === 'PENDING';
    const date = new Date(inq.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const updatedDate = new Date(inq.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    return `
    <div class="inquiry-card card card-elevated" id="inquiry-${inq.id}">
      <div class="inquiry-card-header">
        <div class="inquiry-card-title">
          <div class="inquiry-icon">💬</div>
          <div>
            <div class="heading-sm">${escapeInqHTML(inq.subject)}</div>
            <div class="body-xs text-muted" style="display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-top:2px;">
              <span>Ticket #${inq.id} &bull; ${date}</span>
              ${inq.orderId ? `<span class="badge badge-neutral" style="font-size:0.75rem; font-family:var(--font-mono); font-weight:600;">📦 Order: #${escapeInqHTML(inq.orderId)}</span>` : ''}
              ${inq.customerPhone ? `<span class="body-xs text-muted">📞 ${escapeInqHTML(inq.customerPhone)}</span>` : ''}
            </div>
            ${inq.customerAddress ? `<div class="body-xs text-muted" style="margin-top:2px;">📍 ${escapeInqHTML(inq.customerAddress)}</div>` : ''}
          </div>
        </div>
        <div class="inquiry-actions">
          <span class="inquiry-badge inquiry-badge--${statusInfo.cls}">${statusInfo.label}</span>
          ${canEdit ? `
            <button class="btn btn-ghost btn-sm inq-btn-edit" onclick="openEditInquiryModal(${inq.id})" title="Edit">✏️</button>
            <button class="btn btn-ghost btn-sm inq-btn-delete" onclick="deleteMyInquiryAction(${inq.id})" title="Delete">🗑️</button>
          ` : ''}
        </div>
      </div>
      <div class="inquiry-card-body">
        <p class="body-sm" style="color: var(--clr-text-secondary); margin-bottom: 12px; white-space:pre-wrap;">${escapeInqHTML(inq.message)}</p>
        ${inq.forwardedTo ? `<div class="inquiry-dept-badge">📤 Department: <strong>${getDeptLabel(inq.forwardedTo)}</strong></div>` : ''}
        ${inq.departmentAnswer ? `
          <div class="inquiry-answer-card">
            <div class="body-xs text-muted" style="margin-bottom:6px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em;">✅ Department Response</div>
            <p class="body-sm" style="white-space:pre-wrap;">${escapeInqHTML(inq.departmentAnswer)}</p>
            <div class="body-xs text-muted" style="margin-top:6px;">Updated: ${updatedDate}</div>
          </div>
        ` : ''}
        ${inq.adminResponse && !inq.departmentAnswer ? `
          <div class="inquiry-admin-response">
            <div class="body-xs text-muted" style="margin-bottom:4px; font-weight:600;">Admin Note:</div>
            <p class="body-sm">${escapeInqHTML(inq.adminResponse)}</p>
          </div>
        ` : ''}
      </div>
    </div>`;
  }).join('');
}

function openAddInquiryModal() {
  _editingInquiryId = null;
  const modal = document.getElementById('inquiry-modal');
  const title = document.getElementById('inquiry-modal-title');
  const session = (typeof AccountManager !== 'undefined') ? AccountManager.getSession() : null;

  if (title) title.textContent = 'Submit New Inquiry';
  const nameEl = document.getElementById('inq-name');
  const phoneEl = document.getElementById('inq-phone');
  const addrEl = document.getElementById('inq-address');
  const orderEl = document.getElementById('inq-order-id');
  const subjEl = document.getElementById('inq-subject');
  const msgEl = document.getElementById('inq-message');

  if (nameEl) nameEl.value = session ? session.name : '';
  if (phoneEl) phoneEl.value = (session && session.phone) ? session.phone : '';
  if (addrEl) addrEl.value = (session && session.address) ? session.address : '';
  if (orderEl) orderEl.value = '';
  if (subjEl) subjEl.value = '';
  if (msgEl) msgEl.value = '';
  showInquiryModal();
}

function openEditInquiryModal(inquiryId) {
  const inq = InquiryManager.getInquiryById(inquiryId);
  if (!inq) return;
  _editingInquiryId = inquiryId;
  const title = document.getElementById('inquiry-modal-title');
  if (title) title.textContent = 'Edit Inquiry';

  const nameEl = document.getElementById('inq-name');
  const phoneEl = document.getElementById('inq-phone');
  const addrEl = document.getElementById('inq-address');
  const orderEl = document.getElementById('inq-order-id');
  const subjEl = document.getElementById('inq-subject');
  const msgEl = document.getElementById('inq-message');

  if (nameEl) nameEl.value = inq.customerName || '';
  if (phoneEl) phoneEl.value = inq.customerPhone || '';
  if (addrEl) addrEl.value = inq.customerAddress || '';
  if (orderEl) orderEl.value = inq.orderId || '';
  if (subjEl) subjEl.value = inq.subject || '';
  if (msgEl) msgEl.value = inq.message || '';
  showInquiryModal();
}

async function saveInquiryForm(e) {
  if (e && e.preventDefault) e.preventDefault();
  const session = (typeof AccountManager !== 'undefined') ? AccountManager.getSession() : null;

  const name = (document.getElementById('inq-name')?.value || (session ? session.name : '')).trim();
  const phone = (document.getElementById('inq-phone')?.value || (session ? session.phone : '')).trim();
  const address = (document.getElementById('inq-address')?.value || (session ? session.address : '')).trim();
  const orderId = (document.getElementById('inq-order-id')?.value || '').trim();
  const subject = (document.getElementById('inq-subject')?.value || '').trim();
  const message = (document.getElementById('inq-message')?.value || '').trim();

  // Validations
  if (!name || (typeof FreshValidator !== 'undefined' && !FreshValidator.isValidName(name))) {
    showToast('Please enter a valid full name (at least 2 letters)', 'error');
    return false;
  }
  if (!phone || (typeof FreshValidator !== 'undefined' && !FreshValidator.isValidPhone(phone))) {
    showToast('Please enter a valid contact phone number (e.g. +94 77 123 4567)', 'error');
    return false;
  }
  if (!address || (typeof FreshValidator !== 'undefined' && !FreshValidator.isValidAddress(address))) {
    showToast('Please enter a valid address (at least 5 characters)', 'error');
    return false;
  }
  if (!subject || subject.length < 3) {
    showToast('Please enter a subject (at least 3 characters)', 'error');
    return false;
  }
  if (!message || message.length < 5) {
    showToast('Please provide an explanation about your inquiry (at least 5 characters)', 'error');
    return false;
  }

  const customerId = session ? session.id : 1003;

  try {
    if (_editingInquiryId) {
      InquiryManager.updateMyInquiry(_editingInquiryId, customerId, subject, message);
      // update extra fields if present
      const list = InquiryManager.getAllInquiries();
      const idx = list.findIndex(i => i.id === _editingInquiryId);
      if (idx !== -1) {
        list[idx].customerName = name;
        list[idx].customerPhone = phone;
        list[idx].customerAddress = address;
        list[idx].orderId = orderId || null;
        localStorage.setItem('freshcart_inquiries', JSON.stringify(list));
      }
      showToast('Inquiry updated successfully!', 'success');
    } else {
      const created = InquiryManager.createInquiry(customerId, name, subject, message, {
        phone: phone,
        address: address,
        orderId: orderId,
        department: null // All inquiries start directed to System Administrator
      });
      if (typeof FreshMartAPI !== 'undefined') {
        try {
          const apiRes = await FreshMartAPI.submitInquiry({
            customerId: customerId,
            subject: subject,
            message: message + (phone ? ' [Phone: ' + phone + ']' : '') + (address ? ' [Address: ' + address + ']' : ''),
            department: 'GENERAL'
          });
          if (apiRes && apiRes.id) {
            created.id = apiRes.id;
          }
        } catch (apiErr) {
          console.warn('[FreshMart] API submitInquiry error:', apiErr);
        }
      }
      showToast('Inquiry submitted to Administrator and saved to Database!', 'success');
    }
    hideInquiryModal();
    if (typeof renderMyInquiries === 'function') renderMyInquiries();
    if (typeof updateInquiryStats === 'function') updateInquiryStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
  return false;
}

/* ────────────────────────────────────────────────────────────────
   SUBMIT INQUIRY FROM CUSTOMER HOMEPAGE (BOTTOM OF WEBSITE)
   ──────────────────────────────────────────────────────────────── */
async function submitCustomerInquiryForm(e) {
  if (e && e.preventDefault) e.preventDefault();

  const nameEl = document.getElementById('cust-inq-name');
  const phoneEl = document.getElementById('cust-inq-phone');
  const addrEl = document.getElementById('cust-inq-address');
  const orderEl = document.getElementById('cust-inq-order-id');
  const subjEl = document.getElementById('cust-inq-subject');
  const msgEl = document.getElementById('cust-inq-message');

  const name = (nameEl ? nameEl.value : '').trim();
  const phone = (phoneEl ? phoneEl.value : '').trim();
  const address = (addrEl ? addrEl.value : '').trim();
  const orderId = (orderEl ? orderEl.value : '').trim();
  const subject = (subjEl ? subjEl.value : '').trim();
  const message = (msgEl ? msgEl.value : '').trim();

  let hasError = false;

  // Validate Name
  if (!name || (typeof FreshValidator !== 'undefined' && !FreshValidator.isValidName(name))) {
    if (typeof FreshValidator !== 'undefined') FreshValidator.showFieldError('cust-inq-name', 'Full name must contain letters only (min 2 characters)');
    hasError = true;
  } else if (typeof FreshValidator !== 'undefined') {
    FreshValidator.clearFieldError('cust-inq-name');
  }

  // Validate Phone
  if (!phone || (typeof FreshValidator !== 'undefined' && !FreshValidator.isValidPhone(phone))) {
    if (typeof FreshValidator !== 'undefined') FreshValidator.showFieldError('cust-inq-phone', 'Enter valid phone number (e.g. +94 77 123 4567 or 0771234567)');
    hasError = true;
  } else if (typeof FreshValidator !== 'undefined') {
    FreshValidator.clearFieldError('cust-inq-phone');
  }

  // Validate Address
  if (!address || (typeof FreshValidator !== 'undefined' && !FreshValidator.isValidAddress(address))) {
    if (typeof FreshValidator !== 'undefined') FreshValidator.showFieldError('cust-inq-address', 'Please enter your address (at least 5 characters)');
    hasError = true;
  } else if (typeof FreshValidator !== 'undefined') {
    FreshValidator.clearFieldError('cust-inq-address');
  }

  // Validate Subject
  if (!subject || subject.length < 3) {
    if (typeof FreshValidator !== 'undefined') FreshValidator.showFieldError('cust-inq-subject', 'Please enter a clear subject (min 3 characters)');
    hasError = true;
  } else if (typeof FreshValidator !== 'undefined') {
    FreshValidator.clearFieldError('cust-inq-subject');
  }

  // Validate Message
  if (!message || message.length < 5) {
    if (typeof FreshValidator !== 'undefined') FreshValidator.showFieldError('cust-inq-message', 'Please provide detailed explanation about your inquiry (min 5 characters)');
    hasError = true;
  } else if (typeof FreshValidator !== 'undefined') {
    FreshValidator.clearFieldError('cust-inq-message');
  }

  if (hasError) {
    if (typeof showToast === 'function') showToast('Please check the form and correct highlighted errors', 'error');
    return false;
  }

  const session = (typeof AccountManager !== 'undefined') ? AccountManager.getSession() : null;
  const customerId = session ? session.id : 1003;

  try {
    const created = InquiryManager.createInquiry(customerId, name, subject, message, {
      phone: phone,
      address: address,
      orderId: orderId.replace(/^#/, ''),
      department: null // All inquiries first directed to System Administrator
    });

    if (typeof FreshMartAPI !== 'undefined') {
      try {
        const apiRes = await FreshMartAPI.submitInquiry({
          customerId: customerId,
          subject: subject,
          message: message + (phone ? ' [Phone: ' + phone + ']' : '') + (address ? ' [Address: ' + address + ']' : ''),
          department: 'GENERAL'
        });
        if (apiRes && apiRes.id) {
          created.id = apiRes.id;
        }
      } catch (apiErr) {
        console.warn('[FreshMart] API submitInquiry error:', apiErr);
      }
    }

    // Display confirmation card inside the bottom inquiry section
    const formContainer = document.getElementById('cust-inq-form-wrap');
    const successBox = document.getElementById('cust-inq-success-box');
    const ticketNoEl = document.getElementById('cust-inq-ticket-no');
    const ticketNameEl = document.getElementById('cust-inq-ticket-name');

    if (ticketNoEl) ticketNoEl.textContent = '#' + created.id;
    if (ticketNameEl) ticketNameEl.textContent = name;

    if (formContainer && successBox) {
      formContainer.classList.add('hidden');
      successBox.classList.remove('hidden');
    }

    if (typeof showToast === 'function') {
      showToast('Inquiry submitted to Administrator and recorded in Database! Reference: #' + created.id, 'success');
    }

    // Reset fields while keeping contact info
    if (orderEl) orderEl.value = '';
    if (subjEl) subjEl.value = '';
    if (msgEl) msgEl.value = '';

  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message, 'error');
  }

  return false;
}

function resetBottomInquiryForm() {
  const formContainer = document.getElementById('cust-inq-form-wrap');
  const successBox = document.getElementById('cust-inq-success-box');
  if (formContainer && successBox) {
    successBox.classList.add('hidden');
    formContainer.classList.remove('hidden');
  }
}

function deleteMyInquiryAction(inquiryId) {
  if (!confirm('Are you sure you want to delete this inquiry?')) return;
  const session = AccountManager.getSession();
  if (!session) return;
  try {
    InquiryManager.deleteMyInquiry(inquiryId, session.id);
    showToast('Inquiry deleted', 'info');
    renderMyInquiries();
    updateInquiryStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function updateInquiryStats() {
  const session = AccountManager.getSession();
  if (!session) return;
  const list = InquiryManager.getMyInquiries(session.id);
  const totalEl = document.getElementById('inq-stat-total');
  const pendingEl = document.getElementById('inq-stat-pending');
  const answeredEl = document.getElementById('inq-stat-answered');
  if (totalEl) totalEl.textContent = list.length;
  if (pendingEl) pendingEl.textContent = list.filter(i => i.status === 'PENDING').length;
  if (answeredEl) answeredEl.textContent = list.filter(i => i.status === 'ANSWERED').length;
}

function showInquiryModal() {
  const backdrop = document.getElementById('inquiry-modal-backdrop');
  const modal = document.getElementById('inquiry-modal');
  if (backdrop) backdrop.classList.add('active');
  if (modal) modal.classList.add('active');
}
function hideInquiryModal() {
  const backdrop = document.getElementById('inquiry-modal-backdrop');
  const modal = document.getElementById('inquiry-modal');
  if (backdrop) backdrop.classList.remove('active');
  if (modal) modal.classList.remove('active');
}

/* ================================================================
   UI RENDERING — Admin Inquiry Tab (admin.html)
   ================================================================ */

let _adminEditInqId = null;
let _adminAnswerInqId = null;

function renderAdminInquiries() {
  const tbody = document.getElementById('admin-inquiries-table');
  if (!tbody) return;
  const session = AccountManager.getSession();
  if (!session) return;

  const isAdmin = session.role === 'ADMIN' || session.email === 'admin@freshmart.com';
  const userDepts = InquiryManager.getDepartmentsForRole(session.role);

  let list;
  if (isAdmin) {
    list = InquiryManager.getAllInquiries();
  } else if (userDepts.length > 0) {
    // Dept heads see only inquiries forwarded to their departments
    list = InquiryManager.getAllInquiries().filter(i => userDepts.includes(i.forwardedTo));
  } else {
    list = [];
  }

  const countEl = document.getElementById('admin-inquiries-count');
  if (countEl) countEl.textContent = list.length + ' total';

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center body-sm" style="padding:40px;">No inquiries found</td></tr>';
    return;
  }

  tbody.innerHTML = list.map(inq => {
    const statusInfo = getStatusInfo(inq.status, inq.forwardedTo);
    const date = new Date(inq.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const canAnswer = userDepts.includes(inq.forwardedTo) && inq.status === 'FORWARDED';
    const canForwardOrEdit = isAdmin;

    return `<tr>
      <td>
        <div class="body-sm" style="font-weight:600;">${escapeInqHTML(inq.customerName || 'Customer')}</div>
        ${inq.customerPhone ? `<div class="body-xs text-muted" style="display:flex; align-items:center; gap:4px; margin-top:2px;">📞 ${escapeInqHTML(inq.customerPhone)}</div>` : ''}
        ${inq.orderId ? `<div class="body-xs font-mono" style="color:var(--clr-primary); font-weight:700; margin-top:2px;">Ref: #${escapeInqHTML(inq.orderId)}</div>` : ''}
        ${inq.customerAddress ? `<div class="body-xs text-muted" style="margin-top:2px;" title="${escapeInqHTML(inq.customerAddress)}">📍 ${escapeInqHTML(inq.customerAddress.length > 22 ? inq.customerAddress.slice(0, 22) + '...' : inq.customerAddress)}</div>` : ''}
        <div class="body-xs text-muted" style="margin-top:2px;">#${inq.id}</div>
      </td>
      <td class="body-sm" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeInqHTML(inq.subject)}">${escapeInqHTML(inq.subject)}</td>
      <td class="body-sm" style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeInqHTML(inq.message)}">${escapeInqHTML(inq.message)}</td>
      <td><span class="inquiry-badge inquiry-badge--${statusInfo.cls}">${statusInfo.label}</span>${inq.forwardedTo ? `<div class="body-xs text-muted" style="margin-top:3px;">→ ${getDeptLabel(inq.forwardedTo)}</div>` : ''}</td>
      <td class="body-sm">${date}</td>
      <td class="body-sm" style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeInqHTML(inq.departmentAnswer || inq.adminResponse || '')}">
        ${inq.departmentAnswer ? '<span style="color:var(--clr-primary); font-weight: 600;">✅ </span>' + escapeInqHTML(inq.departmentAnswer) : (inq.adminResponse ? escapeInqHTML(inq.adminResponse) : '<span class="text-muted">—</span>')}
      </td>
      <td>
        <div class="flex gap-xs" style="flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" onclick="openViewInquiryModal(${inq.id})" title="View Details">👁️</button>
          ${canForwardOrEdit ? `
            <select class="form-select" style="width:auto;padding:4px 8px;font-size:0.75rem;" onchange="forwardInquiryAction(${inq.id}, this.value); this.value='';">
              <option value="">Forward to...</option>
              <option value="DELIVERY">📦 Delivery</option>
              <option value="ORDER">📋 Order</option>
              <option value="PRODUCT">🛍️ Product</option>
              <option value="RATING">⭐ Rating</option>
            </select>
            <button class="btn btn-ghost btn-sm" onclick="openAdminEditInquiryModal(${inq.id})" title="Edit">✏️</button>
            <button class="btn btn-ghost btn-sm" style="color:var(--clr-danger);" onclick="adminDeleteInquiryAction(${inq.id})" title="Delete">🗑️</button>
            ${inq.status !== 'CLOSED' ? `<button class="btn btn-ghost btn-sm" style="color:#64748b;" onclick="closeInquiryAction(${inq.id})" title="Close">🔒</button>` : ''}
          ` : ''}
          ${canAnswer ? `<button class="btn btn-primary btn-sm" onclick="openAnswerModal(${inq.id})">Answer</button>` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');
}

async function forwardInquiryAction(inquiryId, department) {
  if (!department) return;
  try {
    InquiryManager.forwardInquiry(inquiryId, department);
    renderAdminInquiries();
    if (typeof FreshMartAPI !== 'undefined' && FreshMartAPI.forwardInquiry) {
      await FreshMartAPI.forwardInquiry(inquiryId, department).catch(err => console.warn('DB forward:', err));
    }
    showToast(`Inquiry forwarded to ${getDeptLabel(department)}`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openAdminEditInquiryModal(inquiryId) {
  const inq = InquiryManager.getInquiryById(inquiryId);
  if (!inq) return;
  _adminEditInqId = inquiryId;
  const modal = document.getElementById('admin-edit-inquiry-modal');
  const backdrop = document.getElementById('admin-edit-inquiry-backdrop');
  document.getElementById('admin-inq-edit-subject').value = inq.subject;
  document.getElementById('admin-inq-edit-message').value = inq.message;
  document.getElementById('admin-inq-edit-response').value = inq.adminResponse || '';
  if (backdrop) backdrop.classList.add('active');
  if (modal) modal.classList.add('active');
}

async function saveAdminEditInquiry() {
  const subject = document.getElementById('admin-inq-edit-subject')?.value.trim();
  const message = document.getElementById('admin-inq-edit-message')?.value.trim();
  const response = document.getElementById('admin-inq-edit-response')?.value.trim();
  try {
    InquiryManager.adminEditInquiry(_adminEditInqId, subject, message, response);
    if (typeof FreshMartAPI !== 'undefined' && response) {
      try {
        await FreshMartAPI.respondInquiry(_adminEditInqId, response);
      } catch (apiErr) {
        console.warn('[FreshMart] API respondInquiry error:', apiErr);
      }
    }
    showToast('Inquiry updated and saved to Database!', 'success');
    hideAdminEditInquiryModal();
    renderAdminInquiries();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function hideAdminEditInquiryModal() {
  document.getElementById('admin-edit-inquiry-backdrop')?.classList.remove('active');
  document.getElementById('admin-edit-inquiry-modal')?.classList.remove('active');
}

function adminDeleteInquiryAction(inquiryId) {
  if (!confirm('Permanently delete this inquiry?')) return;
  try {
    InquiryManager.adminDeleteInquiry(inquiryId);
    showToast('Inquiry deleted', 'success');
    renderAdminInquiries();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function closeInquiryAction(inquiryId) {
  if (!confirm('Close this inquiry?')) return;
  try {
    InquiryManager.closeInquiry(inquiryId);
    showToast('Inquiry closed', 'info');
    renderAdminInquiries();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openAnswerModal(inquiryId) {
  _adminAnswerInqId = inquiryId;
  const inq = InquiryManager.getInquiryById(inquiryId);
  if (!inq) return;
  const modal = document.getElementById('answer-inquiry-modal');
  const backdrop = document.getElementById('answer-inquiry-backdrop');
  const subjEl = document.getElementById('answer-inq-subject');
  const answerEl = document.getElementById('answer-inq-text');
  const deptEl = document.getElementById('answer-inq-dept');
  if (subjEl) subjEl.textContent = inq.subject;
  if (deptEl) deptEl.textContent = getDeptLabel(inq.forwardedTo);
  if (answerEl) answerEl.value = inq.departmentAnswer || '';
  if (backdrop) backdrop.classList.add('active');
  if (modal) modal.classList.add('active');
}

async function submitAnswer() {
  const session = AccountManager.getSession();
  if (!session) return;
  const answer = document.getElementById('answer-inq-text')?.value.trim();
  try {
    InquiryManager.answerInquiry(_adminAnswerInqId, session.role, answer);
    if (typeof FreshMartAPI !== 'undefined' && answer) {
      try {
        await FreshMartAPI.respondInquiry(_adminAnswerInqId, answer);
      } catch (apiErr) {
        console.warn('[FreshMart] API respondInquiry error:', apiErr);
      }
    }
    showToast('Answer submitted and recorded in Database!', 'success');
    hideAnswerModal();
    renderAdminInquiries();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function hideAnswerModal() {
  document.getElementById('answer-inquiry-backdrop')?.classList.remove('active');
  document.getElementById('answer-inquiry-modal')?.classList.remove('active');
}

/* ── Helpers ── */
function getStatusInfo(status, forwardedTo) {
  switch (status) {
    case 'PENDING':   return { cls: 'pending',   label: '⏳ Pending' };
    case 'FORWARDED': return { cls: 'forwarded', label: `📤 Forwarded` };
    case 'ANSWERED':  return { cls: 'answered',  label: '✅ Answered' };
    case 'CLOSED':    return { cls: 'closed',    label: '🔒 Closed' };
    default:          return { cls: 'pending',   label: status };
  }
}

function getDeptLabel(dept) {
  const labels = { DELIVERY: '📦 Delivery', ORDER: '📋 Order', PRODUCT: '🛍️ Product', RATING: '⭐ Rating' };
  return labels[dept] || dept;
}

function escapeInqHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function openViewInquiryModal(inquiryId) {
  const inq = InquiryManager.getInquiryById(inquiryId);
  if (!inq) return;
  document.getElementById('view-inq-subject').textContent = inq.subject;
  document.getElementById('view-inq-customer').textContent = inq.customerName || 'Unknown Customer';
  document.getElementById('view-inq-message').textContent = inq.message;
  
  const deptAnswerEl = document.getElementById('view-inq-dept-answer');
  if (inq.departmentAnswer) {
    deptAnswerEl.textContent = inq.departmentAnswer;
    deptAnswerEl.parentElement.style.display = 'block';
  } else {
    deptAnswerEl.parentElement.style.display = 'none';
  }

  const adminNoteEl = document.getElementById('view-inq-admin-note');
  if (inq.adminResponse) {
    adminNoteEl.textContent = inq.adminResponse;
    adminNoteEl.parentElement.style.display = 'block';
  } else {
    adminNoteEl.parentElement.style.display = 'none';
  }

  const modal = document.getElementById('view-inquiry-modal');
  const backdrop = document.getElementById('view-inquiry-backdrop');
  if (backdrop) backdrop.classList.add('active');
  if (modal) modal.classList.add('active');
}

function hideViewInquiryModal() {
  const modal = document.getElementById('view-inquiry-modal');
  const backdrop = document.getElementById('view-inquiry-backdrop');
  if (modal) modal.classList.remove('active');
  if (backdrop) backdrop.classList.remove('active');
}


/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  InquiryManager.initSampleInquiries();

  // Customer inquiry page init
  if (document.getElementById('my-inquiries-list')) {
    const session = AccountManager.getSession();
    if (!session) {
      showToast('Please sign in to view your inquiries', 'error');
      setTimeout(() => { window.location.href = 'index.html'; }, 800);
      return;
    }
    renderMyInquiries();
    updateInquiryStats();
  }

  // Admin page init — render if on admin tab
  if (document.getElementById('admin-inquiries-table')) {
    renderAdminInquiries();
  }
});
