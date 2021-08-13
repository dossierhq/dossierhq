DROP TABLE entity_types;

CREATE TABLE schema_versions (
  id SERIAL PRIMARY KEY,
  specification JSONB NOT NULL
);