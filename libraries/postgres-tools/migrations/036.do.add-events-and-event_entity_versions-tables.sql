CREATE TYPE event_type as ENUM (
  'createEntity',
  'createAndPublishEntity',
  'updateEntity',
  'updateAndPublishEntity',
  'publishEntities',
  'unpublishEntities',
  'archiveEntity',
  'unarchiveEntity',
  'updateSchema'
);

CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  type event_type NOT NULL,
  created_by INTEGER REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  schema_versions_id INTEGER REFERENCES schema_versions(id) ON DELETE CASCADE
);

CREATE TABLE event_entity_versions (
  id SERIAL PRIMARY KEY,
  events_id INTEGER REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  entity_versions_id INTEGER REFERENCES entity_versions(id) ON DELETE CASCADE NOT NULL,
  entity_type VARCHAR(255) NOT NULL
);

CREATE INDEX event_entity_versions_events_id ON event_entity_versions(events_id);
CREATE INDEX event_entity_versions_entity_versions_id ON event_entity_versions(entity_versions_id);
