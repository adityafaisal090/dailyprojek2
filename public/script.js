const alumniTableBody = document.getElementById('alumniTableBody');
const alumniForm = document.getElementById('alumniForm');
const alertArea = document.getElementById('alertArea');
const totalAlumniEl = document.getElementById('totalAlumni');
const lastTrackingEl = document.getElementById('lastTracking');
const trackingCard = document.getElementById('trackingCard');
const searchInput = document.getElementById('searchInput');
const btnRefresh = document.getElementById('btnRefresh');
const btnLogout = document.getElementById('btnLogout');

let alumniCache = [];

function showAlert(type, message) {
  const wrapper = document.createElement('div');
  wrapper.className = `alert alert-${type} alert-dismissible fade show`;
  wrapper.role = 'alert';
  wrapper.innerHTML = `
    <div>${message}</div>
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  alertArea.appendChild(wrapper);

  setTimeout(() => {
    try {
      wrapper.classList.remove('show');
      wrapper.remove();
    } catch {}
  }, 3500);
}

async function logout() {
  const res = await fetch('/auth/logout', { method: 'POST' });
  if (res.status === 401) {
    window.location.href = '/login.html';
    return;
  }
  window.location.href = '/login.html';
}

function setTrackingCardLoading(isLoading, label = 'Memproses pelacakan...') {
  if (!isLoading) return;
  trackingCard.innerHTML = `
    <div class="card-body d-flex align-items-center gap-2">
      <div class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>
      <div>${label}</div>
    </div>
  `;
}

function renderTrackingResult(data) {
  trackingCard.innerHTML = `
    <div class="card-body">
      <div class="d-flex align-items-start justify-content-between gap-3">
        <div>
          <div class="text-secondary">Alumni</div>
          <div class="fs-5 fw-semibold">${escapeHtml(data.nama)}</div>
        </div>
        <div class="text-end">
          <div class="text-secondary">Waktu</div>
          <div>${new Date(data.trackedAt).toLocaleString()}</div>
        </div>
      </div>
      <hr />
      <div class="row g-3">
        <div class="col-12 col-md-4">
          <div class="text-secondary">Pekerjaan</div>
          <div class="fw-semibold">${escapeHtml(data.pekerjaan)}</div>
        </div>
        <div class="col-12 col-md-4">
          <div class="text-secondary">Perusahaan</div>
          <div class="fw-semibold">${escapeHtml(data.perusahaan)}</div>
        </div>
        <div class="col-12 col-md-4">
          <div class="text-secondary">Sumber</div>
          <div class="fw-semibold">${escapeHtml(data.sumber)}</div>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function updateDashboard(items) {
  totalAlumniEl.textContent = items.length;

  const tracked = items
    .filter((a) => a.lastTracking && a.lastTracking.trackedAt)
    .sort((a, b) => new Date(b.lastTracking.trackedAt) - new Date(a.lastTracking.trackedAt));

  if (!tracked.length) {
    lastTrackingEl.textContent = '-';
    return;
  }

  const latest = tracked[0];
  lastTrackingEl.textContent = `${latest.nama} • ${new Date(latest.lastTracking.trackedAt).toLocaleString()}`;
}

function renderTable(items) {
  if (!items.length) {
    alumniTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-secondary">Belum ada data alumni</td></tr>`;
    return;
  }

  alumniTableBody.innerHTML = items.map((a) => `
    <tr>
      <td>
        <div class="fw-semibold">${escapeHtml(a.nama)}</div>
        <div class="text-secondary small">${a.nim ? escapeHtml(a.nim) : ''}</div>
      </td>
      <td>${escapeHtml(a.jurusan)}</td>
      <td>${a.tahunLulus ?? ''}</td>
      <td>${escapeHtml(a.email)}</td>
      <td>
        <button class="btn btn-sm btn-success btn-track" data-id="${a.id}">
          <span class="label">Lacak Alumni</span>
        </button>
      </td>
    </tr>
  `).join('');
}

function filteredItems() {
  const q = (searchInput.value || '').trim().toLowerCase();
  if (!q) return alumniCache;
  return alumniCache.filter((a) => {
    return (
      String(a.nama || '').toLowerCase().includes(q) ||
      String(a.jurusan || '').toLowerCase().includes(q) ||
      String(a.email || '').toLowerCase().includes(q)
    );
  });
}

async function fetchAlumni() {
  const res = await fetch('/alumni');
  if (res.status === 401) {
    window.location.href = '/login.html';
    return [];
  }
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Gagal memuat alumni');
  return json.data;
}

async function createAlumni(payload) {
  const res = await fetch('/alumni', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (res.status === 401) {
    window.location.href = '/login.html';
    return null;
  }
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Gagal menambah alumni');
  return json.data;
}

async function trackAlumni(id) {
  const res = await fetch(`/track/${encodeURIComponent(id)}`, { method: 'POST' });
  if (res.status === 401) {
    window.location.href = '/login.html';
    return null;
  }
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Gagal melacak alumni');
  return json.data;
}

async function refresh() {
  const items = await fetchAlumni();
  alumniCache = items;
  updateDashboard(items);
  renderTable(filteredItems());
}

alumniForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(alumniForm);
  const payload = Object.fromEntries(formData.entries());
  payload.tahunLulus = Number(payload.tahunLulus);

  try {
    await createAlumni(payload);
    alumniForm.reset();
    showAlert('success', 'Alumni berhasil ditambahkan');
    await refresh();
  } catch (err) {
    showAlert('danger', err.message || 'Terjadi kesalahan');
  }
});

btnRefresh.addEventListener('click', async () => {
  try {
    await refresh();
    showAlert('success', 'Data berhasil diperbarui');
  } catch (err) {
    showAlert('danger', err.message || 'Gagal refresh');
  }
});

btnLogout.addEventListener('click', async () => {
  try {
    await logout();
  } catch {
    window.location.href = '/login.html';
  }
});

searchInput.addEventListener('input', () => {
  renderTable(filteredItems());
});

alumniTableBody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button.btn-track');
  if (!btn) return;

  const id = btn.getAttribute('data-id');
  if (!id) return;

  const label = btn.querySelector('.label');
  btn.disabled = true;
  const oldLabel = label ? label.textContent : '';
  if (label) label.textContent = 'Melacak...';
  btn.classList.add('position-relative');

  setTrackingCardLoading(true);

  try {
    const result = await trackAlumni(id);
    renderTrackingResult(result);
    showAlert('success', 'Pelacakan berhasil');
    await refresh();
  } catch (err) {
    trackingCard.innerHTML = `
      <div class="card-body">
        <div class="text-danger fw-semibold">Pelacakan gagal</div>
        <div class="text-secondary">${escapeHtml(err.message || 'Terjadi kesalahan')}</div>
      </div>
    `;
    showAlert('danger', err.message || 'Pelacakan gagal');
  } finally {
    btn.disabled = false;
    if (label) label.textContent = oldLabel || 'Lacak Alumni';
  }
});

(async function init() {
  try {
    await refresh();
  } catch (err) {
    showAlert('danger', err.message || 'Gagal memuat data awal');
    alumniTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Gagal memuat data</td></tr>`;
  }
})();
