ALTER TABLE entities
  ALTER COLUMN latest_fts DROP NOT NULL;

ALTER TYPE entity_status ADD VALUE 'deleted';

ALTER TYPE event_type ADD VALUE 'deleteEntities';

DROP TYPE entity_publish_event_kind;
