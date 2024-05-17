import { notOk, ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import { buildSqliteSqlQuery, type TransactionContext } from '@dossierhq/database-adapter';
import {
  queryMany,
  queryRun,
  type Database,
  type QueryOrQueryAndValues,
} from './QueryFunctions.js';
import {
  getCurrentSchemaVersion,
  migrate,
  type InteractiveMigrationQuery,
  type SchemaVersionMigrationPlan,
} from './SchemaMigrator.js';
import type { SqliteDatabaseMigrationOptions } from './SqliteDatabaseAdapter.js';

interface SchemaVersionDefinition {
  temporarilyDisableForeignKeys?: boolean;
  queries: (
    | QueryOrQueryAndValues
    | ((
        options: SqliteDatabaseMigrationOptions,
      ) => QueryOrQueryAndValues | InteractiveMigrationQuery)
  )[];
}

const VERSION_1: SchemaVersionDefinition = {
  queries: [
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
  ],
};

const VERSION_2: SchemaVersionDefinition = {
  queries: [
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
  ],
};

const VERSION_3: SchemaVersionDefinition = {
  queries: [
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
  ],
};

const VERSION_4: SchemaVersionDefinition = {
  queries: [
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
  ],
};

const VERSION_5: SchemaVersionDefinition = {
  queries: [
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
  ],
};

const VERSION_6: SchemaVersionDefinition = {
  queries: [
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
  ],
};

const VERSION_7: SchemaVersionDefinition = {
  queries: [
    'CREATE INDEX entity_versions_entities_id ON entity_versions(entities_id)',
    'CREATE INDEX entity_published_references_from_entities_id ON entity_published_references(from_entities_id)',
    'CREATE INDEX entity_published_locations_entities_id ON entity_published_locations(entities_id)',
    'CREATE INDEX entity_latest_references_from_entities_id ON entity_latest_references(from_entities_id)',
    'CREATE INDEX entity_latest_locations_entities_id ON entity_latest_locations(entities_id)',
  ],
};

const VERSION_8: SchemaVersionDefinition = {
  queries: [
    'CREATE INDEX entities_resolved_auth_key ON entities(resolved_auth_key)',
    'CREATE INDEX entity_publishing_events_entities_id ON entity_publishing_events(entities_id)',
    'CREATE INDEX entities_resolved_auth_key_name ON entities(resolved_auth_key, name)',
    'CREATE INDEX entities_resolved_auth_key_updated_seq ON entities(resolved_auth_key, updated_seq)',
  ],
};

const VERSION_9: SchemaVersionDefinition = {
  queries: ['CREATE INDEX entities_resolved_auth_uuid ON entities(resolved_auth_key, uuid)'],
};

const VERSION_10: SchemaVersionDefinition = {
  queries: [
    'ALTER TABLE entities ADD COLUMN valid INTEGER NOT NULL DEFAULT TRUE',
    'ALTER TABLE entities ADD COLUMN revalidate INTEGER NOT NULL DEFAULT FALSE',
    'UPDATE entities SET revalidate = TRUE',
  ],
};

const VERSION_11: SchemaVersionDefinition = {
  queries: ['CREATE INDEX entities_revalidate ON entities(revalidate)'],
};

const VERSION_12: SchemaVersionDefinition = {
  queries: [
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
  ],
};

const VERSION_13: SchemaVersionDefinition = {
  queries: [
    'DROP INDEX entities_revalidate',
    'ALTER TABLE entities DROP COLUMN revalidate',
    'ALTER TABLE entities ADD COLUMN invalid INTEGER NOT NULL DEFAULT 0',
    'UPDATE entities SET invalid = 1 WHERE NOT valid',
    'ALTER TABLE entities DROP COLUMN valid',
    'UPDATE entities SET dirty = 1 | 2 | 4 | 8',
  ],
};

const VERSION_14: SchemaVersionDefinition = {
  queries: [
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
  ],
};

const VERSION_15: SchemaVersionDefinition = {
  queries: [
    `ALTER TABLE entity_versions ADD COLUMN schema_version INTEGER NOT NULL DEFAULT 0`,
    'UPDATE entity_versions SET schema_version = (SELECT version FROM schema_versions ORDER BY version DESC LIMIT 1) WHERE schema_version = 0',
  ],
};

// FTS don't support foreign keys so use triggers to clean up if we for some reason delete an entity in the database
const VERSION_16: SchemaVersionDefinition = {
  queries: [
    `CREATE TRIGGER delete_entity_fts DELETE ON entities BEGIN
    DELETE FROM entities_latest_fts WHERE rowid = OLD.id;
    DELETE FROM entities_published_fts WHERE rowid = OLD.id;
END`,
  ],
};

const VERSION_17: SchemaVersionDefinition = {
  queries: ['ALTER TABLE entity_versions ADD COLUMN encode_version INTEGER NOT NULL DEFAULT 0'],
};

const VERSION_18: SchemaVersionDefinition = {
  queries: [
    `CREATE TABLE events (
    id INTEGER PRIMARY KEY,
    type TEXT NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    schema_versions_id INTEGER,
    FOREIGN KEY (created_by) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (schema_versions_id) REFERENCES schema_versions(id) ON DELETE CASCADE
) STRICT`,
    `CREATE TABLE event_entity_versions (
    id INTEGER PRIMARY KEY,
    events_id INTEGER NOT NULL,
    entity_versions_id INTEGER NOT NULL,
    entity_type TEXT NOT NULL,
    FOREIGN KEY (events_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (entity_versions_id) REFERENCES entity_versions(id) ON DELETE CASCADE
) STRICT`,
    'CREATE INDEX event_entity_versions_events_id ON event_entity_versions(events_id)',
    'CREATE INDEX event_entity_versions_entity_versions_id ON event_entity_versions(entity_versions_id);',
  ],
};

const VERSION_19: SchemaVersionDefinition = {
  queries: ['UPDATE entity_versions SET version = version + 1'],
};

const VERSION_20: SchemaVersionDefinition = {
  queries: [
    'ALTER TABLE entity_versions ADD COLUMN type TEXT',
    'ALTER TABLE entity_versions ADD COLUMN name TEXT',
    `UPDATE entity_versions SET
      type = (SELECT type FROM entities WHERE entities.id = entity_versions.entities_id),
      name = (SELECT name FROM entities WHERE entities.id = entity_versions.entities_id)`,
    `ALTER TABLE event_entity_versions DROP COLUMN entity_type`,
  ],
};

// Change NOT NULL/defaults of schema_version/encode_version/type/name columns, following https://www.sqlite.org/lang_altertable.html#making_other_kinds_of_table_schema_changes
const VERSION_21: SchemaVersionDefinition = {
  temporarilyDisableForeignKeys: true,
  queries: [
    `CREATE TABLE new_entity_versions (
    id INTEGER PRIMARY KEY,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    entities_id INTEGER NOT NULL,
    version INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    created_by INTEGER NOT NULL,
    schema_version INTEGER NOT NULL,
    encode_version INTEGER NOT NULL,
    fields TEXT NOT NULL,
    FOREIGN KEY (entities_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES subjects(id)
) STRICT`,
    `INSERT INTO new_entity_versions (id, type, name, entities_id, version, created_at, created_by, schema_version, encode_version, fields)
      SELECT id, type, name, entities_id, version, created_at, created_by, schema_version, encode_version, fields FROM entity_versions`,
    'DROP TABLE entity_versions',
    'ALTER TABLE new_entity_versions RENAME TO entity_versions',
    'CREATE INDEX entity_versions_entities_id ON entity_versions(entities_id)',
  ],
};

// Add UNIQUE published_name column, following https://www.sqlite.org/lang_altertable.html#making_other_kinds_of_table_schema_changes
const VERSION_22: SchemaVersionDefinition = {
  temporarilyDisableForeignKeys: true,
  queries: [
    `CREATE TABLE new_entities (
      id INTEGER PRIMARY KEY,
      uuid TEXT NOT NULL,
      name TEXT NOT NULL,
      published_name TEXT,
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
      dirty INTEGER NOT NULL DEFAULT 0,
      invalid INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT entities_uuid UNIQUE (uuid),
      CONSTRAINT entities_name UNIQUE (name),
      CONSTRAINT entities_published_name UNIQUE (published_name),
      CONSTRAINT entities_updated_seq UNIQUE (updated_seq),
      FOREIGN KEY (latest_entity_versions_id) REFERENCES entity_versions(id),
      FOREIGN KEY (published_entity_versions_id) REFERENCES entity_versions(id)
  ) STRICT`,
    `INSERT INTO new_entities (id, uuid, name, type, auth_key, resolved_auth_key, status, never_published, created_at, updated_at, updated_seq, latest_entity_versions_id, published_entity_versions_id, dirty, invalid)
      SELECT id, uuid, name, type, auth_key, resolved_auth_key, status, never_published, created_at, updated_at, updated_seq, latest_entity_versions_id, published_entity_versions_id, dirty, invalid FROM entities`,
    'DROP TABLE entities',
    'ALTER TABLE new_entities RENAME TO entities',
    'CREATE INDEX entities_resolved_auth_key ON entities(resolved_auth_key)',
    'CREATE INDEX entities_resolved_auth_key_name ON entities(resolved_auth_key, name)',
    'CREATE INDEX entities_resolved_auth_key_updated_seq ON entities(resolved_auth_key, updated_seq)',
    'CREATE INDEX entities_resolved_auth_uuid ON entities(resolved_auth_key, uuid)',
    'CREATE INDEX entities_dirty ON entities(dirty)',
    `CREATE TRIGGER delete_entity_fts DELETE ON entities BEGIN
    DELETE FROM entities_latest_fts WHERE rowid = OLD.id;
    DELETE FROM entities_published_fts WHERE rowid = OLD.id;
END`,
  ],
};

const VERSION_23: SchemaVersionDefinition = {
  queries: [
    `UPDATE entities SET published_name = name WHERE status = 'published' OR status = 'modified'`,
    'ALTER TABLE event_entity_versions ADD COLUMN published_name TEXT',
  ],
};

const VERSION_24: SchemaVersionDefinition = { queries: ['DROP TABLE entity_publishing_events'] };

// Add uuid column to events
const VERSION_25: SchemaVersionDefinition = {
  temporarilyDisableForeignKeys: true,
  queries: [
    'ALTER TABLE events ADD COLUMN uuid TEXT',
    // Add uuid to existing events
    () => async (database: Database, context: TransactionContext) => {
      let processMore = true;
      while (processMore) {
        const getResult = await queryMany<{ id: number }>(
          database,
          context,
          'SELECT id FROM events WHERE uuid IS NULL LIMIT 100',
        );
        if (getResult.isError()) return getResult;
        processMore = getResult.value.length > 0;

        for (const { id } of getResult.value) {
          const updateResult = await queryRun(
            database,
            context,
            buildSqliteSqlQuery(({ sql }) => {
              sql`UPDATE events SET uuid = ${database.adapter.randomUUID()} WHERE id = ${id}`;
            }),
          );
          if (updateResult.isError()) return updateResult;
        }
      }
      return ok(undefined);
    },
    // From here following https://www.sqlite.org/lang_altertable.html#making_other_kinds_of_table_schema_changes
    `CREATE TABLE new_events (
    id INTEGER PRIMARY KEY,
    uuid TEXT NOT NULL,
    type TEXT NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    schema_versions_id INTEGER,
    CONSTRAINT events_uuid UNIQUE (uuid)
    FOREIGN KEY (created_by) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (schema_versions_id) REFERENCES schema_versions(id) ON DELETE CASCADE
) STRICT`,
    `INSERT INTO new_events (id, uuid, type, created_by, created_at, schema_versions_id)
    SELECT id, uuid, type, created_by, created_at, schema_versions_id FROM events`,
    'DROP TABLE events',
    'ALTER TABLE new_events RENAME TO events',
    'CREATE INDEX events_uuid ON events(uuid)',
  ],
};

const VERSION_26: SchemaVersionDefinition = {
  queries: [
    'ALTER TABLE events ADD COLUMN principals_id INTEGER REFERENCES principals(id) ON DELETE CASCADE',
  ],
};

// Make uuid nullable and add deleted_at and uuid_before_delete columns
const VERSION_27: SchemaVersionDefinition = {
  temporarilyDisableForeignKeys: true,
  queries: [
    `CREATE TABLE "new_entities" (
  id INTEGER PRIMARY KEY,
  uuid TEXT,
  uuid_before_delete TEXT,
  name TEXT NOT NULL,
  published_name TEXT,
  type TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  resolved_auth_key TEXT NOT NULL,
  status TEXT NOT NULL,
  never_published INTEGER NOT NULL DEFAULT TRUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_seq INTEGER NOT NULL,
  deleted_at TEXT,
  latest_entity_versions_id INTEGER,
  published_entity_versions_id INTEGER,
  dirty INTEGER NOT NULL DEFAULT 0,
  invalid INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT entities_uuid UNIQUE (uuid),
  CONSTRAINT entities_name UNIQUE (name),
  CONSTRAINT entities_published_name UNIQUE (published_name),
  CONSTRAINT entities_updated_seq UNIQUE (updated_seq),
  FOREIGN KEY (latest_entity_versions_id) REFERENCES entity_versions(id),
  FOREIGN KEY (published_entity_versions_id) REFERENCES entity_versions(id)
) STRICT;`,
    `INSERT INTO new_entities (id, uuid, name, published_name, type, auth_key, resolved_auth_key, status, never_published, created_at, updated_at, updated_seq, latest_entity_versions_id, published_entity_versions_id, dirty, invalid)
       SELECT id, uuid, name, published_name, type, auth_key, resolved_auth_key, status, never_published, created_at, updated_at, updated_seq, latest_entity_versions_id, published_entity_versions_id, dirty, invalid FROM entities`,
    'DROP TABLE entities',
    'ALTER TABLE new_entities RENAME TO entities',
    'CREATE INDEX entities_resolved_auth_key ON entities(resolved_auth_key)',
    'CREATE INDEX entities_resolved_auth_key_name ON entities(resolved_auth_key, name)',
    'CREATE INDEX entities_resolved_auth_key_updated_seq ON entities(resolved_auth_key, updated_seq)',
    'CREATE INDEX entities_resolved_auth_uuid ON entities(resolved_auth_key, uuid)',
    'CREATE INDEX entities_dirty ON entities(dirty)',
    `CREATE TRIGGER delete_entity_fts DELETE ON entities BEGIN
  DELETE FROM entities_latest_fts WHERE rowid = OLD.id;
  DELETE FROM entities_published_fts WHERE rowid = OLD.id;
END`,
  ],
};

const VERSIONS: SchemaVersionDefinition[] = /* @__PURE__ */ (() => [
  { queries: [] }, // nothing for version 0
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
  VERSION_18,
  VERSION_19,
  VERSION_20,
  VERSION_21,
  VERSION_22,
  VERSION_23,
  VERSION_24,
  VERSION_25,
  VERSION_26,
  VERSION_27,
])();

export const REQUIRED_SCHEMA_VERSION = /* @__PURE__ */ (() => VERSIONS.length - 1)();

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
    const queries: (QueryOrQueryAndValues | InteractiveMigrationQuery)[] = [];
    for (const queryDefinition of versionDefinition.queries) {
      if (typeof queryDefinition === 'function') {
        queries.push(queryDefinition(options));
      } else {
        queries.push(queryDefinition);
      }
    }
    const plan: SchemaVersionMigrationPlan = {
      temporarilyDisableForeignKeys: versionDefinition.temporarilyDisableForeignKeys ?? false,
      queries,
    };
    return plan;
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
