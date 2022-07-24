import { Database } from "bun:sqlite";

const db = Database.open(":memory:");
console.log(db.prepare("SELECT sqlite_version()").all());
