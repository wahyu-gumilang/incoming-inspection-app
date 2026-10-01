const { resetTestDb } = require('../../scripts/reset-test-db');

module.exports = async () => {
  await resetTestDb({ log: () => {} });
};
