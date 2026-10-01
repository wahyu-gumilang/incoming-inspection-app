const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const checkOrigin = require('./middlewares/origin.middleware');
const notFound = require('./middlewares/not-found.middleware');
const errorHandler = require('./middlewares/error-handler.middleware');
const { allowedOrigins } = require('./config/auth');

const app = express();

// The Angular dev server proxies /api, so browsers normally call us same-origin;
// CORS only opens the door for the configured origins, with cookies.
app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || allowedOrigins().includes(origin)),
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(checkOrigin);

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
