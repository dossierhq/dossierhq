CREATE TABLE subjects (
  id serial PRIMARY KEY,
  uuid uuid NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE principals (
  id serial PRIMARY KEY,
  provider varchar(255) NOT NULL,
  identifier varchar(255) NOT NULL,
  subjects_id integer REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  UNIQUE (provider, identifier)
);