ALTER TABLE entities
  ADD COLUMN latest_draft_entity_versions_id INTEGER REFERENCES entity_versions(id);
