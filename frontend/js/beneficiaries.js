// ============================================================
// SCHEMEWISE — Beneficiaries Frontend Module
// ============================================================

const API_B = '';

// ── Load all beneficiaries ────────────────────────────────────
async function loadBeneficiaries() {
  const tbody = document.getElementById('benTableBody');
  const count = document.getElementById('benCount');
  try {
    const res  = await fetch(API_B + '/api/beneficiaries/all');
    const data = await res.json();

    if (!data.success || !data.data.length) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">👥</div><h3>No Beneficiaries</h3><p>Add your first beneficiary using the button above</p></div></td></tr>';
      count.textContent = 'No records found';
      return;
    }

    tbody.innerHTML = data.data.map((b, i) => `
      <tr>
        <td style="font-family:'IBM Plex Mono',monospace;font-size:.8rem;color:var(--text-muted)">${b.beneficiary_id}</td>
        <td><strong>${escapeHtml(b.full_name)}</strong></td>
        <td style="font-family:'IBM Plex Mono',monospace;font-size:.85rem;">${b.aadhaar_number}</td>
        <td>₹${Number(b.income).toLocaleString('en-IN')}</td>
        <td><span class="badge ${b.beneficiary_type === 'BPL' ? 'badge-warning' : b.beneficiary_type === 'APL' ? 'badge-info' : 'badge-danger'}">${b.beneficiary_type}</span></td>
        <td><span class="badge badge-neutral">${b.enrollment_count} scheme${b.enrollment_count !== 1 ? 's' : ''}</span></td>
        <td style="font-size:.8rem;color:var(--text-muted)">${new Date(b.created_at).toLocaleDateString('en-IN')}</td>
      </tr>`).join('');

    count.textContent = `Showing ${data.data.length} beneficiar${data.data.length !== 1 ? 'ies' : 'y'}`;
  } catch(e) {
    console.error('Load beneficiaries error:', e);
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">⚠️</div><p>Failed to load beneficiaries. Is the server running?</p></div></td></tr>';
  }
}

// ── Submit add beneficiary ────────────────────────────────────
async function submitAddBeneficiary() {
  const name     = document.getElementById('ben-name').value.trim();
  const aadhaar  = document.getElementById('ben-aadhaar').value.trim();
  const income   = document.getElementById('ben-income').value;
  const type     = document.getElementById('ben-type').value;
  const errorEl  = document.getElementById('addBenError');

  errorEl.classList.remove('show');

  if (!name) { errorEl.textContent = 'Full name is required.'; errorEl.classList.add('show'); return; }
  if (!aadhaar || !/^\d{12}$/.test(aadhaar)) {
    errorEl.textContent = 'Aadhaar number must be exactly 12 digits.';
    errorEl.classList.add('show');
    return;
  }

  try {
    const res  = await fetch(API_B + '/api/beneficiaries/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: name, aadhaar_number: aadhaar, income: income || 0, beneficiary_type: type })
    });
    const data = await res.json();

    if (data.success) {
      closeModal('addBenModal');
      showToast('Beneficiary added successfully!', 'success');
      // Clear form
      ['ben-name','ben-aadhaar','ben-income'].forEach(id => document.getElementById(id).value = '');
      loadBeneficiaries();
    } else {
      errorEl.textContent = data.message || 'Failed to add beneficiary.';
      errorEl.classList.add('show');
    }
  } catch(e) {
    errorEl.textContent = 'Server error. Please try again.';
    errorEl.classList.add('show');
  }
}

// ── Populate enroll dropdowns ─────────────────────────────────
async function populateEnrollSelects() {
  try {
    const [benRes, schRes] = await Promise.all([
      fetch(API_B + '/api/beneficiaries/all'),
      fetch(API_B + '/api/schemes/all')
    ]);
    const benData = await benRes.json();
    const schData = await schRes.json();

    const benSelect  = document.getElementById('enroll-ben');
    const schSelect  = document.getElementById('enroll-scheme');

    if (benData.success) {
      benSelect.innerHTML = '<option value="">-- Select Beneficiary --</option>' +
        benData.data.map(b => `<option value="${b.beneficiary_id}">${b.full_name} (${b.aadhaar_number})</option>`).join('');
    }
    if (schData.success) {
      schSelect.innerHTML = '<option value="">-- Select Scheme --</option>' +
        schData.data.filter(s => s.is_active).map(s => `<option value="${s.scheme_id}">${s.scheme_name}</option>`).join('');
    }
  } catch(e) {
    console.error('Populate selects error:', e);
  }
}

// ── Submit enrollment ─────────────────────────────────────────
async function submitEnrollment() {
  const benId   = document.getElementById('enroll-ben').value;
  const schId   = document.getElementById('enroll-scheme').value;
  const errorEl = document.getElementById('enrollError');

  errorEl.classList.remove('show');

  if (!benId)  { errorEl.textContent = 'Please select a beneficiary.'; errorEl.classList.add('show'); return; }
  if (!schId)  { errorEl.textContent = 'Please select a scheme.';      errorEl.classList.add('show'); return; }

  try {
    const res  = await fetch(API_B + '/api/beneficiaries/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ beneficiary_id: benId, scheme_id: schId })
    });
    const data = await res.json();

    if (data.success) {
      closeModal('enrollModal');
      showToast('Enrollment successful!', 'success');
      loadBeneficiaries();
    } else {
      errorEl.textContent = data.message || 'Enrollment failed.';
      errorEl.classList.add('show');
      if (data.message && data.message.includes('already enrolled')) {
        showToast('Duplicate enrollment alert generated!', 'warning');
      }
    }
  } catch(e) {
    errorEl.textContent = 'Server error. Please try again.';
    errorEl.classList.add('show');
  }
}

// ── Utility ───────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}