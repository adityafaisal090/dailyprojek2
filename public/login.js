const alertArea = document.getElementById('alertArea');
const loginForm = document.getElementById('loginForm');

function showAlert(type, message) {
  const wrapper = document.createElement('div');
  wrapper.className = `alert alert-${type} alert-dismissible fade show`;
  wrapper.role = 'alert';
  wrapper.innerHTML = `
    <div>${message}</div>
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  alertArea.innerHTML = '';
  alertArea.appendChild(wrapper);
}

async function whoAmI() {
  const res = await fetch('/auth/me');
  return res.ok;
}

(async function init() {
  try {
    const ok = await whoAmI();
    if (ok) window.location.href = '/';
  } catch {}
})();

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(loginForm);
  const payload = Object.fromEntries(formData.entries());

  try {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || 'Login gagal');

    window.location.href = '/';
  } catch (err) {
    showAlert('danger', err.message || 'Terjadi kesalahan');
  }
});
