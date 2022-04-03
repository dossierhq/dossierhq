import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import type { TransactionContext } from '@jonasb/datadata-database-adapter';
import type { Database, QueryOrQueryAndValues } from './QueryFunctions';
import { migrate } from './SchemaMigrator';

//TODO enable strict tables when sqlite 3.37+ https://www.sqlite.org/stricttables.html
//TODO optimize fts indices
//TODO fts language

const VERSION_1: QueryOrQueryAndValues[] = [
  'PRAGMA foreign_keys=TRUE',
  `CREATE TABLE subjects (
    id INTEGER PRIMARY KEY,
    uuid TEXT NOT NULL,
    created_at TEXT NOT NULL,
    CONSTRAINT subjects_uuid UNIQUE (uuid)
  )`,
  `CREATE TABLE principals (
    id INTEGER PRIMARY KEY,
    provider TEXT NOT NULL,
    identifier TEXT NOT NULL,
    subjects_id INTEGER NOT NULL,
    CONSTRAINT principals_pkey UNIQUE (provider, identifier),
    FOREIGN KEY (subjects_id) REFERENCES subjects(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE schema_versions (
    id INTEGER PRIMARY KEY,
    specification TEXT NOT NULL
  )`,
  `CREATE TABLE sequences (
    name TEXT NOT NULL UNIQUE,
    value INTEGER DEFAULT 0
  )`,
  `INSERT INTO sequences (name) VALUES ('entities_updated')`,
  `CREATE TABLE entities (
    id INTEGER PRIMARY KEY,
    uuid TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    resolved_auth_key TEXT NOT NULL,
    status TEXT NOT NULL,
    never_published INTEGER NOT NULL DEFAULT TRUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    updated_seq INTEGER NOT NULL,
    latest_entity_versions_id INTEGER,
    published_entity_versions_id INTEGER,
    CONSTRAINT entities_uuid UNIQUE (uuid),
    CONSTRAINT entities_name UNIQUE (name),
    CONSTRAINT entities_updated_seq UNIQUE (updated_seq),
    FOREIGN KEY (latest_entity_versions_id) REFERENCES entity_versions(id),
    FOREIGN KEY (published_entity_versions_id) REFERENCES entity_versions(id)
  )`,
  // TODO node-sqlite3 supports fts5
  `CREATE VIRTUAL TABLE entities_latest_fts USING fts4 (
    content
  )`,
  `CREATE VIRTUAL TABLE entities_published_fts USING fts4 (
    content
  )`,
  `CREATE TABLE entity_versions (
    id INTEGER PRIMARY KEY,
    entities_id INTEGER NOT NULL,
    version INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    created_by INTEGER NOT NULL,
    fields TEXT NOT NULL,
    FOREIGN KEY (entities_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES subjects(id)
  )`,
  `CREATE TABLE entity_version_locations (
    id INTEGER PRIMARY KEY,
    entity_versions_id INTEGER NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    FOREIGN KEY (entity_versions_id) REFERENCES entity_versions(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE entity_version_references (
    id INTEGER PRIMARY KEY,
    entity_versions_id INTEGER NOT NULL,
    entities_id INTEGER NOT NULL,
    FOREIGN KEY (entities_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY (entity_versions_id) REFERENCES entity_versions(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE entity_publishing_events (
    id INTEGER PRIMARY KEY,
    entities_id INTEGER NOT NULL,
    entity_versions_id INTEGER,
    published_by INTEGER NOT NULL,
    published_at TEXT NOT NULL,
    kind TEXT NOT NULL,
    FOREIGN KEY (entities_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY (entity_versions_id) REFERENCES entity_versions(id) ON DELETE CASCADE,
    FOREIGN KEY (published_by) REFERENCES subjects(id)
  )`,
];

const VERSION_2: QueryOrQueryAndValues[] = [
  `CREATE TABLE advisory_locks (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    handle INTEGER NOT NULL,
    acquired_at TEXT NOT NULL,
    renewed_at TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    lease_duration INTEGER NOT NULL,
    CONSTRAINT advisory_locks_name UNIQUE (name)
  )`,
];

const VERSIONS: QueryOrQueryAndValues[][] = [
  [], // nothing for version 0
  VERSION_1,
  VERSION_2,
];

export async function migrateDatabaseIfNecessary(
  database: Database,
  context: TransactionContext
): PromiseResult<void, ErrorType.Generic> {
  return await migrate(database, context, (version) => {
    return VERSIONS[version] ?? null;
  });
}
