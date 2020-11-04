CREATE TABLE entitiesb (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,
  published_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE entityb_versions (
  id SERIAL PRIMARY KEY,
  entities_id INTEGER REFERENCES entitiesb(id) ON DELETE CASCADE NOT NULL,
  version SMALLINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES subjects(id) NOT NULL,
  data JSONB NOT NULL
);

ALTER TABLE entitiesb
  ADD COLUMN published_entityb_versions INTEGER REFERENCES entityb_versions(id);
