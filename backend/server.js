require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

// Express 5 passes listen errors (e.g. EADDRINUSE) to this callback instead of
// throwing, so without the check a failed start would still log "running".
app.listen(PORT, (err) => {
  if (err) {
    console.error(`Could not start server on port ${PORT}: ${err.code || err.message}`);
    process.exit(1);
  }
  console.log(`Server running on http://localhost:${PORT}`);
});
