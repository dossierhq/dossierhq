CREATE INDEX entities_non_deleted ON entities(id) WHERE published_deleted = false;

CREATE INDEX entity_fields_entities_is ON entity_fields(entities_id);
