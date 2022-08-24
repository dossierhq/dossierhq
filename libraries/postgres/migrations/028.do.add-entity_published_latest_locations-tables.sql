CREATE TABLE entity_published_locations (
  id SERIAL PRIMARY KEY,
  entities_id INTEGER REFERENCES entities(id) ON DELETE CASCADE NOT NULL,
  location GEOMETRY NOT NULL,
  CONSTRAINT enforce_srid_location CHECK (ST_SRID(location) = 4326)
);

CREATE TABLE entity_latest_locations (
  id SERIAL PRIMARY KEY,
  entities_id INTEGER REFERENCES entities(id) ON DELETE CASCADE NOT NULL,
  location GEOMETRY NOT NULL,
  CONSTRAINT enforce_srid_location CHECK (ST_SRID(location) = 4326)
);

INSERT INTO entity_published_locations(entities_id, location)
  SELECT e.id AS entities_id, evl.location
    FROM entities e, entity_version_locations evl
    WHERE e.published_entity_versions_id = evl.entity_versions_id;

INSERT INTO entity_latest_locations(entities_id, location)
  SELECT e.id AS entities_id, evl.location
    FROM entities e, entity_version_locations evl
    WHERE e.latest_draft_entity_versions_id = evl.entity_versions_id;

DROP TABLE entity_version_locations;
