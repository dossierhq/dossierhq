CREATE TABLE unique_index_values (
  id SERIAL PRIMARY KEY,
  entities_id INTEGER REFERENCES entities(id) ON DELETE CASCADE NOT NULL,
  index_name VARCHAR(255) NOT NULL,
  value VARCHAR(255) NOT NULL,
  latest BOOLEAN NOT NULL DEFAULT FALSE,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (index_name, value)
);

CREATE INDEX unique_index_values_entities_id ON unique_index_values(entities_id);
