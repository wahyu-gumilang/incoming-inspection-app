const db = require('../../config/db');
const { runMigrations, migrationFiles } = require('../../scripts/migrate');

async function columns(table) {
  const [rows] = await db.query(
    'SELECT column_name AS name, is_nullable AS nullable, column_default AS def FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?',
    [table],
  );
  return Object.fromEntries(rows.map((r) => [r.name, r]));
}

async function indexColumns(table, index) {
  const [rows] = await db.query(
    'SELECT column_name AS name FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ? ORDER BY seq_in_index',
    [table, index],
  );
  return rows.map((r) => r.name);
}

afterAll(() => db.close());

describe('csi_db_test after migrations', () => {
  it('is the test database', async () => {
    const [[{ name }]] = await db.query('SELECT DATABASE() AS name');
    expect(name).toMatch(/_test$/);
  });

  it('recorded every migration file', async () => {
    const [rows] = await db.query('SELECT name FROM schema_migrations ORDER BY name');
    expect(rows.map((r) => r.name)).toEqual(migrationFiles());
  });

  it('does nothing when migrations run again', async () => {
    const conn = await db.createConnection({ multipleStatements: true });
    try {
      expect(await runMigrations(conn, { log: () => {} })).toEqual([]);
    } finally {
      await conn.end();
    }
  });

  it.each([
    ['inventtable', ['itemid']],
    ['vendtable', ['vendaccount']],
    ['inspectsetup', ['id']],
    ['inspectlineother', ['inspectnum', 'linenum']],
  ])('%s has primary key %j', async (table, key) => {
    expect(await indexColumns(table, 'PRIMARY')).toEqual(key);
  });

  it('rejects a duplicate vendor account', async () => {
    await expect(
      db.query("INSERT INTO vendtable (vendaccount, name) VALUES ('V-0001', 'Duplicate')"),
    ).rejects.toMatchObject({ code: 'ER_DUP_ENTRY' });
  });

  it('generates inspectsetup ids', async () => {
    const [rows] = await db.query('SELECT id, checkedby FROM inspectsetup ORDER BY id');
    expect(rows).toEqual([
      { id: 1, checkedby: 'Budi Santoso' },
      { id: 2, checkedby: 'Siti Rahayu' },
    ]);
  });

  it('stores unmeasured inspectline results as NULL', async () => {
    const cols = await columns('inspectline');
    for (const n of [1, 7]) {
      expect(cols[`actual_${n}`]).toMatchObject({ nullable: 'YES', def: 'NULL' });
      expect(cols[`status_${n}`]).toMatchObject({ nullable: 'YES', def: 'NULL' });
    }

    await db.query(
      "INSERT INTO inspectline (inspectnum, linenum, inspectitem) VALUES ('INS-TEST', 1, 'A')",
    );
    const [[line]] = await db.query(
      "SELECT actual_1, status_1 FROM inspectline WHERE inspectnum = 'INS-TEST'",
    );
    expect(line).toEqual({ actual_1: null, status_1: null });
    await db.query("DELETE FROM inspectline WHERE inspectnum = 'INS-TEST'");
  });

  it('adds the standard snapshot columns to inspectline', async () => {
    const cols = await columns('inspectline');
    for (const name of [
      'inspecttype',
      'standard_txt',
      'tolerance',
      'tolerance_txt',
      'tolerance_plus',
      'tolerance_minus',
    ]) {
      expect(cols).toHaveProperty(name);
    }
  });

  it('adds result columns to inspectlineother', async () => {
    const cols = await columns('inspectlineother');
    for (let n = 1; n <= 7; n += 1) {
      expect(cols).toHaveProperty(`actual_txt_${n}`);
      expect(cols).toHaveProperty(`status_${n}`);
    }
    expect(cols).toHaveProperty('standard_txt');
  });

  it('adds instrument and the list indexes to inspecttable', async () => {
    expect(await columns('inspecttable')).toHaveProperty('instrument');
    expect(await indexColumns('inspecttable', 'idx_inspecttable_inspectdate')).toEqual([
      'inspectdate',
    ]);
    expect(await indexColumns('inspecttable', 'idx_inspecttable_itemid')).toEqual(['itemid']);
    expect(await indexColumns('inspecttable', 'idx_inspecttable_accountnum')).toEqual([
      'accountnum',
    ]);
  });

  it('starts the inspection number sequence', async () => {
    const [rows] = await db.query('SELECT prefix, digits, nextnum FROM inspectnumseq');
    expect(rows).toEqual([{ prefix: 'INS-', digits: 6, nextnum: 1 }]);
  });

  it('creates usertable with a unique username and role/theme checks', async () => {
    expect(await indexColumns('usertable', 'PRIMARY')).toEqual(['userid']);
    expect(await indexColumns('usertable', 'uq_usertable_username')).toEqual(['username']);
    // MariaDB reports a CHECK violation as errno 4025; mysql2 maps that number to a MySQL name.
    await expect(
      db.query(
        "INSERT INTO usertable (username, fullname, role, password_hash) VALUES ('x.role', 'X', 'BOSS', 'h')",
      ),
    ).rejects.toMatchObject({
      errno: 4025,
      message: expect.stringContaining('chk_usertable_role'),
    });
  });

  it('creates the AQL tables with the two seeded plans', async () => {
    const [plans] = await db.query(
      'SELECT planid, inspectlevel, isdefault FROM aqlplan ORDER BY planid',
    );
    expect(plans).toEqual([
      { planid: 1, inspectlevel: 'S-1', isdefault: 1 },
      { planid: 2, inspectlevel: 'II', isdefault: 0 },
    ]);
    // aql.test edits plan 2's Tightened rows in parallel, so only untouched rows are counted.
    const [counts] = await db.query(
      'SELECT planid, COUNT(*) AS n FROM aqlplanrow WHERE planid = 1 OR inspectcategory = 1 GROUP BY planid ORDER BY planid',
    );
    expect(counts).toEqual([
      { planid: 1, n: 12 },
      { planid: 2, n: 9 },
    ]);
  });

  it('adds the AQL snapshot columns to inspecttable', async () => {
    const cols = await columns('inspecttable');
    for (const name of [
      'aqlplanid',
      'samplesize1',
      'acceptnum7',
      'rejectnum4',
      'concessionnote7',
    ]) {
      expect(cols).toHaveProperty(name);
    }
  });

  it('keeps the trailing space in stored inspecttype values', async () => {
    const [[row]] = await db.query(
      "SELECT inspecttype FROM inventinspectitem WHERE itemid = '000-228' AND inspectitem = 'C'",
    );
    expect(row.inspecttype).toBe('FITTING ');
  });
});
