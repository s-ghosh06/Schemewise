// ============================================================
// SCHEMEWISE — Scheme Analysis Frontend Logic
// ============================================================

// Auth guard
const user = JSON.parse(localStorage.getItem('sw_user') || 'null');
if (!user || user.role !== 'admin') window.location.href = '/';

// Sync dark mode — explicitly set light or dark
const savedTheme = localStorage.getItem('sw_dark');
document.documentElement.setAttribute('data-theme', savedTheme ? 'dark' : 'light');
if (document.getElementById('darkBtn')) {
  document.getElementById('darkBtn').textContent = savedTheme ? '☀️' : '🌙';
}

// Set user info in sidebar
document.getElementById('sidebarUsername').textContent = user.username || 'Admin';
document.getElementById('userAvatar').textContent = (user.username || 'A')[0].toUpperCase();

// Dark mode toggle
function toggleDark() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  document.getElementById('darkBtn').textContent = isDark ? '🌙' : '☀️';
  localStorage.setItem('sw_dark', isDark ? '' : '1');
}

// Notification dropdown
function toggleNotif() {
  document.getElementById('notifDropdown').classList.toggle('show');
}
document.addEventListener('click', e => {
  const btn = document.getElementById('notifBtn');
  const dd  = document.getElementById('notifDropdown');
  if (btn && dd && !btn.contains(e.target) && !dd.contains(e.target)) {
    dd.classList.remove('show');
  }
});

// Load notifications
async function loadNotifications() {
  try {
    const res  = await fetch('/api/alerts/all');
    const data = await res.json();
    if (!data.success) return;
    const list   = document.getElementById('notifList');
    const alerts = data.data.slice(0, 5);
    document.getElementById('notifCount').textContent      = data.data.length;
    document.getElementById('notifCountLabel').textContent = data.data.length + ' alerts';
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

// Check ML service status
async function checkMLStatus() {
  try {
    const res  = await fetch('/api/ml/health');
    const data = await res.json();
    if (data.status === 'ok') {
      document.getElementById('statusDot').className    = 'status-dot online';
      document.getElementById('statusText').textContent = 'ML Service Online';
    } else throw new Error();
  } catch {
    document.getElementById('statusDot').className    = 'status-dot offline';
    document.getElementById('statusText').textContent = 'ML Offline';
  }
}

// Load beneficiaries into dropdown
async function loadBeneficiaries() {
  try {
    const token = localStorage.getItem('sw_token');
    const res   = await fetch('/api/beneficiaries/all', { headers: { Authorization: `Bearer ${token}` } });
    const data  = await res.json();
    const sel   = document.getElementById('recoBeneficiary');
    (data.data || []).forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.beneficiary_id;
      opt.textContent = `${b.full_name} (${b.beneficiary_type}, ₹${Number(b.income).toLocaleString('en-IN')})`;
      sel.appendChild(opt);
    });
  } catch(e) { console.error(e); }
}

// 1. Scheme Recommendation
async function loadRecommendations() {
  const id  = document.getElementById('recoBeneficiary').value;
  const box = document.getElementById('recoResults');
  if (!id) return;
  box.innerHTML = '<span class="loading-spinner"></span> Loading recommendations…';
  try {
    const res  = await fetch(`/api/ml/recommend/${id}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    box.innerHTML = data.recommendations.map(r => {
      const cls   = r.match_percent >= 70 ? 'fill-high' : r.match_percent >= 40 ? 'fill-medium' : 'fill-low';
      const badge = r.already_enrolled
        ? '<span class="badge-enrolled">Enrolled</span>'
        : r.eligible
          ? '<span class="badge-eligible">Eligible</span>'
          : '<span class="badge-ineligible">Not Eligible</span>';
      return `
        <div class="scheme-bar">
          <div class="scheme-bar-label">
            <span>${r.scheme_name} ${badge}</span>
            <strong>${r.match_percent}%</strong>
          </div>
          <div class="scheme-bar-track">
            <div class="scheme-bar-fill ${cls}" style="width:${r.match_percent}%"></div>
          </div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">${r.reason}</div>
        </div>`;
    }).join('');
  } catch(e) {
    box.innerHTML = `<p style="color:#ef4444;">Error: ${e.message}. Is the ML service running?</p>`;
  }
}

// 2. Fraud Detection
async function runFraudDetection() {
  const btn = document.getElementById('fraudBtn');
  const box = document.getElementById('fraudResults');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner"></span> Analysing…';
  try {
    const res  = await fetch('/api/ml/fraud');
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    if (!data.alerts.length) {
      box.innerHTML = '<p style="color:#22c55e;font-weight:600;">✅ No fraud or anomalies detected.</p>';
    } else {
      box.innerHTML = `<p style="font-size:0.82rem;margin-bottom:10px;font-weight:600;">Found <span style="color:#ef4444;">${data.total_alerts}</span> alert(s):</p>` +
        data.alerts.map(a => `
          <div class="fraud-item fraud-${a.severity}">
            <div class="fraud-name">${a.beneficiary_name}
              <span style="font-weight:400;font-size:0.78rem;">#${a.beneficiary_id}</span>
              ${a.ml_flagged ? '<span style="font-size:0.72rem;background:#e0e7ff;color:#3730a3;padding:1px 6px;border-radius:99px;margin-left:4px;">ML</span>' : ''}
            </div>
            <div class="fraud-msg">${a.message}</div>
            <div class="fraud-conf" style="color:${a.severity==='high'?'#dc2626':a.severity==='medium'?'#d97706':'#16a34a'}">
              Confidence: ${a.confidence}% · ${a.alert_type.replace(/_/g,' ')}
            </div>
          </div>`).join('');
    }
  } catch(e) {
    box.innerHTML = `<p style="color:#ef4444;">Error: ${e.message}. Is the ML service running?</p>`;
  }
  btn.disabled = false;
  btn.innerHTML = 'Run Detection on All Beneficiaries';
}

// 3. Eligibility Predictor
async function predictEligibility() {
  const income    = document.getElementById('predIncome').value;
  const b_type    = document.getElementById('predType').value;
  const scheme_id = document.getElementById('predScheme').value;
  const box       = document.getElementById('predictResult');
  if (!income) { box.innerHTML = '<p style="color:#ef4444;">Please enter an income value.</p>'; return; }
  box.innerHTML = '<span class="loading-spinner"></span> Predicting…';
  try {
    const res  = await fetch('/api/ml/predict', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ income: Number(income), beneficiary_type: b_type, scheme_id: Number(scheme_id) })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    box.innerHTML = `
      <div class="predict-result ${data.eligible ? 'eligible' : 'ineligible'}">
        <div class="predict-big">${data.eligible ? '✅ Eligible' : '❌ Not Eligible'}</div>
        <div class="predict-sub">${data.scheme_name}</div>
        <div style="margin-top:10px;font-size:0.85rem;">
          Confidence: <strong>${data.confidence}%</strong><br/>
          Eligible probability: <strong>${data.probability.eligible}%</strong>
        </div>
        <div style="margin-top:8px;font-size:0.78rem;">
          Income limit: ₹${data.factors.max_income.toLocaleString('en-IN')} ·
          Required: ${data.factors.preferred_types.join(' / ')}
        </div>
      </div>`;
  } catch(e) {
    box.innerHTML = `<p style="color:#ef4444;">Error: ${e.message}. Is the ML service running?</p>`;
  }
}

// 4. Batch Predict
async function batchPredict() {
  const income = document.getElementById('batchIncome').value;
  const b_type = document.getElementById('batchType').value;
  const box    = document.getElementById('batchResults');
  if (!income) { box.innerHTML = '<p style="color:#ef4444;">Please enter income.</p>'; return; }
  box.innerHTML = '<span class="loading-spinner"></span> Checking all schemes…';
  try {
    const res  = await fetch('/api/ml/predict-all', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ income: Number(income), beneficiary_type: b_type })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    const eligible   = data.predictions.filter(p => p.eligible).length;
    const ineligible = data.predictions.filter(p => !p.eligible).length;
    box.innerHTML = `
      <p style="font-size:0.82rem;margin-bottom:10px;">
        <strong style="color:#22c55e;">${eligible} Eligible</strong> ·
        <strong style="color:#ef4444;">${ineligible} Not Eligible</strong>
      </p>` +
      data.predictions.map(p => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border);font-size:0.82rem;">
          <span style="color:var(--text-primary)">${p.scheme_name}</span>
          <span class="${p.eligible ? 'badge-eligible' : 'badge-ineligible'}">${p.eligible ? 'Eligible' : 'No'}</span>
        </div>`).join('');
  } catch(e) {
    box.innerHTML = `<p style="color:#ef4444;">Error: ${e.message}. Is the ML service running?</p>`;
  }
}

// Init
checkMLStatus();
loadBeneficiaries();
loadNotifications();