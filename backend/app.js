const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const notFound = require('./middlewares/not-found.middleware');
const errorHandler = require('./middlewares/error-handler.middleware');

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

app.use(notFound);
app.use(errorHandler);

module.exports = app;
