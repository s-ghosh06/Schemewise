// ============================================================
// SCHEMEWISE — Auth Module
// ============================================================

const API_BASE = '';
let selectedRole = 'admin';

function setRole(role, btn) {
  selectedRole = role;
  document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('username').value = role === 'admin' ? 'admin'    : 'citizen1';
  document.getElementById('password').value = role === 'admin' ? 'admin123' : 'public123';
}

async function handleLogin() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errorEl  = document.getElementById('errorMsg');
  const loader   = document.getElementById('loginLoader');

  errorEl.classList.remove('show');

  if (!username || !password) {
    errorEl.textContent = 'Please enter both username and password.';
    errorEl.classList.add('show');
    return;
  }

  loader.classList.add('show');

  try {
    const res = await fetch(API_BASE + '/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem('sw_token', data.token);
      localStorage.setItem('sw_user',  JSON.stringify(data.user));
      if (data.user.role === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/dashboard';
      }
    } else {
      loader.classList.remove('show');
      errorEl.textContent = data.message || 'Invalid credentials.';
      errorEl.classList.add('show');
    }
  } catch (err) {
    loader.classList.remove('show');
    errorEl.textContent = 'Connection error. Is the server running?';
    errorEl.classList.add('show');
    console.error('Login error:', err);
  }
}

// Enter key support
document.addEventListener('DOMContentLoaded', () => {
  const inputs = document.querySelectorAll('.form-input');
  inputs.forEach(inp => {
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleLogin();
    });
  });

  if (document.getElementById('username')) {
    document.getElementById('username').value = 'admin';
    document.getElementById('password').value = 'admin123';
  }
});

// Toast utility
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  const icons  = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateX(40px)';
    toast.style.transition = '.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Logout
function logout() {
  localStorage.removeItem('sw_token');
  localStorage.removeItem('sw_user');
  window.location.href = '/';
}