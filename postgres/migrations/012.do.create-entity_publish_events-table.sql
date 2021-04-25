CREATE TABLE entity_publish_events (
  id serial PRIMARY KEY,
  entity_versions_id integer REFERENCES entity_versions(id) ON DELETE CASCADE NOT NULL,
  published_by INTEGER REFERENCES subjects(id) NOT NULL,
  published_at timestamptz NOT NULL DEFAULT NOW()
);
