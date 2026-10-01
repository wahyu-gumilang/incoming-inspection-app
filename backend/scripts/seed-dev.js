// npm run db:seed:dev — dummy suppliers for the development database (vendtable
// is empty in the imported csi_db). Safe to run again: existing accounts are kept.
// Names are invented; they match the mockups.
const VENDORS = [
  ['V-0001', 'PT Sinar Logam Abadi'],
  ['V-0002', 'CV Maju Teknik Mandiri'],
  ['V-0003', 'PT Baja Prima Nusantara'],
  ['V-0004', 'PT Cahaya Plastindo'],
  ['V-0005', 'PT Mitra Kemas Jaya'],
  ['V-0006', 'PT Kurnia Berdikari'],
  ['V-0007', 'CV Sumber Baut Sejahtera'],
  ['V-0008', 'PT Indo Presisi Komponen'],
  ['V-0009', 'PT Duta Cat Lestari'],
  ['V-0010', 'CV Karya Pegas Utama'],
  ['V-0011', 'PT Galunggung Pasir Silika'],
  ['V-0012', 'PT Anugerah Kunci Mandiri'],
  ['V-0013', 'PT Global Fibre Indonesia'],
  ['V-0014', 'CV Berkah Las Teknik'],
  ['V-0015', 'PT Samudra Plat Baja'],
];

async function main() {
  const db = require('../config/db');
  try {
    const [[{ name }]] = await db.query('SELECT DATABASE() AS name');
    const [result] = await db.query('INSERT IGNORE INTO vendtable (vendaccount, name) VALUES ?', [
      VENDORS,
    ]);
    console.log(
      `${name}: ${result.affectedRows} vendor(s) added, ${VENDORS.length - result.affectedRows} already there.`,
    );
  } finally {
    await db.close();
  }
}

main().catch((err) => {
  console.error(`Seeding failed: ${err.code || ''} ${err.message}`);
  process.exit(1);
});
