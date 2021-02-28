CREATE TABLE entity_version_locations (
  id SERIAL PRIMARY KEY,
  entity_versions_id INTEGER REFERENCES entity_versions(id) ON DELETE CASCADE NOT NULL,
  location GEOMETRY NOT NULL,
  CONSTRAINT enforce_srid_location CHECK (ST_SRID(location) = 4326)
);