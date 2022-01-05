//TODO enable strict tables when sqlite 3.37+ https://www.sqlite.org/stricttables.html

export const SCHEMA_DEFINITION_STATEMENTS = [
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
    latest_entity_versions_id INTEGER,
    published_entity_versions_id INTEGER,
    CONSTRAINT entities_uuid UNIQUE (uuid),
    CONSTRAINT entities_name UNIQUE (name),
    FOREIGN KEY (latest_entity_versions_id) REFERENCES entity_versions(id),
    FOREIGN KEY (published_entity_versions_id) REFERENCES entity_versions(id)
  )`,
  `CREATE TABLE entity_versions (
    id INTEGER PRIMARY KEY,
    entities_id INTEGER NOT NULL,
    version INTEGER NOT NULL,
    created_at TEST NOT NULL,
    created_by INTEGER NOT NULL,
    fields TEXT NOT NULL,
    FOREIGN KEY (entities_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES subjects(id)
  )`,
  `CREATE TABLE entity_version_references (
    id INTEGER PRIMARY KEY,
    entities_id INTEGER NOT NULL,
    entity_versions_id INTEGER NOT NULL,
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
