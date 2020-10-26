CREATE TABLE principals (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(255) NOT NULL,
  identifier VARCHAR(255) NOT NULL,
  subjects_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  UNIQUE (provider, identifier)
);