ALTER TABLE entities
  ADD COLUMN published_fts TSVECTOR;

CREATE INDEX entities_published_fts_index ON entities USING GIN (published_fts);
