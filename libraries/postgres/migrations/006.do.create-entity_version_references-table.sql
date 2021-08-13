CREATE TABLE entity_version_references (
  id SERIAL PRIMARY KEY,
  entity_versions_id INTEGER REFERENCES entity_versions(id) ON DELETE CASCADE NOT NULL,
  entities_id INTEGER REFERENCES entities(id) ON DELETE CASCADE NOT NULL
);
