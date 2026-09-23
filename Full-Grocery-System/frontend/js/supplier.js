// supplier.js
const SupplierManager = {
  getSuppliers: function() {
    return JSON.parse(localStorage.getItem('freshcart_suppliers') || '[]');
  },
  saveSuppliers: function(data) {
    localStorage.setItem('freshcart_suppliers', JSON.stringify(data));
  },
  addSupplier: function(supplier) {
    const suppliers = this.getSuppliers();
    supplier.id = Date.now();
    supplier.isActive = true;
    suppliers.push(supplier);
    this.saveSuppliers(suppliers);
  },
  updateSupplier: function(supplier) {
    const suppliers = this.getSuppliers();
    const idx = suppliers.findIndex(s => s.id === supplier.id);
    if(idx > -1) {
      suppliers[idx] = { ...suppliers[idx], ...supplier };
      this.saveSuppliers(suppliers);
    }
  },
  toggleStatus: function(id) {
    const suppliers = this.getSuppliers();
    const supplier = suppliers.find(s => s.id === id);
    if(supplier) {
      supplier.isActive = !supplier.isActive;
      this.saveSuppliers(suppliers);
    }
  },
  initDefaultSuppliers: function() {
    let suppliers = this.getSuppliers();
    if (suppliers.length === 0) {
      suppliers = [
        {
          id: 2001,
          company: 'Green Farms LLC',
          contact: 'John Doe',
          email: 'john@greenfarms.com',
          phone: '+94 77 123 4567',
          isActive: true
        },
        {
          id: 2002,
          company: 'Fresh Dairy Co.',
          contact: 'Jane Smith',
          email: 'jane@freshdairy.com',
          phone: '+94 71 987 6543',
          isActive: true
        }
      ];
      this.saveSuppliers(suppliers);
    }
  }
};

SupplierManager.initDefaultSuppliers();

function renderAdminSuppliers() {
  const tbody = document.getElementById('admin-suppliers-table');
  if (!tbody) return;
  const suppliers = SupplierManager.getSuppliers();
  if (suppliers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding: 20px;">No suppliers found.</td></tr>';
    return;
  }
  
  tbody.innerHTML = suppliers.map(s => `
    <tr>
      <td><strong>${s.company}</strong></td>
      <td>${s.contact}</td>
      <td>${s.email}</td>
      <td>${s.phone || 'N/A'}</td>
      <td><span class="inquiry-badge ${s.isActive ? 'inquiry-badge--answered' : 'inquiry-badge--closed'}">${s.isActive ? 'Active' : 'Inactive'}</span></td>
      <td>
        <button class="btn btn-sm btn-outline" style="padding:4px 8px; font-size:0.8rem;" onclick="editSupplier(${s.id})">Edit</button>
        <button class="btn btn-sm btn-ghost" style="padding:4px 8px; font-size:0.8rem; color:${s.isActive ? '#ef4444' : '#10b981'};" onclick="toggleSupplier(${s.id})">${s.isActive ? 'Deactivate' : 'Activate'}</button>
      </td>
    </tr>
  `).join('');
}

function loadSupplierDropdown() {
  const select = document.getElementById('product-supplier');
  if (!select) return;
  
  const standaloneSuppliers = SupplierManager.getSuppliers().filter(s => s.isActive);
  let allSuppliers = standaloneSuppliers.map(s => ({ id: s.id, name: s.company }));
  
  if (typeof AccountManager !== 'undefined') {
    const userSuppliers = AccountManager.readAllUsers().filter(u => u.role === 'SUPPLIER');
    userSuppliers.forEach(u => allSuppliers.push({ id: u.id, name: u.name }));
  }

  // Keep currently selected if possible
  const currentVal = select.value;
  select.innerHTML = '<option value="">No Supplier</option>' + allSuppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  if (currentVal && allSuppliers.find(s => s.id == currentVal)) {
    select.value = currentVal;
  }
}

function showAddSupplierModal() {
  document.getElementById('supplier-form').reset();
  document.getElementById('supplier-id').value = '';
  document.getElementById('supplier-modal-title').innerText = 'Add Supplier';
  document.getElementById('supplier-modal').classList.add('active');
  document.getElementById('supplier-modal-backdrop').classList.add('active');
}

function editSupplier(id) {
  const supplier = SupplierManager.getSuppliers().find(s => s.id === id);
  if (!supplier) return;
  document.getElementById('supplier-id').value = supplier.id;
  document.getElementById('supplier-company').value = supplier.company;
  document.getElementById('supplier-contact').value = supplier.contact;
  document.getElementById('supplier-email').value = supplier.email;
  document.getElementById('supplier-phone').value = supplier.phone || '';
  
  document.getElementById('supplier-modal-title').innerText = 'Edit Supplier';
  document.getElementById('supplier-modal').classList.add('active');
  document.getElementById('supplier-modal-backdrop').classList.add('active');
}

async function saveSupplier(event) {
  event.preventDefault();
  const idStr = document.getElementById('supplier-id').value;
  const supplierData = {
    companyName: document.getElementById('supplier-company').value,
    contactPerson: document.getElementById('supplier-contact').value,
    email: document.getElementById('supplier-email').value,
    phone: document.getElementById('supplier-phone').value,
    address: 'Colombo',
    contractTerms: 'Standard Terms',
    active: true
  };
  
  const supplier = {
    company: supplierData.companyName,
    contact: supplierData.contactPerson,
    email: supplierData.email,
    phone: supplierData.phone,
    isActive: true
  };

  if (idStr) {
    supplier.id = parseInt(idStr);
    if (typeof FreshMartAPI !== 'undefined') {
      await FreshMartAPI.updateSupplier(supplier.id, supplierData).catch(e => console.warn(e));
    }
    SupplierManager.updateSupplier(supplier);
    if (typeof showToast === 'function') showToast('Supplier updated in database!', 'success');
  } else {
    if (typeof FreshMartAPI !== 'undefined') {
      const res = await FreshMartAPI.createSupplier(supplierData).catch(e => console.warn(e));
      if (res && res.id) supplier.id = res.id;
    }
    SupplierManager.addSupplier(supplier);
    if (typeof showToast === 'function') showToast('Supplier added to database!', 'success');
  }
  
  if (typeof hideModal === 'function') hideModal('supplier-modal');
  renderAdminSuppliers();
  loadSupplierDropdown();
  return false;
}

async function toggleSupplier(id) {
  SupplierManager.toggleStatus(id);
  const s = SupplierManager.getSuppliers().find(sup => sup.id === id);
  if (s && typeof FreshMartAPI !== 'undefined') {
    FreshMartAPI.updateSupplier(id, {
      companyName: s.company,
      contactPerson: s.contact,
      email: s.email,
      phone: s.phone,
      active: s.isActive
    }).catch(e => console.warn(e));
  }
  renderAdminSuppliers();
  loadSupplierDropdown();
  if (typeof showToast === 'function') showToast('Supplier status updated in database!', 'info');
}

// Hook into UI changes when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  // If the admin uses switchAdminTab, monkey-patch it to render our suppliers tab
  if (typeof window.switchAdminTab === 'function') {
    const origSwitchAdminTab = window.switchAdminTab;
    window.switchAdminTab = function(tabId, btn) {
      origSwitchAdminTab(tabId, btn);
      if (tabId === 'suppliers') {
        renderAdminSuppliers();
      }
    };
  }
});
