import type { ErrorType, PromiseResult } from '@dossierhq/core';
import { notOk, ok } from '@dossierhq/core';
import type { TransactionContext } from '@dossierhq/database-adapter';
import type { Database, QueryOrQueryAndValues } from './QueryFunctions.js';
import { getCurrentSchemaVersion, migrate } from './SchemaMigrator.js';
import type { SqliteDatabaseMigrationOptions } from './SqliteDatabaseAdapter.js';

type SchemaVersionDefinition =
  | QueryOrQueryAndValues
  | ((options: SqliteDatabaseMigrationOptions) => QueryOrQueryAndValues);

const VERSION_1: SchemaVersionDefinition[] = [
  'PRAGMA foreign_keys=TRUE', // This is slightly misleading, foreign keys need to be enabled for each connection
  `CREATE TABLE subjects (
    id INTEGER PRIMARY KEY,
    uuid TEXT NOT NULL,
    created_at TEXT NOT NULL,
    CONSTRAINT subjects_uuid UNIQUE (uuid)
  ) STRICT`,
  `CREATE TABLE principals (
    id INTEGER PRIMARY KEY,
    provider TEXT NOT NULL,
    identifier TEXT NOT NULL,
    subjects_id INTEGER NOT NULL,
    CONSTRAINT principals_pkey UNIQUE (provider, identifier),
    FOREIGN KEY (subjects_id) REFERENCES subjects(id) ON DELETE CASCADE
  ) STRICT`,
  `CREATE TABLE schema_versions (
    id INTEGER PRIMARY KEY,
    specification TEXT NOT NULL
  ) STRICT`,
  `CREATE TABLE sequences (
    name TEXT NOT NULL UNIQUE,
    value INTEGER DEFAULT 0
  ) STRICT`,
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
  ) STRICT`,
  (options) => `CREATE VIRTUAL TABLE entities_latest_fts USING ${options.fts.version} (
    content${options.fts.tokenizer ? `, tokenize=${options.fts.tokenizer}` : ''}
  )`,
  (options) => `CREATE VIRTUAL TABLE entities_published_fts USING ${options.fts.version} (
    content${options.fts.tokenizer ? `, tokenize=${options.fts.tokenizer}` : ''}
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
  ) STRICT`,
  `CREATE TABLE entity_version_locations (
    id INTEGER PRIMARY KEY,
    entity_versions_id INTEGER NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    FOREIGN KEY (entity_versions_id) REFERENCES entity_versions(id) ON DELETE CASCADE
  ) STRICT`,
  `CREATE TABLE entity_version_references (
    id INTEGER PRIMARY KEY,
    entity_versions_id INTEGER NOT NULL,
    entities_id INTEGER NOT NULL,
    FOREIGN KEY (entities_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY (entity_versions_id) REFERENCES entity_versions(id) ON DELETE CASCADE
  ) STRICT`,
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
  ) STRICT`,
];

const VERSION_2: SchemaVersionDefinition[] = [
  `CREATE TABLE advisory_locks (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    handle INTEGER NOT NULL,
    acquired_at TEXT NOT NULL,
    renewed_at TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    lease_duration INTEGER NOT NULL,
    CONSTRAINT advisory_locks_name UNIQUE (name)
  ) STRICT`,
];

const VERSION_3: SchemaVersionDefinition[] = [
  `CREATE TABLE entity_published_references (
    id INTEGER PRIMARY KEY,
    from_entities_id INTEGER NOT NULL,
    to_entities_id INTEGER NOT NULL,
    FOREIGN KEY (from_entities_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY (to_entities_id) REFERENCES entities(id) ON DELETE CASCADE
  ) STRICT`,
  `INSERT INTO entity_published_references(from_entities_id, to_entities_id)
    SELECT e.id AS from_entities_id, evr.entities_id AS to_entities_id
      FROM entities e, entity_version_references evr
      WHERE e.published_entity_versions_id = evr.entity_versions_id`,
];

const VERSION_4: SchemaVersionDefinition[] = [
  `CREATE TABLE entity_latest_references (
    id INTEGER PRIMARY KEY,
    from_entities_id INTEGER NOT NULL,
    to_entities_id INTEGER NOT NULL,
    FOREIGN KEY (from_entities_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY (to_entities_id) REFERENCES entities(id) ON DELETE CASCADE
  ) STRICT`,
  `INSERT INTO entity_latest_references(from_entities_id, to_entities_id)
    SELECT e.id AS from_entities_id, evr.entities_id AS to_entities_id
      FROM entities e, entity_version_references evr
      WHERE e.latest_entity_versions_id = evr.entity_versions_id`,
  `DROP TABLE entity_version_references`,
];

const VERSION_5: SchemaVersionDefinition[] = [
  `CREATE TABLE entity_published_locations (
    id INTEGER PRIMARY KEY,
    entities_id INTEGER NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    FOREIGN KEY (entities_id) REFERENCES entities(id) ON DELETE CASCADE
  ) STRICT`,
  `CREATE TABLE entity_latest_locations (
    id INTEGER PRIMARY KEY,
    entities_id INTEGER NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    FOREIGN KEY (entities_id) REFERENCES entities(id) ON DELETE CASCADE
  ) STRICT`,
  `INSERT INTO entity_published_locations(entities_id, lat, lng)
    SELECT e.id AS entities_id, evl.lat, evl.lng
      FROM entities e, entity_version_locations evl
      WHERE e.published_entity_versions_id = evl.entity_versions_id`,
  `INSERT INTO entity_latest_locations(entities_id, lat, lng)
    SELECT e.id AS entities_id, evl.lat, evl.lng
      FROM entities e, entity_version_locations evl
      WHERE e.latest_entity_versions_id = evl.entity_versions_id`,
  `DROP TABLE entity_version_locations`,
];

const VERSION_6: SchemaVersionDefinition[] = [
  `CREATE TABLE unique_index_values (
    id INTEGER PRIMARY KEY,
    entities_id INTEGER NOT NULL,
    index_name TEXT NOT NULL,
    value TEXT NOT NULL,
    latest INTEGER NOT NULL DEFAULT FALSE,
    published INTEGER NOT NULL DEFAULT FALSE,
    FOREIGN KEY (entities_id) REFERENCES entities(id) ON DELETE CASCADE,
    CONSTRAINT unique_index_values_index_value UNIQUE (index_name, value)
  ) STRICT`,
  `CREATE INDEX unique_index_values_entities_id ON unique_index_values(entities_id)`,
];

const VERSION_7: SchemaVersionDefinition[] = [
  'CREATE INDEX entity_versions_entities_id ON entity_versions(entities_id)',
  'CREATE INDEX entity_published_references_from_entities_id ON entity_published_references(from_entities_id)',
  'CREATE INDEX entity_published_locations_entities_id ON entity_published_locations(entities_id)',
  'CREATE INDEX entity_latest_references_from_entities_id ON entity_latest_references(from_entities_id)',
  'CREATE INDEX entity_latest_locations_entities_id ON entity_latest_locations(entities_id)',
];

const VERSION_8: SchemaVersionDefinition[] = [
  'CREATE INDEX entities_resolved_auth_key ON entities(resolved_auth_key)',
  'CREATE INDEX entity_publishing_events_entities_id ON entity_publishing_events(entities_id)',
  'CREATE INDEX entities_resolved_auth_key_name ON entities(resolved_auth_key, name)',
  'CREATE INDEX entities_resolved_auth_key_updated_seq ON entities(resolved_auth_key, updated_seq)',
];

const VERSION_9: SchemaVersionDefinition[] = [
  'CREATE INDEX entities_resolved_auth_uuid ON entities(resolved_auth_key, uuid)',
];

const VERSION_10: SchemaVersionDefinition[] = [
  'ALTER TABLE entities ADD COLUMN valid INTEGER NOT NULL DEFAULT TRUE',
  'ALTER TABLE entities ADD COLUMN revalidate INTEGER NOT NULL DEFAULT FALSE',
  'UPDATE entities SET revalidate = TRUE',
];

const VERSION_11: SchemaVersionDefinition[] = [
  'CREATE INDEX entities_revalidate ON entities(revalidate)',
];

const VERSION_12: SchemaVersionDefinition[] = [
  'ALTER TABLE entities ADD COLUMN dirty INTEGER NOT NULL DEFAULT 0',
  'CREATE INDEX entities_dirty ON entities(dirty)',
  'UPDATE entities SET dirty = 1 WHERE revalidate',
  `CREATE TABLE entity_latest_value_types (
    id INTEGER PRIMARY KEY,
    entities_id INTEGER NOT NULL,
    value_type TEXT NOT NULL,
    FOREIGN KEY (entities_id) REFERENCES entities(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE entity_published_value_types (
    id INTEGER PRIMARY KEY,
    entities_id INTEGER NOT NULL,
    value_type TEXT NOT NULL,
    FOREIGN KEY (entities_id) REFERENCES entities(id) ON DELETE CASCADE
  )`,
];

const VERSION_13: SchemaVersionDefinition[] = [
  'DROP INDEX entities_revalidate',
  'ALTER TABLE entities DROP COLUMN revalidate',
  'ALTER TABLE entities ADD COLUMN invalid INTEGER NOT NULL DEFAULT 0',
  'UPDATE entities SET invalid = 1 WHERE NOT valid',
  'ALTER TABLE entities DROP COLUMN valid',
  'UPDATE entities SET dirty = 1 | 2 | 4 | 8',
];

const VERSION_14: SchemaVersionDefinition[] = [
  'ALTER TABLE schema_versions RENAME TO old_schema_versions',
  `CREATE TABLE schema_versions (
    id INTEGER PRIMARY KEY,
    version INTEGER NOT NULL UNIQUE,
    updated_at TEXT NOT NULL,
    specification TEXT NOT NULL
  ) STRICT`,
  () => ({
    text: `INSERT INTO schema_versions(version, updated_at, specification)
            SELECT id AS version, ?1 AS updated_at, specification FROM old_schema_versions`,
    values: [new Date().toISOString()],
  }),
  'DROP TABLE old_schema_versions',
];

const VERSION_15: SchemaVersionDefinition[] = [
  `ALTER TABLE entity_versions ADD COLUMN schema_version INTEGER NOT NULL DEFAULT 0`,
  'UPDATE entity_versions SET schema_version = (SELECT version FROM schema_versions ORDER BY version DESC LIMIT 1) WHERE schema_version = 0',
];

// FTS don't support foreign keys so use triggers to clean up if we for some reason delete an entity in the database
const VERSION_16: SchemaVersionDefinition[] = [
  `CREATE TRIGGER delete_entity_fts DELETE ON entities BEGIN
    DELETE FROM entities_latest_fts WHERE rowid = OLD.id;
    DELETE FROM entities_published_fts WHERE rowid = OLD.id;
   END`,
];

const VERSION_17: SchemaVersionDefinition[] = [
  'ALTER TABLE entity_versions ADD COLUMN encode_version INTEGER NOT NULL DEFAULT 0',
];

const VERSIONS: SchemaVersionDefinition[][] = [
  [], // nothing for version 0
  VERSION_1,
  VERSION_2,
  VERSION_3,
  VERSION_4,
  VERSION_5,
  VERSION_6,
  VERSION_7,
  VERSION_8,
  VERSION_9,
  VERSION_10,
  VERSION_11,
  VERSION_12,
  VERSION_13,
  VERSION_14,
  VERSION_15,
  VERSION_16,
  VERSION_17,
];

export const REQUIRED_SCHEMA_VERSION = VERSIONS.length - 1;

export async function migrateDatabaseIfNecessary(
  database: Database,
  context: TransactionContext,
  options: SqliteDatabaseMigrationOptions,
): PromiseResult<void, typeof ErrorType.Generic> {
  return await migrate(database, context, (version) => {
    const versionDefinition = VERSIONS[version];
    if (!versionDefinition) {
      return null;
    }
    const statements: QueryOrQueryAndValues[] = [];
    for (const statement of versionDefinition) {
      if (typeof statement === 'function') {
        statements.push(statement(options));
      } else {
        statements.push(statement);
      }
    }
    return statements;
  });
}

export async function checkMigrationStatus(
  database: Database,
  context: TransactionContext,
): PromiseResult<void, typeof ErrorType.Generic> {
  const versionResult = await getCurrentSchemaVersion(database, context);
  if (versionResult.isError()) return versionResult;
  const currentVersion = versionResult.value;

  if (currentVersion !== REQUIRED_SCHEMA_VERSION) {
    return notOk.Generic(
      `Database schema needs to be migrated, is at version ${currentVersion} (should be ${REQUIRED_SCHEMA_VERSION})`,
    );
  }
  return ok(undefined);
}
