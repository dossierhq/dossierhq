ALTER TABLE entities
  ADD COLUMN auth_key VARCHAR(255),
  ADD COLUMN resolved_auth_key VARCHAR(255);

UPDATE entities SET auth_key = 'none', resolved_auth_key = 'none';

ALTER TABLE entities
  ALTER COLUMN auth_key SET NOT NULL,
  ALTER COLUMN resolved_auth_key SET NOT NULL;
