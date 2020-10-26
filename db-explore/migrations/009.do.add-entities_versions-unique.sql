ALTER TABLE entity_versions
  ADD CONSTRAINT entity_versions_entities_id_version_key UNIQUE (entities_id, version);
