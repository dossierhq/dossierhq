ALTER TABLE entities
  ADD COLUMN published_name VARCHAR(255) UNIQUE;

UPDATE entities
  SET published_name = name
  WHERE status = 'published' OR status = 'modified';

ALTER TABLE event_entity_versions
  ADD COLUMN published_name VARCHAR(255);
