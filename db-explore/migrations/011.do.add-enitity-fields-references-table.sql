CREATE TABLE entity_field_references (
  id SERIAL PRIMARY KEY,
  entity_fields_id INTEGER REFERENCES entity_fields(id) ON DELETE CASCADE NOT NULL,
  entities_id INTEGER REFERENCES entities(id) ON DELETE CASCADE NOT NULL
);
