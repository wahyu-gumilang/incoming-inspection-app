const shared = { testEnvironment: 'node', clearMocks: true };

// `unit` mocks the database and runs anywhere. `db` runs against csi_db_test,
// which its global setup rebuilds (baseline + migrations + fixtures) first.
// The db files share that one database (default AQL plan, numbering, vendors in
// use), so npm test runs files one at a time (--runInBand) instead of in parallel.
module.exports = {
  projects: [
    {
      ...shared,
      displayName: 'unit',
      roots: ['<rootDir>/tests'],
      testPathIgnorePatterns: ['<rootDir>/tests/db/'],
    },
    {
      ...shared,
      displayName: 'db',
      roots: ['<rootDir>/tests/db'],
      globalSetup: '<rootDir>/tests/db/global-setup.js',
      // Real HTTP + MariaDB round trips; 5 s is too tight on a busy machine.
      testTimeout: 20_000,
    },
  ],
};
