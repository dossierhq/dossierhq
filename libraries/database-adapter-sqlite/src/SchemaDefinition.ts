export const SCHEMA_DEFINITION = `
PRAGMA foreign_keys=TRUE;

CREATE TABLE subjects (
  id INTEGER PRIMARY KEY,
  uuid TEXT NOT NULL,
  created_at TEXT NOT NULL,
  CONSTRAINT subjects_pkey UNIQUE (uuid)
);

CREATE TABLE principals (
  id INTEGER PRIMARY KEY,
  provider TEXT NOT NULL,
  identifier TEXT NOT NULL,
  subjects_id INTEGER NOT NULL,
  CONSTRAINT principals_pkey UNIQUE (provider,identifier),
  FOREIGN KEY (subjects_id) REFERENCES subjects(id) ON DELETE CASCADE
);
`;
