import { Database } from 'bun:sqlite';

const db = new Database(':memory:', { strict: true });
console.log(db.prepare('SELECT sqlite_version()').all());
db.close();
