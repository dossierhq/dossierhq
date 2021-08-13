ALTER TABLE entities
  ADD COLUMN never_published BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE entities e
  SET never_published = FALSE
  FROM entity_publish_events epe
  WHERE e.id = epe.entities_id AND epe.kind = 'publish';
