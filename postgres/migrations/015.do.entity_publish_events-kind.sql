CREATE TYPE entity_publish_event_kind AS ENUM ('publish', 'unpublish', 'archive', 'unarchive');

ALTER TABLE entity_publish_events
  ADD COLUMN kind entity_publish_event_kind;

UPDATE entity_publish_events
  SET kind = 'publish'
  WHERE entity_versions_id IS NOT NULL;

UPDATE entity_publish_events epe
  SET kind = 'unpublish'
  WHERE entity_versions_id IS NULL;

ALTER TABLE entity_publish_events
  ALTER COLUMN kind SET NOT NULL;
