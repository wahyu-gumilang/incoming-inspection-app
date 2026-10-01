const fs = require('fs');
const path = require('path');
const { migrationFiles } = require('../../scripts/migrate');

describe('migration files', () => {
  const dir = path.join(__dirname, '..', '..', 'db', 'migrations');

  it('are all picked up by the runner (NNN_snake_case.sql)', () => {
    expect(migrationFiles()).toEqual(fs.readdirSync(dir).sort());
  });

  it('are numbered 001, 002, … without gaps or duplicates', () => {
    const numbers = migrationFiles().map((f) => Number(f.slice(0, 3)));
    expect(numbers).toEqual(numbers.map((_, i) => i + 1));
  });
});
