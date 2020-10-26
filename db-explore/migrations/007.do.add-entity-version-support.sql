CREATE TABLE entity_versions (
  id SERIAL PRIMARY KEY,
  entities_id INTEGER REFERENCES entities(id) ON DELETE CASCADE NOT NULL,
  version SMALLINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES subjects(id) NOT NULL
);

ALTER TABLE entities
  ADD COLUMN published_version SMALLINT NOT NULL DEFAULT 0;

ALTER TABLE entity_fields
  ADD COLUMN min_version SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN max_version SMALLINT NOT NULL DEFAULT 0;

CREATE VIEW published_entity_fields AS
  SELECT ef.id, ef.entities_id, ef.name, ef.data
  FROM entities e, entity_fields ef
  WHERE e.id = ef.entities_id AND e.published_version >= ef.min_version AND e.published_version <= ef.max_version;