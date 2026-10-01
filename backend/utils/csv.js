// Minimal CSV reader for small admin imports. Handles quoted fields ("PT A, B"),
// doubled quotes and CRLF. The delimiter is ',' or ';' (Excel with an Indonesian
// locale saves with ';'), picked from the first line.
function parseCsv(text) {
  const source = String(text ?? '').replace(/^\uFEFF/, ''); // drop Excel's byte-order mark
  const firstLine = source.split(/\r?\n/, 1)[0];
  const delimiter =
    (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';

  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"' && source[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && source[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.map((r) => r.map((f) => f.trim())).filter((r) => r.some((f) => f !== ''));
}

module.exports = { parseCsv };
