ALTER TABLE entity_publish_events
  ADD COLUMN entities_id INTEGER REFERENCES entities(id) ON DELETE CASCADE;

UPDATE entity_publish_events epe
  SET entities_id = ev.entities_id
  FROM entity_versions ev
  WHERE epe.entities_id IS NULL AND epe.entity_versions_id = ev.id;

ALTER TABLE entity_publish_events
  ALTER COLUMN entities_id SET NOT NULL;
