CREATE TABLE entity_latest_references (
  id SERIAL PRIMARY KEY,
  from_entities_id INTEGER REFERENCES entities(id) ON DELETE CASCADE NOT NULL,
  to_entities_id INTEGER REFERENCES entities(id) ON DELETE CASCADE NOT NULL
);

INSERT INTO entity_latest_references(from_entities_id, to_entities_id)
  SELECT e.id AS from_entities_id, evr.entities_id AS to_entities_id
    FROM entities e, entity_version_references evr
    WHERE e.latest_draft_entity_versions_id = evr.entity_versions_id;

DROP TABLE entity_version_references;
