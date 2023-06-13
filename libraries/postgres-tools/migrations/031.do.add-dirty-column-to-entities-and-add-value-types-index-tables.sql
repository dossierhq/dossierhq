ALTER TABLE entities
  ADD COLUMN dirty SMALLINT NOT NULL DEFAULT 0;

CREATE INDEX entities_dirty ON entities(dirty);

UPDATE entities SET dirty = 1 WHERE revalidate;

CREATE TABLE entity_latest_value_types (
  id SERIAL PRIMARY KEY,
  entities_id INTEGER REFERENCES entities(id) ON DELETE CASCADE NOT NULL,
  value_type VARCHAR(255) NOT NULL
);

CREATE TABLE entity_published_value_types (
  id SERIAL PRIMARY KEY,
  entities_id INTEGER REFERENCES entities(id) ON DELETE CASCADE NOT NULL,
  value_type VARCHAR(255) NOT NULL
);
