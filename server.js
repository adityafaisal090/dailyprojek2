const path = require('path');
const express = require('express');
const cors = require('cors');
const session = require('express-session');

const alumniRoutes = require('./routes/alumniRoutes');
const trackRoutes = require('./routes/trackRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const auth = require('./middleware/auth');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  name: 'sid',
  secret: process.env.SESSION_SECRET || 'dev-session-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Auth endpoints
app.post('/auth/login', auth.login);
app.post('/auth/logout', auth.logout);
app.get('/auth/me', auth.me);

// API routes
app.use('/alumni', auth.requireAuth, alumniRoutes);
app.use('/track', auth.requireAuth, trackRoutes);

app.get('/', (req, res) => {
  if (!req.session || !req.session.user) return res.redirect('/login.html');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/index.html', auth.requireAuthPage, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Frontend static (do not serve index.html automatically)
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
    console.error('Stop the other process using this port, or run with a different PORT.');
    console.error('PowerShell example: $env:PORT=3001; npm start');
    process.exit(1);
  }
  throw err;
});
