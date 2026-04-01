const path = require('path');
const express = require('express');
const cors = require('cors');

const alumniRoutes = require('./routes/alumniRoutes');
const trackRoutes = require('./routes/trackRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/alumni', alumniRoutes);
app.use('/track', trackRoutes);

// Frontend static
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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
