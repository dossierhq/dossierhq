ALTER TABLE entities
  ADD COLUMN latest_fts TSVECTOR NOT NULL;

CREATE INDEX entities_latest_fts_index ON entities USING GIN (latest_fts);
