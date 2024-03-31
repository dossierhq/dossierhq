ALTER TABLE events ADD COLUMN principals_id integer REFERENCES principals(id) ON DELETE CASCADE;

ALTER TYPE event_type ADD VALUE 'createPrincipal';
