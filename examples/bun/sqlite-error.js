import { Database } from 'bun:sqlite';

const db = new Database(':memory:', { strict: true });
db.run('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT UNIQUE)');
db.run('INSERT INTO users (name) VALUES ("john")');
try {
  db.run('INSERT INTO users (name) VALUES ("john")');
  throw new Error('Expected error');
} catch (error) {
  console.log(error.message);
}
db.close();
