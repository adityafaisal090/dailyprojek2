function timingSafeEqual(a, b) {
  const sa = String(a ?? '');
  const sb = String(b ?? '');
  if (sa.length !== sb.length) return false;
  let out = 0;
  for (let i = 0; i < sa.length; i++) out |= sa.charCodeAt(i) ^ sb.charCodeAt(i);
  return out === 0;
}

function getConfiguredCredentials() {
  return {
    id: process.env.APP_LOGIN_ID || 'rekayasa kebutuhan',
    password: process.env.APP_LOGIN_PASSWORD || 'tugas4090'
  };
}

function isLoggedIn(req) {
  return Boolean(req.session && req.session.user && req.session.user.id);
}

function requireAuth(req, res, next) {
  if (isLoggedIn(req)) return next();
  return res.status(401).json({ success: false, message: 'Unauthorized' });
}

function requireAuthPage(req, res, next) {
  if (isLoggedIn(req)) return next();
  return res.redirect('/login.html');
}

function login(req, res) {
  const { id, password } = req.body || {};
  const expected = getConfiguredCredentials();

  const ok = timingSafeEqual(id, expected.id) && timingSafeEqual(password, expected.password);
  if (!ok) return res.status(401).json({ success: false, message: 'ID atau password salah' });

  req.session.user = { id: expected.id };
  return res.json({ success: true, message: 'Login berhasil' });
}

function logout(req, res) {
  if (!req.session) return res.json({ success: true, message: 'Logout' });
  req.session.destroy(() => res.json({ success: true, message: 'Logout berhasil' }));
}

function me(req, res) {
  if (!isLoggedIn(req)) return res.status(401).json({ success: false, message: 'Unauthorized' });
  return res.json({ success: true, data: { id: req.session.user.id } });
}

module.exports = {
  requireAuth,
  requireAuthPage,
  login,
  logout,
  me
};
