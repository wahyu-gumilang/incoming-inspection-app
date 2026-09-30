const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  let db = 'connected';
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    db = `disconnected: ${err.code || err.message}`;
  }

  res.json({
    status: 'ok',
    service: 'incoming-inspection-api',
    db,
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;
