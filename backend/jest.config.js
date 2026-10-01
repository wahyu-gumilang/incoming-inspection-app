const shared = { testEnvironment: 'node', clearMocks: true };

// `unit` mocks the database and runs anywhere. `db` runs against csi_db_test,
// which its global setup rebuilds (baseline + migrations + fixtures) first.
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
    },
  ],
};
