ALTER TABLE entityb_version_references
  DROP COLUMN entities_id;

ALTER TABLE entityb_version_references
  ADD COLUMN entities_id INTEGER REFERENCES entitiesb(id) ON DELETE CASCADE NOT NULL;
