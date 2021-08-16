ALTER TABLE entities
  ADD COLUMN created_at TIMESTAMPTZ,
  ADD COLUMN updated_at TIMESTAMPTZ,
  ADD COLUMN updated INTEGER UNIQUE;

UPDATE entities e
  SET created_at = ev.created_at
  FROM (
    SELECT entities_id AS id, min(created_at) AS created_at FROM entity_versions GROUP BY entities_id
  ) AS ev
  WHERE e.id = ev.id;

UPDATE entities e
  SET updated_at = ev.created_at
  FROM (
    SELECT entities_id AS id, max(created_at) AS created_at FROM entity_versions GROUP BY entities_id
  ) AS ev
  WHERE e.id = ev.id;

UPDATE entities e
  SET updated_at = epe.published_at
  FROM (
    SELECT entities_id AS id, max(published_at) AS published_at FROM entity_publishing_events GROUP BY entities_id
  ) AS epe
  WHERE e.id = epe.id AND epe.published_at > e.updated_at;

CREATE SEQUENCE entities_updated_seq AS integer OWNED BY entities.updated;

UPDATE entities e1
  SET updated = nextval('entities_updated_seq')
  FROM (
    SELECT id FROM entities ORDER BY updated_at
  ) AS e2
  WHERE e1.id = e2.id;

ALTER TABLE entities
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL,
  ALTER COLUMN updated SET DEFAULT nextval('entities_updated_seq'),
  ALTER COLUMN updated SET NOT NULL;
