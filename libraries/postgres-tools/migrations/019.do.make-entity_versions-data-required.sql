UPDATE entity_versions
  SET data = '{}'
  WHERE data IS NULL;

ALTER TABLE entity_versions
  ALTER COLUMN data SET NOT NULL;
