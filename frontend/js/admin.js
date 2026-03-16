// ============================================================
// SCHEMEWISE — Admin Dashboard Logic
// ============================================================

const API = '';
let pieChartInstance = null;
let barChartInstance = null;

// Auth guard
const currentUser = JSON.parse(localStorage.getItem('sw_user') || '{}');
if (!currentUser.username || currentUser.role !== 'admin') {
  window.location.href = '/';
}

document.getElementById('sidebarUsername').textContent = currentUser.username;
document.getElementById('userAvatar').textContent = currentUser.username[0].toUpperCase();

// Dark mode
function toggleDark() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  document.getElementById('darkBtn').textContent = isDark ? '🌙' : '☀️';
  localStorage.setItem('sw_dark', isDark ? '' : '1');
  if (pieChartInstance) { pieChartInstance.destroy(); pieChartInstance = null; }
  if (barChartInstance) { barChartInstance.destroy(); barChartInstance = null; }
  loadCharts();
}
if (localStorage.getItem('sw_dark')) {
  document.documentElement.setAttribute('data-theme', 'dark');
  document.getElementById('darkBtn').textContent = '☀️';
}

// Section navigation
function showSection(id, el) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('section-' + id).classList.add('active');
  if (el) el.classList.add('active');

  const titles = {
    dashboard:     'Dashboard Overview',
    beneficiaries: 'Beneficiary Management',
    schemes:       'Welfare Schemes',
    compliance:    'Compliance Alerts',
    audit:         'System Audit Log'
  };
  document.getElementById('pageHeading').textContent = titles[id] || '';

  if (id === 'beneficiaries') loadBeneficiaries();
  if (id === 'schemes')       loadSchemes();
  if (id === 'compliance')    loadAlerts();
  if (id === 'audit')         loadAuditLogs();
}

// Notification dropdown
function toggleNotif() {
  document.getElementById('notifDropdown').classList.toggle('show');
}
document.addEventListener('click', e => {
  const btn = document.getElementById('notifBtn');
  const dd  = document.getElementById('notifDropdown');
  if (!btn.contains(e.target) && !dd.contains(e.target)) {
    dd.classList.remove('show');
  }
});

// Dashboard stats
async function loadStats() {
  try {
    const res  = await fetch(API + '/api/dashboard/stats');
    const data = await res.json();
    if (data.success) {
      const d = data.data;
      document.getElementById('stat-beneficiaries').textContent = d.total_beneficiaries;
      document.getElementById('stat-schemes').textContent       = d.active_schemes;
      document.getElementById('stat-alerts').textContent        = d.duplicate_alerts;
      document.getElementById('stat-enrollments').textContent   = d.total_enrollments;
      document.getElementById('notifCount').textContent         = d.total_alerts;
      document.getElementById('notifCountLabel').textContent    = d.total_alerts + ' alerts';
    }
  } catch (err) {
    console.error('Stats error:', err);
    showToast('Failed to load dashboard stats', 'error');
  }
}

// Notifications
async function loadNotifications() {
  try {
    const res  = await fetch(API + '/api/alerts/all');
    const data = await res.json();
    if (!data.success) return;
    const list   = document.getElementById('notifList');
    const alerts = data.data.slice(0, 5);
    if (!alerts.length) {
      list.innerHTML = '<div class="notif-item"><div>No alerts</div></div>';
      return;
    }
    const typeMap = {
      duplicate_enrollment: { dot: 'danger',  label: 'Duplicate Enrollment' },
      income_mismatch:      { dot: 'warning', label: 'Income Mismatch'      },
      eligibility_failure:  { dot: 'danger',  label: 'Eligibility Failure'  },
      general:              { dot: 'info',    label: 'General Alert'        }
    };
    list.innerHTML = alerts.map(a => {
      const t = typeMap[a.alert_type] || typeMap.general;
      return `<div class="notif-item">
        <div class="notif-dot ${t.dot}"></div>
        <div>
          <strong>${t.label}</strong><br/>
          <span style="color:var(--text-muted);font-size:.78rem;">${a.beneficiary_name} — ${a.scheme_name}</span>
        </div>
      </div>`;
    }).join('');
  } catch(e) {}
}

// Charts
async function loadCharts() {
  await loadPieChart();
  await loadBarChart();
}

async function loadPieChart() {
  try {
    const res  = await fetch(API + '/api/schemes/distribution');
    const data = await res.json();
    if (!data.success) return;
    if (pieChartInstance) pieChartInstance.destroy();

    const colors    = ['#0a1628','#FF9933','#138808','#3182ce','#e53e3e','#805ad5','#dd6b20','#38a169'];
    const chartData = data.data;

    pieChartInstance = new Chart(document.getElementById('pieChart'), {
      type: 'doughnut',
      data: {
        labels:   chartData.map(d => d.scheme_name),
        datasets: [{
          data:            chartData.map(d => d.count || 1),
          backgroundColor: colors,
          borderWidth:     3,
          borderColor:     '#fff'
        }]
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels:   { boxWidth: 12, font: { size: 11, family: 'IBM Plex Sans' } }
          }
        }
      }
    });
  } catch (err) { console.error('Pie chart error:', err); }
}

async function loadBarChart() {
  try {
    const res  = await fetch(API + '/api/schemes/enrollment');
    const data = await res.json();
    if (!data.success) return;
    if (barChartInstance) barChartInstance.destroy();

    const d = data.data;

    barChartInstance = new Chart(document.getElementById('barChart'), {
      type: 'bar',
      data: {
        labels: d.map(s => s.scheme_name.length > 22 ? s.scheme_name.substring(0,22) + '…' : s.scheme_name),
        datasets: [
          {
            label:           'Total Enrolled',
            data:            d.map(s => s.total_enrolled),
            backgroundColor: 'rgba(10,22,40,.8)',
            borderRadius:    4
          },
          {
            label:           'Active Enrolled',
            data:            d.map(s => s.active_enrolled),
            backgroundColor: 'rgba(255,153,51,.8)',
            borderRadius:    4
          }
        ]
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { font: { size: 10 }, maxRotation: 45 }, grid: { display: false } },
          y: { ticks: { font: { size: 11 } }, grid: { color: 'rgba(128,128,128,.12)' }, beginAtZero: true }
        },
        plugins: {
          legend: { labels: { font: { size: 11 }, boxWidth: 12 } }
        }
      }
    });
  } catch (err) { console.error('Bar chart error:', err); }
}

// Modal helpers
function openModal(id) {
  document.getElementById(id).classList.add('show');
  if (id === 'enrollModal') populateEnrollSelects();
}
function closeModal(id) {
  document.getElementById(id).classList.remove('show');
}
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('show');
  }
});

// Table filter
function filterTable(tableId, query) {
  const tbody = document.querySelector('#' + tableId + ' tbody');
  const rows  = tbody.querySelectorAll('tr');
  const q     = query.toLowerCase();
  rows.forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

// Refresh
function refreshDashboard() {
  loadStats();
  loadNotifications();
  if (pieChartInstance) { pieChartInstance.destroy(); pieChartInstance = null; }
  if (barChartInstance) { barChartInstance.destroy(); barChartInstance = null; }
  loadCharts();
  showToast('Dashboard refreshed', 'success');
}

// Audit logs
async function loadAuditLogs() {
  const tbody = document.getElementById('auditTableBody');
  try {
    const res  = await fetch(API + '/api/audit/all');
    const data = await res.json();
    if (!data.success || !data.data.length) {
      tbody.innerHTML = '<tr><td colspan="4"><div class="empty-state"><div class="empty-icon">📝</div><p>No audit logs found</p></div></td></tr>';
      return;
    }
    tbody.innerHTML = data.data.map((log, i) => `
      <tr>
        <td style="font-family:'IBM Plex Mono',monospace;font-size:.8rem;color:var(--text-muted)">${log.log_id}</td>
        <td>${escapeHtml(log.action_description)}</td>
        <td><span class="badge badge-neutral">${log.username || 'System'}</span></td>
        <td style="font-family:'IBM Plex Mono',monospace;font-size:.78rem;">${new Date(log.created_at).toLocaleString('en-IN')}</td>
      </tr>`).join('');
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="4"><div class="empty-state"><div class="empty-icon">⚠️</div><p>Failed to load audit logs</p></div></td></tr>';
  }
}

// Alerts
async function loadAlerts() {
  const tbody = document.getElementById('alertTableBody');
  try {
    const res  = await fetch(API + '/api/alerts/all');
    const data = await res.json();
    if (!data.success || !data.data.length) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">✅</div><h3>No Alerts</h3><p>System is compliant</p></div></td></tr>';
      return;
    }
    const alertLabels = {
      duplicate_enrollment: { badge: 'badge-danger',  label: 'Duplicate Enrollment' },
      income_mismatch:      { badge: 'badge-warning', label: 'Income Mismatch'      },
      eligibility_failure:  { badge: 'badge-danger',  label: 'Eligibility Failure'  },
      general:              { badge: 'badge-neutral', label: 'General'              }
    };
    tbody.innerHTML = data.data.map((a, i) => {
      const t = alertLabels[a.alert_type] || alertLabels.general;
      return `<tr>
        <td>${i+1}</td>
        <td><strong>${escapeHtml(a.beneficiary_name)}</strong></td>
        <td style="font-family:'IBM Plex Mono',monospace;font-size:.8rem;">${a.aadhaar_number}</td>
        <td>${escapeHtml(a.scheme_name)}</td>
        <td><span class="badge ${t.badge}">${t.label}</span></td>
        <td style="font-size:.8rem;color:var(--text-muted)">${new Date(a.created_at).toLocaleDateString('en-IN')}</td>
      </tr>`;
    }).join('');
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>Failed to load alerts</p></div></td></tr>';
  }
}

// Schemes
async function loadSchemes() {
  const tbody = document.getElementById('schemeTableBody');
  try {
    const res  = await fetch(API + '/api/schemes/all');
    const data = await res.json();
    if (!data.success || !data.data.length) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>No schemes</p></div></td></tr>';
      return;
    }
    tbody.innerHTML = data.data.map((s, i) => `
      <tr>
        <td>${i+1}</td>
        <td><strong>${escapeHtml(s.scheme_name)}</strong></td>
        <td><span class="badge badge-info">${s.category}</span></td>
        <td><span class="badge ${s.is_active ? 'badge-success' : 'badge-neutral'}">${s.is_active ? 'Active' : 'Inactive'}</span></td>
        <td>${s.enrolled_count}</td>
        <td style="font-size:.8rem;color:var(--text-muted)">${new Date(s.created_at).toLocaleDateString('en-IN')}</td>
      </tr>`).join('');
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>Failed to load schemes</p></div></td></tr>';
  }
}

// Utility
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadNotifications();
  loadCharts();
});