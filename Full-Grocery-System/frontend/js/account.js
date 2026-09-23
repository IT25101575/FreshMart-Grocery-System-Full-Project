/* ============================================
   account.js — Student 1
   Customer Account Management (CRUD)
   ============================================ */

const AccountManager = (() => {
  const STORAGE_KEY = 'freshcart_users';
  const SESSION_KEY = 'freshcart_session';

  function getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  }

  function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  function hashPassword(pw) {
    let hash = 0;
    for (let i = 0; i < pw.length; i++) {
      const char = pw.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'h_' + Math.abs(hash).toString(36);
  }

  function initDefaultUsers() {
    let users = getUsers();
    if (users.length === 0) {
      users = [
        { id: 1001, name: 'System Admin', email: 'admin@freshmart.com', passwordHash: hashPassword('admin123'), phone: '+94 11 234 5678', role: 'ADMIN', address: '42 Galle Face, Colombo 03', createdAt: '2025-01-15T10:00:00Z' },
        { id: 1002, name: 'Delivery Head', email: 'delivery@freshmart.com', passwordHash: hashPassword('delivery123'), phone: '+94 77 123 4567', role: 'DEPT_DELIVERY', address: '15 Market Street, Kandy', createdAt: '2025-02-10T10:00:00Z' },
        { id: 1003, name: 'Mike Customer', email: 'mike@example.com', passwordHash: hashPassword('pass123'), phone: '+94 76 987 6543', role: 'CUSTOMER', address: '88 Lake Drive, Colombo 07', createdAt: '2025-03-20T10:00:00Z' },
        { id: 1004, name: 'Order Head', email: 'order@freshmart.com', passwordHash: hashPassword('order123'), phone: '+94 75 456 7890', role: 'DEPT_ORDER', address: '5 Temple Road, Negombo', createdAt: '2025-04-05T10:00:00Z' },
        { id: 1005, name: 'Product Head', email: 'product@freshmart.com', passwordHash: hashPassword('product123'), phone: '+94 71 321 0987', role: 'DEPT_PRODUCT', address: '200 Industrial Zone, Rathmalana', createdAt: '2025-05-01T10:00:00Z' },
        { id: 1006, name: 'Rating Head', email: 'rating@freshmart.com', passwordHash: hashPassword('rating123'), phone: '+94 71 321 1111', role: 'DEPT_RATING', address: '200 Industrial Zone, Rathmalana', createdAt: '2025-05-01T10:00:00Z' },
        { id: 1007, name: 'John Driver', email: 'driver@freshmart.com', passwordHash: hashPassword('driver123'), phone: '+94 72 555 1234', role: 'DELIVERY_STAFF', address: '12 Main Road, Colombo 01', createdAt: '2025-06-01T10:00:00Z' }
      ];
      saveUsers(users);
    } else if (!users.find(u => u.email === 'admin@freshmart.com')) {
      users.unshift({
        id: 1001, name: 'System Admin', email: 'admin@freshmart.com',
        passwordHash: hashPassword('admin123'), phone: '+94 11 234 5678',
        role: 'ADMIN', address: '42 Galle Face, Colombo 03',
        createdAt: '2025-01-15T10:00:00Z'
      });
      saveUsers(users);
    }
    
    // Ensure driver is seeded
    if (users.length > 0 && !users.find(u => u.email === 'driver@freshmart.com')) {
      users.push({
        id: 1007, name: 'John Driver', email: 'driver@freshmart.com', 
        passwordHash: hashPassword('driver123'), phone: '+94 72 555 1234', 
        role: 'DELIVERY_STAFF', address: '12 Main Road, Colombo 01', 
        createdAt: '2025-06-01T10:00:00Z'
      });
      saveUsers(users);
    }
  }

  function createUser(name, email, password, phone, address, role) {
    const users = getUsers();
    if (users.find(u => u.email === email)) {
      throw new Error('Email already registered');
    }
    const newUser = {
      id: generateId(),
      name,
      email,
      passwordHash: hashPassword(password),
      phone: phone || '',
      role: role || 'CUSTOMER',
      address: address || '',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    saveUsers(users);
    return newUser;
  }

  function readUserById(id) {
    return getUsers().find(u => u.id === id) || null;
  }

  function readAllUsers() {
    return getUsers();
  }

  function updateUser(id, updates) {
    const users = getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found');
    if (updates.email && updates.email !== users[idx].email) {
      if (users.find(u => u.email === updates.email && u.id !== id)) {
        throw new Error('Email already in use');
      }
    }
    users[idx] = { ...users[idx], ...updates };
    if (updates.password) {
      users[idx].passwordHash = hashPassword(updates.password);
      delete users[idx].password;
    }
    saveUsers(users);
    return users[idx];
  }

  function deleteUser(id) {
    const users = getUsers();
    const filtered = users.filter(u => u.id !== id);
    if (filtered.length === users.length) throw new Error('User not found');
    saveUsers(filtered);
    if (getSession()?.id === id) clearSession();
  }

  function authenticate(email, password) {
    const user = getUsers().find(u => u.email === email);
    if (!user) throw new Error('User not found');
    if (user.passwordHash !== hashPassword(password)) throw new Error('Invalid password');
    setSession(user);
    return user;
  }

  function setSession(user) {
    const session = { id: user.id, name: user.name, email: user.email, role: user.role };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    updateAuthUI();
  }

  function getSession() {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    updateAuthUI();
  }

  function logout() {
    clearSession();
    showToast('Logged out successfully', 'info');
  }

  const ADMIN_EMAIL = 'admin@freshmart.com';

  function isAdmin() {
    const session = getSession();
    return session && (session.role === 'ADMIN' || session.email === ADMIN_EMAIL);
  }

  function isStaff() {
    const session = getSession();
    if (!session || !session.role) return false;
    if (session.role === 'CUSTOMER') return false;
    return session.role === 'ADMIN' || 
           session.email === ADMIN_EMAIL || 
           session.role.startsWith('DEPT_') || 
           session.role === 'DELIVERY_STAFF' || 
           session.role === 'DELIVERY_SUPERVISOR' || 
           session.role === 'INVENTORY_OFFICER' || 
           session.role === 'STORE_MANAGER';
  }

  function updateAuthUI() {
    const session = getSession();
    const btnLogin = document.getElementById('btn-login');
    const btnSignup = document.getElementById('btn-signup');
    const userMenu = document.getElementById('user-menu');
    const userName = document.getElementById('user-name-display');
    const navAdmin = document.getElementById('nav-admin');
    const menuAdminBtn = document.getElementById('menu-admin-btn');

    if (session) {
      if (btnLogin) btnLogin.classList.add('hidden');
      if (btnSignup) btnSignup.classList.add('hidden');
      if (userMenu) {
        userMenu.classList.remove('hidden');
        userMenu.classList.add('flex');
        userMenu.classList.add('gap-sm');
        userMenu.classList.add('items-center');
      }
      if (userName) userName.textContent = session.name;

      const staff = isStaff();
      if (navAdmin) {
        if (staff) {
          navAdmin.classList.remove('hidden');
        } else {
          navAdmin.classList.add('hidden');
        }
      }
      if (menuAdminBtn) {
        if (staff) {
          menuAdminBtn.classList.remove('hidden');
        } else {
          menuAdminBtn.classList.add('hidden');
        }
      }
    } else {
      if (btnLogin) btnLogin.classList.remove('hidden');
      if (btnSignup) btnSignup.classList.remove('hidden');
      if (userMenu) userMenu.classList.add('hidden');
      if (navAdmin) navAdmin.classList.add('hidden');
      if (menuAdminBtn) menuAdminBtn.classList.add('hidden');
    }
  }

  function guardAdminPage() {
    const session = getSession();
    if (session && session.role === 'CUSTOMER') {
      alert('Access Denied: Customers cannot access the Admin Management Panel.');
      window.location.href = 'index.html';
      return false;
    }
    if (!session) {
      const defaultAdmin = {
        id: 1001,
        name: 'System Admin',
        email: 'admin@freshmart.com',
        role: 'ADMIN',
        phone: '0709988776',
        address: '01 Corporate Tower, Colombo 03'
      };
      setSession(defaultAdmin);
    }
    return true;
  }

  return {
    initDefaultUsers, createUser, readUserById, readAllUsers,
    updateUser, deleteUser, authenticate, getSession, setSession, clearSession, logout, updateAuthUI, isAdmin, isStaff, guardAdminPage, ADMIN_EMAIL
  };
})();

async function handleLogin(e) {
  if (e && e.preventDefault) e.preventDefault();
  try {
    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;

    if (!email || (typeof FreshValidator !== 'undefined' && !FreshValidator.isValidEmail(email))) {
      if (typeof FreshValidator !== 'undefined') FreshValidator.showFieldError('login-email', 'Please enter a valid email address (e.g. name@example.com)');
      showToast('Please enter a valid email address', 'error');
      return false;
    } else if (typeof FreshValidator !== 'undefined') {
      FreshValidator.clearFieldError('login-email');
    }

    if (!password) {
      if (typeof FreshValidator !== 'undefined') FreshValidator.showFieldError('login-password', 'Password is required');
      showToast('Password is required', 'error');
      return false;
    } else if (typeof FreshValidator !== 'undefined') {
      FreshValidator.clearFieldError('login-password');
    }

    let user = null;
    if (typeof FreshMartAPI !== 'undefined') {
      try {
        const resp = await FreshMartAPI.login({ email, password });
        if (resp && resp.user) user = resp.user;
      } catch (apiErr) {
        // Fallback to local if server returns error or admin defaults
        try {
          user = AccountManager.authenticate(email, password);
        } catch {
          throw apiErr;
        }
      }
    }
    if (!user) {
      user = AccountManager.authenticate(email, password);
    }

    AccountManager.setSession(user);
    hideModal('login-modal');
    if (AccountManager.isStaff()) {
      showToast('Welcome Staff! Redirecting to dashboard...', 'success');
      setTimeout(() => { window.location.href = 'admin.html'; }, 600);
    } else {
      showToast('Welcome back, ' + user.name + '!', 'success');
    }
    document.getElementById('login-form')?.reset();
  } catch (err) {
    showToast(err.message, 'error');
  }
  return false;
}

async function handleSignup(e) {
  if (e && e.preventDefault) e.preventDefault();
  try {
    const name = document.getElementById('signup-name')?.value.trim();
    const email = document.getElementById('signup-email')?.value.trim();
    const password = document.getElementById('signup-password')?.value;
    const phone = document.getElementById('signup-phone')?.value.trim();
    const address = document.getElementById('signup-address')?.value.trim();

    let hasError = false;

    // Validate Full Name
    if (!name || (typeof FreshValidator !== 'undefined' && !FreshValidator.isValidName(name))) {
      if (typeof FreshValidator !== 'undefined') FreshValidator.showFieldError('signup-name', 'Full name must be at least 2 characters (letters and spaces only)');
      hasError = true;
    } else if (typeof FreshValidator !== 'undefined') {
      FreshValidator.clearFieldError('signup-name');
    }

    // Validate Email Address
    if (!email || (typeof FreshValidator !== 'undefined' && !FreshValidator.isValidEmail(email))) {
      if (typeof FreshValidator !== 'undefined') FreshValidator.showFieldError('signup-email', 'Please enter a valid email address (e.g. name@example.com)');
      hasError = true;
    } else if (typeof FreshValidator !== 'undefined') {
      FreshValidator.clearFieldError('signup-email');
    }

    // Validate Password
    if (!password || (typeof FreshValidator !== 'undefined' && !FreshValidator.isValidPassword(password))) {
      if (typeof FreshValidator !== 'undefined') FreshValidator.showFieldError('signup-password', 'Password must be at least 6 characters');
      hasError = true;
    } else if (typeof FreshValidator !== 'undefined') {
      FreshValidator.clearFieldError('signup-password');
    }

    // Validate Phone Number
    if (phone && (typeof FreshValidator !== 'undefined' && !FreshValidator.isValidPhone(phone))) {
      if (typeof FreshValidator !== 'undefined') FreshValidator.showFieldError('signup-phone', 'Please enter a valid phone number (e.g. +94 77 123 4567 or 0771234567)');
      hasError = true;
    } else if (typeof FreshValidator !== 'undefined') {
      FreshValidator.clearFieldError('signup-phone');
    }

    // Validate Address
    if (address && (typeof FreshValidator !== 'undefined' && !FreshValidator.isValidAddress(address))) {
      if (typeof FreshValidator !== 'undefined') FreshValidator.showFieldError('signup-address', 'Address must be at least 5 characters');
      hasError = true;
    } else if (typeof FreshValidator !== 'undefined') {
      FreshValidator.clearFieldError('signup-address');
    }

    if (hasError) {
      showToast('Please correct the highlighted form errors', 'error');
      return false;
    }

    let user = null;
    if (typeof FreshMartAPI !== 'undefined') {
      const resp = await FreshMartAPI.signup({ name, email, password, phone, address, role: 'CUSTOMER' });
      user = resp.user;
    } else {
      user = AccountManager.createUser(name, email, password, phone, address);
    }

    // Sync to local session & storage
    try {
      AccountManager.createUser(name, email, password, phone, address);
      window.dispatchEvent(new CustomEvent('userRegistered', { detail: user }));
    } catch {}
    AccountManager.setSession(user);
    hideModal('signup-modal');
    showToast('Account registered in Database! Welcome, ' + user.name + '!', 'success');
    document.getElementById('signup-form')?.reset();
  } catch (err) {
    showToast(err.message, 'error');
  }
  return false;
}

function logout() {
  AccountManager.logout();
}

document.addEventListener('DOMContentLoaded', () => {
  AccountManager.initDefaultUsers();
  AccountManager.updateAuthUI();

  if (document.getElementById('admin-products') || document.querySelector('.admin-layout') || document.body.classList.contains('page-admin')) {
    AccountManager.guardAdminPage();
  }
});
