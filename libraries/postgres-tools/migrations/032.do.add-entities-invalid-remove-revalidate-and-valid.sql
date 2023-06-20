ALTER TABLE entities
  DROP COLUMN revalidate,
  ADD column invalid SMALLINT NOT NULL DEFAULT 0;

UPDATE entities SET invalid = 1 WHERE NOT valid;

ALTER TABLE entities
  DROP COLUMN valid;

UPDATE entities SET dirty = 1 | 2 | 4 | 8;
