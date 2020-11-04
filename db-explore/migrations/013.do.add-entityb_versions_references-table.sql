CREATE TABLE entityb_version_references (
  id SERIAL PRIMARY KEY,
  entityb_versions_id INTEGER REFERENCES entityb_versions(id) ON DELETE CASCADE NOT NULL,
  entities_id INTEGER REFERENCES entities(id) ON DELETE CASCADE NOT NULL
);
