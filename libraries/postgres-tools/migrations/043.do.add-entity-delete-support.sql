ALTER TABLE entities
  ALTER COLUMN uuid DROP NOT NULL,
  ALTER COLUMN name DROP NOT NULL,
  ADD COLUMN deleted_at timestamptz,
  ADD COLUMN uuid_before_delete UUID,
  ADD COLUMN name_before_delete VARCHAR(255);
