ALTER TABLE entity_versions
  ADD COLUMN schema_version INTEGER;

UPDATE entity_versions
  SET schema_version = (SELECT version FROM schema_versions ORDER BY version DESC LIMIT 1)
  WHERE schema_version IS NULL;

ALTER TABLE entity_versions
  ALTER COLUMN schema_version SET NOT NULL;
