const healthRepository = require('../repositories/health.repository');

// A DB outage is reported inside the payload instead of failing the request,
// so the check still shows the API itself is up.
async function getHealth() {
  let db = 'connected';
  try {
    await healthRepository.ping();
  } catch (err) {
    db = `disconnected: ${err.code || 'UNKNOWN'}`;
  }

  return {
    status: 'ok',
    service: 'incoming-inspection-api',
    db,
    timestamp: new Date().toISOString(),
  };
}

module.exports = { getHealth };
