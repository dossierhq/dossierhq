CREATE TABLE entities (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4() NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,
  published_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE entity_versions (
  id SERIAL PRIMARY KEY,
  entities_id INTEGER REFERENCES entities(id) ON DELETE CASCADE NOT NULL,
  version SMALLINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES subjects(id) NOT NULL,
  data JSONB
);

ALTER TABLE entities
  ADD COLUMN published_entity_versions_id INTEGER REFERENCES entity_versions(id);
