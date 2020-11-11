#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires, no-undef */
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.test') });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function shutDown() {
  return pool.end();
}

async function canConnect() {
  try {
    const { rows } = await pool.query(`SELECT TRUE AS online`);
    if (rows.length !== 1 || rows[0].online !== true) {
      throw new Error(`Got an unexpected value (${rows})`);
    }
    return true;
  } catch (error) {
    return false;
  }
}

function delay(t) {
  return new Promise((resolve) => setTimeout(resolve, t));
}

async function main() {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (await canConnect()) {
      return;
    }
    await delay(200);
  }
}

if (require.main === module) {
  main()
    .then(shutDown)
    .catch((error) => {
      console.warn(error);
      process.exitCode = 1;
    });
}
