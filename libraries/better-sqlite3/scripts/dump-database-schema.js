#!/usr/bin/env node
import { writeFileSync } from 'fs';
import Database from 'better-sqlite3';

const DATABASE_PATH = 'databases/integration-test-admin-entity.sqlite';
const SCHEMA_PATH = 'docs/schema.sql';

const db = new Database(DATABASE_PATH, { readonly: true });
const rows = db.prepare('SELECT * FROM sqlite_master WHERE sql IS NOT NULL').all();
db.close();

rows.sort((a, b) => {
  if (a.tbl_name !== b.tbl_name) {
    return a.tbl_name.localeCompare(b.tbl_name);
  }
  if (a.type === 'table') {
    return -1;
  }
  if (b.type === 'table') {
    return 1;
  }
  return a.name.localeCompare(b.name);
});

const statements = [];
for (const row of rows) {
  if (row.type === 'table') {
    statements.push(`-- Table: ${row.name}`);
  }
  let sql = row.sql;
  // normalize whitespace at beginning of lines
  sql = sql.replace(/^\s+/gm, '  ').replace(/ +\)/gm, ')');

  statements.push(sql + ';');
}

writeFileSync(SCHEMA_PATH, statements.join('\n\n') + '\n');
