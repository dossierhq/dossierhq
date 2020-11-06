CREATE INDEX entitiesb_non_deleted_index ON entitiesb(id) WHERE published_deleted = false;

CREATE INDEX entityb_version_references_entityb_versions_id_index ON entityb_version_references(entityb_versions_id);
