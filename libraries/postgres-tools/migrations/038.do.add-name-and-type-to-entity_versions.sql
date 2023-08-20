ALTER TABLE entity_versions
  ADD COLUMN name VARCHAR(255),
  ADD COLUMN type VARCHAR(255);

UPDATE entity_versions
  SET name = (SELECT name FROM entities WHERE id = entity_versions.entities_id),
  type = (SELECT type FROM entities WHERE id = entity_versions.entities_id);

ALTER TABLE entity_versions
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN type SET NOT NULL;

ALTER TABLE event_entity_versions
  DROP COLUMN entity_type;
