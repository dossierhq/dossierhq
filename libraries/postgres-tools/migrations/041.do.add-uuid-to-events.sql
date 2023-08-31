ALTER TABLE events ADD COLUMN uuid uuid NOT NULL UNIQUE DEFAULT uuid_generate_v4();
