ALTER TABLE schema_versions
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN version INTEGER;

UPDATE schema_versions SET version = id WHERE version IS NULL;

ALTER TABLE schema_versions
  ALTER COLUMN version SET NOT NULL,
  ADD UNIQUE (version);
