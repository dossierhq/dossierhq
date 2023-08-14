CREATE TABLE subjects (
    id INTEGER PRIMARY KEY,
    uuid TEXT NOT NULL,
    created_at TEXT NOT NULL,
    CONSTRAINT subjects_uuid UNIQUE (uuid)
  ) STRICT;
CREATE TABLE principals (
    id INTEGER PRIMARY KEY,
    provider TEXT NOT NULL,
    identifier TEXT NOT NULL,
    subjects_id INTEGER NOT NULL,
    CONSTRAINT principals_pkey UNIQUE (provider, identifier),
    FOREIGN KEY (subjects_id) REFERENCES subjects(id) ON DELETE CASCADE
  ) STRICT;
CREATE TABLE sequences (
    name TEXT NOT NULL UNIQUE,
    value INTEGER DEFAULT 0
  ) STRICT;
CREATE TABLE entities (
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
    published_entity_versions_id INTEGER, dirty INTEGER NOT NULL DEFAULT 0, invalid INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT entities_uuid UNIQUE (uuid),
    CONSTRAINT entities_name UNIQUE (name),
    CONSTRAINT entities_updated_seq UNIQUE (updated_seq),
    FOREIGN KEY (latest_entity_versions_id) REFERENCES entity_versions(id),
    FOREIGN KEY (published_entity_versions_id) REFERENCES entity_versions(id)
  ) STRICT;
CREATE VIRTUAL TABLE entities_latest_fts USING fts5 (
    content
  )
/* entities_latest_fts(content) */;
CREATE TABLE IF NOT EXISTS 'entities_latest_fts_data'(id INTEGER PRIMARY KEY, block BLOB);
CREATE TABLE IF NOT EXISTS 'entities_latest_fts_idx'(segid, term, pgno, PRIMARY KEY(segid, term)) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS 'entities_latest_fts_content'(id INTEGER PRIMARY KEY, c0);
CREATE TABLE IF NOT EXISTS 'entities_latest_fts_docsize'(id INTEGER PRIMARY KEY, sz BLOB);
CREATE TABLE IF NOT EXISTS 'entities_latest_fts_config'(k PRIMARY KEY, v) WITHOUT ROWID;
CREATE VIRTUAL TABLE entities_published_fts USING fts5 (
    content
  )
/* entities_published_fts(content) */;
CREATE TABLE IF NOT EXISTS 'entities_published_fts_data'(id INTEGER PRIMARY KEY, block BLOB);
CREATE TABLE IF NOT EXISTS 'entities_published_fts_idx'(segid, term, pgno, PRIMARY KEY(segid, term)) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS 'entities_published_fts_content'(id INTEGER PRIMARY KEY, c0);
CREATE TABLE IF NOT EXISTS 'entities_published_fts_docsize'(id INTEGER PRIMARY KEY, sz BLOB);
CREATE TABLE IF NOT EXISTS 'entities_published_fts_config'(k PRIMARY KEY, v) WITHOUT ROWID;
CREATE TABLE entity_versions (
    id INTEGER PRIMARY KEY,
    entities_id INTEGER NOT NULL,
    version INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    created_by INTEGER NOT NULL,
    fields TEXT NOT NULL, schema_version INTEGER NOT NULL DEFAULT 0, encode_version INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (entities_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES subjects(id)
  ) STRICT;
CREATE TABLE entity_publishing_events (
    id INTEGER PRIMARY KEY,
    entities_id INTEGER NOT NULL,
    entity_versions_id INTEGER,
    published_by INTEGER NOT NULL,
    published_at TEXT NOT NULL,
    kind TEXT NOT NULL,
    FOREIGN KEY (entities_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY (entity_versions_id) REFERENCES entity_versions(id) ON DELETE CASCADE,
    FOREIGN KEY (published_by) REFERENCES subjects(id)
  ) STRICT;
CREATE TABLE advisory_locks (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    handle INTEGER NOT NULL,
    acquired_at TEXT NOT NULL,
    renewed_at TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    lease_duration INTEGER NOT NULL,
    CONSTRAINT advisory_locks_name UNIQUE (name)
  ) STRICT;
CREATE TABLE entity_published_references (
    id INTEGER PRIMARY KEY,
    from_entities_id INTEGER NOT NULL,
    to_entities_id INTEGER NOT NULL,
    FOREIGN KEY (from_entities_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY (to_entities_id) REFERENCES entities(id) ON DELETE CASCADE
  ) STRICT;
CREATE TABLE entity_latest_references (
    id INTEGER PRIMARY KEY,
    from_entities_id INTEGER NOT NULL,
    to_entities_id INTEGER NOT NULL,
    FOREIGN KEY (from_entities_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY (to_entities_id) REFERENCES entities(id) ON DELETE CASCADE
  ) STRICT;
CREATE TABLE entity_published_locations (
    id INTEGER PRIMARY KEY,
    entities_id INTEGER NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    FOREIGN KEY (entities_id) REFERENCES entities(id) ON DELETE CASCADE
  ) STRICT;
CREATE TABLE entity_latest_locations (
    id INTEGER PRIMARY KEY,
    entities_id INTEGER NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    FOREIGN KEY (entities_id) REFERENCES entities(id) ON DELETE CASCADE
  ) STRICT;
CREATE TABLE unique_index_values (
    id INTEGER PRIMARY KEY,
    entities_id INTEGER NOT NULL,
    index_name TEXT NOT NULL,
    value TEXT NOT NULL,
    latest INTEGER NOT NULL DEFAULT FALSE,
    published INTEGER NOT NULL DEFAULT FALSE,
    FOREIGN KEY (entities_id) REFERENCES entities(id) ON DELETE CASCADE,
    CONSTRAINT unique_index_values_index_value UNIQUE (index_name, value)
  ) STRICT;
CREATE INDEX unique_index_values_entities_id ON unique_index_values(entities_id);
CREATE INDEX entity_versions_entities_id ON entity_versions(entities_id);
CREATE INDEX entity_published_references_from_entities_id ON entity_published_references(from_entities_id);
CREATE INDEX entity_published_locations_entities_id ON entity_published_locations(entities_id);
CREATE INDEX entity_latest_references_from_entities_id ON entity_latest_references(from_entities_id);
CREATE INDEX entity_latest_locations_entities_id ON entity_latest_locations(entities_id);
CREATE INDEX entities_resolved_auth_key ON entities(resolved_auth_key);
CREATE INDEX entity_publishing_events_entities_id ON entity_publishing_events(entities_id);
CREATE INDEX entities_resolved_auth_key_name ON entities(resolved_auth_key, name);
CREATE INDEX entities_resolved_auth_key_updated_seq ON entities(resolved_auth_key, updated_seq);
CREATE INDEX entities_resolved_auth_uuid ON entities(resolved_auth_key, uuid);
CREATE INDEX entities_dirty ON entities(dirty);
CREATE TABLE entity_latest_value_types (
    id INTEGER PRIMARY KEY,
    entities_id INTEGER NOT NULL,
    value_type TEXT NOT NULL,
    FOREIGN KEY (entities_id) REFERENCES entities(id) ON DELETE CASCADE
  );
CREATE TABLE entity_published_value_types (
    id INTEGER PRIMARY KEY,
    entities_id INTEGER NOT NULL,
    value_type TEXT NOT NULL,
    FOREIGN KEY (entities_id) REFERENCES entities(id) ON DELETE CASCADE
  );
CREATE TABLE schema_versions (
    id INTEGER PRIMARY KEY,
    version INTEGER NOT NULL UNIQUE,
    updated_at TEXT NOT NULL,
    specification TEXT NOT NULL
  ) STRICT;
CREATE TRIGGER delete_entity_fts DELETE ON entities BEGIN
    DELETE FROM entities_latest_fts WHERE rowid = OLD.id;
    DELETE FROM entities_published_fts WHERE rowid = OLD.id;
   END;
CREATE TABLE events (id INTEGER PRIMARY KEY, type TEXT NOT NULL, created_by INTEGER NOT NULL, created_at TEXT NOT NULL, schema_versions_id INTEGER, FOREIGN KEY (created_by) REFERENCES subjects(id), FOREIGN KEY (schema_versions_id) REFERENCES schema_versions(id)) STRICT;
CREATE TABLE event_entity_versions (id INTEGER PRIMARY KEY, events_id INTEGER NOT NULL, entity_versions_id INTEGER NOT NULL, entity_type TEXT NOT NULL, FOREIGN KEY (events_id) REFERENCES events(id), FOREIGN KEY (entity_versions_id) REFERENCES entity_versions(id)) STRICT;
