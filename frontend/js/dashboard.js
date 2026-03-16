// ============================================================
// SCHEMEWISE — Public Dashboard Logic
// ============================================================

const user = JSON.parse(localStorage.getItem('sw_user') || '{}');
if (!user.username) window.location.href = '/';

document.getElementById('sidebarUsername').textContent = user.username || 'User';
document.getElementById('userAvatar').textContent = (user.username || 'U')[0].toUpperCase();

// Dark mode
function toggleDark() {
  const d  = document.documentElement;
  const on = d.getAttribute('data-theme') === 'dark';
  d.setAttribute('data-theme', on ? 'light' : 'dark');
  document.getElementById('darkBtn').textContent = on ? '🌙' : '☀️';
  localStorage.setItem('sw_dark', on ? '' : '1');
}
if (localStorage.getItem('sw_dark')) {
  document.documentElement.setAttribute('data-theme', 'dark');
  document.getElementById('darkBtn').textContent = '☀️';
}

// Section switcher
function showSection(id, el) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('section-' + id).classList.add('active');
  if (el) el.classList.add('active');
  if (id === 'schemes') loadPubSchemes();
  if (id === 'updates') loadPubAudit();
}

const API = '';

// Stats
async function loadStats() {
  try {
    const r = await fetch(API + '/api/dashboard/stats');
    const j = await r.json();
    if (j.success) {
      document.getElementById('pub-beneficiaries').textContent = j.data.total_beneficiaries;
      document.getElementById('pub-schemes').textContent       = j.data.active_schemes;
      document.getElementById('pub-enrollments').textContent   = j.data.total_enrollments;
    }
  } catch(e) { console.error(e); }
}

// Pie chart
async function loadPieChart() {
  try {
    const r = await fetch(API + '/api/schemes/distribution');
    const j = await r.json();
    if (!j.success) return;
    const colors = ['#0a1628','#FF9933','#138808','#3182ce','#e53e3e','#805ad5','#dd6b20','#38a169'];
    new Chart(document.getElementById('pubPieChart'), {
      type: 'doughnut',
      data: {
        labels:   j.data.map(d => d.scheme_name),
        datasets: [{
          data:            j.data.map(d => d.count || 1),
          backgroundColor: colors,
          borderWidth:     2,
          borderColor:     '#fff'
        }]
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } }
        }
      }
    });
  } catch(e) { console.error(e); }
}

// Schemes table
async function loadPubSchemes() {
  try {
    const r     = await fetch(API + '/api/schemes/all');
    const j     = await r.json();
    const tbody = document.getElementById('pubSchemeTableBody');
    if (!j.success || !j.data.length) {
      tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">📋</div><p>No schemes found</p></div></td></tr>';
      return;
    }
    tbody.innerHTML = j.data.map((s, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${s.scheme_name}</td>
        <td><span class="badge badge-info">${s.category}</span></td>
        <td><span class="badge ${s.is_active ? 'badge-success' : 'badge-neutral'}">${s.is_active ? 'Active' : 'Inactive'}</span></td>
        <td>${s.enrolled_count}</td>
      </tr>`).join('');
  } catch(e) { console.error(e); }
}

// Audit log
async function loadPubAudit() {
  try {
    const r     = await fetch(API + '/api/audit/all');
    const j     = await r.json();
    const tbody = document.getElementById('pubAuditBody');
    if (!j.success || !j.data.length) {
      tbody.innerHTML = '<tr><td colspan="3"><div class="empty-state"><p>No logs</p></div></td></tr>';
      return;
    }
    tbody.innerHTML = j.data.slice(0, 20).map((l, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${l.action_description}</td>
        <td style="font-family:'IBM Plex Mono',monospace;font-size:.78rem;">${new Date(l.created_at).toLocaleString('en-IN')}</td>
      </tr>`).join('');
  } catch(e) { console.error(e); }
}

// Logout
function logout() {
  localStorage.removeItem('sw_token');
  localStorage.removeItem('sw_user');
  window.location.href = '/';
}

// Init
loadStats();
loadPieChart();