CREATE TYPE entity_status as ENUM ('draft', 'published', 'modified', 'withdrawn', 'archived');

ALTER TABLE entities
  ADD COLUMN status entity_status;

UPDATE entities SET status = 'draft' WHERE NOT archived AND published_entity_versions_id IS NULL AND never_published;
UPDATE entities SET status = 'published' WHERE published_entity_versions_id IS NOT NULL AND published_entity_versions_id = latest_draft_entity_versions_id;
UPDATE entities SET status = 'modified' WHERE published_entity_versions_id IS NOT NULL AND published_entity_versions_id <> latest_draft_entity_versions_id;
UPDATE entities SET status = 'withdrawn' WHERE NOT archived AND published_entity_versions_id IS NULL AND NOT never_published;
UPDATE entities SET status = 'archived' WHERE archived;

ALTER TABLE entities
  ALTER COLUMN status SET NOT NULL;
