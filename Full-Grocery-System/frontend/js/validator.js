/* ============================================
   validator.js — FreshMart Universal Form Validation
   Validates phone numbers, card details, emails, names, postal codes, and addresses.
   ============================================ */

const FreshValidator = (() => {
  // 1. Email Validation
  function isValidEmail(email) {
    if (!email) return false;
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).trim());
  }

  // 2. Phone Number Validation (+94..., 07..., 9 to 15 digits, digits & standard symbols only)
  function isValidPhone(phone) {
    if (!phone) return false;
    const trimmed = String(phone).trim();
    if (!/^[\d+\s\-()]+$/.test(trimmed)) return false;
    const digits = trimmed.replace(/\D/g, '');
    return digits.length >= 9 && digits.length <= 15;
  }

  // 3. Name Validation (min 2 chars, letters, spaces, hyphens, periods)
  function isValidName(name) {
    if (!name) return false;
    const trimmed = String(name).trim();
    return /^[a-zA-Z\s.'-]{2,60}$/.test(trimmed);
  }

  // 4. Postal Code Validation (5 numeric digits)
  function isValidPostalCode(zip) {
    if (!zip) return false;
    const trimmed = String(zip).trim();
    return /^\d{5}$/.test(trimmed);
  }

  // 5. Street Address Validation (min 5 chars)
  function isValidAddress(addr) {
    if (!addr) return false;
    return String(addr).trim().length >= 5;
  }

  // 6. City / District Validation (min 2 chars, letters & spaces)
  function isValidCity(city) {
    if (!city) return false;
    const trimmed = String(city).trim();
    return /^[a-zA-Z\s.'-]{2,40}$/.test(trimmed);
  }

  // 7. Password Validation (min 6 chars)
  function isValidPassword(pw) {
    return Boolean(pw && String(pw).length >= 6);
  }

  // 8. Card Number Validation (13-19 digits, standard 16 digits or Luhn algorithm)
  function isValidCardNumber(cardNum) {
    if (!cardNum) return false;
    const digits = String(cardNum).replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;
    
    // Luhn algorithm check
    let sum = 0;
    let shouldDouble = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    // Valid if passes Luhn or is 16-digit card
    return (sum % 10 === 0) || (digits.length === 16);
  }

  // 9. Card Expiry Validation (MM/YY, valid month 01-12, not expired)
  function isValidCardExpiry(expiry) {
    if (!expiry) return { valid: false, message: 'Please enter card expiry date (MM/YY)' };
    const trimmed = String(expiry).trim();
    const match = trimmed.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
    if (!match) return { valid: false, message: 'Expiry format must be MM/YY (e.g. 12/28)' };

    const month = parseInt(match[1], 10);
    const year = parseInt('20' + match[2], 10);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return { valid: false, message: 'Card has expired' };
    }
    if (year > currentYear + 20) {
      return { valid: false, message: 'Expiry year is too far in the future' };
    }
    return { valid: true };
  }

  // 10. Card CVV Validation (3 or 4 digits)
  function isValidCVV(cvv) {
    if (!cvv) return false;
    const digits = String(cvv).replace(/\D/g, '');
    return digits.length === 3 || digits.length === 4;
  }

  // 11. Cardholder Name Validation
  function isValidCardholderName(name) {
    if (!name) return false;
    const trimmed = String(name).trim();
    return /^[a-zA-Z\s.'-]{2,50}$/.test(trimmed);
  }

  // Inline error helpers
  function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.classList.add('error');
    let parent = field.parentElement;
    let errEl = parent.querySelector('.form-error');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.className = 'form-error';
      parent.appendChild(errEl);
    }
    errEl.textContent = message;
  }

  function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.classList.remove('error');
    let parent = field.parentElement;
    let errEl = parent.querySelector('.form-error');
    if (errEl) {
      errEl.remove();
    }
  }

  // Live Input Formatters & Listeners
  function attachFormatters() {
    // Card Number input: auto-space every 4 digits
    const cardInput = document.getElementById('card-number');
    if (cardInput && !cardInput.dataset.formatted) {
      cardInput.dataset.formatted = 'true';
      cardInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '').substring(0, 16);
        let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
        e.target.value = formatted;
        if (formatted.replace(/\s/g, '').length === 16) {
          clearFieldError('card-number');
        }
      });
      cardInput.addEventListener('blur', () => {
        if (!cardInput.value.trim()) {
          showFieldError('card-number', 'Card number is required');
        } else if (!isValidCardNumber(cardInput.value)) {
          showFieldError('card-number', 'Please enter a valid 16-digit card number');
        } else {
          clearFieldError('card-number');
        }
      });
    }

    // Expiry input: auto-insert /
    const expiryInput = document.getElementById('card-expiry');
    if (expiryInput && !expiryInput.dataset.formatted) {
      expiryInput.dataset.formatted = 'true';
      expiryInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '').substring(0, 4);
        if (val.length >= 3) {
          val = val.substring(0, 2) + '/' + val.substring(2);
        }
        e.target.value = val;
        if (val.length === 5) {
          const res = isValidCardExpiry(val);
          if (res.valid) clearFieldError('card-expiry');
        }
      });
      expiryInput.addEventListener('blur', () => {
        if (!expiryInput.value.trim()) {
          showFieldError('card-expiry', 'Expiry date is required');
        } else {
          const res = isValidCardExpiry(expiryInput.value);
          if (!res.valid) {
            showFieldError('card-expiry', res.message);
          } else {
            clearFieldError('card-expiry');
          }
        }
      });
    }

    // CVV input: numbers only, max 4
    const cvvInput = document.getElementById('card-cvv');
    if (cvvInput && !cvvInput.dataset.formatted) {
      cvvInput.dataset.formatted = 'true';
      cvvInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
        if (e.target.value.length >= 3) {
          clearFieldError('card-cvv');
        }
      });
      cvvInput.addEventListener('blur', () => {
        if (!cvvInput.value.trim()) {
          showFieldError('card-cvv', 'CVV is required');
        } else if (!isValidCVV(cvvInput.value)) {
          showFieldError('card-cvv', 'CVV must be 3 or 4 digits');
        } else {
          clearFieldError('card-cvv');
        }
      });
    }

    // Cardholder Name
    const cardNameInput = document.getElementById('card-name');
    if (cardNameInput && !cardNameInput.dataset.formatted) {
      cardNameInput.dataset.formatted = 'true';
      cardNameInput.addEventListener('blur', () => {
        if (!cardNameInput.value.trim()) {
          showFieldError('card-name', 'Cardholder name is required');
        } else if (!isValidCardholderName(cardNameInput.value)) {
          showFieldError('card-name', 'Please enter a valid cardholder name (letters only)');
        } else {
          clearFieldError('card-name');
        }
      });
    }

    // Phone inputs
    ['ship-phone', 'signup-phone'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.dataset.formatted) {
        el.dataset.formatted = 'true';
        el.addEventListener('input', (e) => {
          let val = e.target.value;
          let clean = val.replace(/[^\d+\s\-()]/g, '');
          if (clean.indexOf('+') > 0) {
            clean = '+' + clean.replace(/\+/g, '');
          }
          e.target.value = clean.substring(0, 20);
        });
        el.addEventListener('blur', () => {
          if (el.value.trim() && !isValidPhone(el.value)) {
            showFieldError(id, 'Please enter a valid phone number (e.g. +94 77 123 4567 or 0771234567)');
          } else if (!el.value.trim() && el.hasAttribute('required')) {
            showFieldError(id, 'Phone number is required');
          } else {
            clearFieldError(id);
          }
        });
      }
    });

    // Email inputs
    ['signup-email', 'login-email'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.dataset.formatted) {
        el.dataset.formatted = 'true';
        el.addEventListener('blur', () => {
          if (!el.value.trim()) {
            showFieldError(id, 'Email address is required');
          } else if (!isValidEmail(el.value)) {
            showFieldError(id, 'Please enter a valid email address (e.g. name@example.com)');
          } else {
            clearFieldError(id);
          }
        });
      }
    });

    // Name inputs
    ['signup-name', 'ship-name'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.dataset.formatted) {
        el.dataset.formatted = 'true';
        el.addEventListener('blur', () => {
          if (!el.value.trim()) {
            showFieldError(id, 'Full name is required');
          } else if (!isValidName(el.value)) {
            showFieldError(id, 'Full name must be at least 2 characters (letters only)');
          } else {
            clearFieldError(id);
          }
        });
      }
    });

    // Postal code input
    const zipEl = document.getElementById('ship-zip');
    if (zipEl && !zipEl.dataset.formatted) {
      zipEl.dataset.formatted = 'true';
      zipEl.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').substring(0, 5);
      });
      zipEl.addEventListener('blur', () => {
        if (!zipEl.value.trim()) {
          showFieldError('ship-zip', 'Postal code is required');
        } else if (!isValidPostalCode(zipEl.value)) {
          showFieldError('ship-zip', 'Postal code must be 5 digits (e.g. 00100)');
        } else {
          clearFieldError('ship-zip');
        }
      });
    }

    // Street Address input
    const addrEl = document.getElementById('ship-address');
    if (addrEl && !addrEl.dataset.formatted) {
      addrEl.dataset.formatted = 'true';
      addrEl.addEventListener('blur', () => {
        if (!addrEl.value.trim()) {
          showFieldError('ship-address', 'Street address is required');
        } else if (!isValidAddress(addrEl.value)) {
          showFieldError('ship-address', 'Please enter a valid street address (min 5 characters)');
        } else {
          clearFieldError('ship-address');
        }
      });
    }

    // City input
    const cityEl = document.getElementById('ship-city');
    if (cityEl && !cityEl.dataset.formatted) {
      cityEl.dataset.formatted = 'true';
      cityEl.addEventListener('blur', () => {
        if (!cityEl.value.trim()) {
          showFieldError('ship-city', 'City / District is required');
        } else if (!isValidCity(cityEl.value)) {
          showFieldError('ship-city', 'Please enter a valid city or district');
        } else {
          clearFieldError('ship-city');
        }
      });
    }
  }

  return {
    isValidEmail, isValidPhone, isValidName, isValidPostalCode, isValidAddress, isValidCity,
    isValidPassword, isValidCardNumber, isValidCardExpiry, isValidCVV, isValidCardholderName,
    showFieldError, clearFieldError, attachFormatters
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  FreshValidator.attachFormatters();
});
