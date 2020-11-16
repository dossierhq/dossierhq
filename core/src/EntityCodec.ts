import type { SessionContext } from '.';
import type { EntitiesTableFields, EntityVersionsTableFields } from './DbTableTypes';
import * as EntityFieldTypeAdapters from './EntityFieldTypeAdapters';

type EntityValues = Pick<EntitiesTableFields, 'uuid' | 'type' | 'name'> &
  Pick<EntityVersionsTableFields, 'data'>;

interface Entityish {
  id: string;
  _type: string;
  _name: string;
  [fieldName: string]: unknown;
}

export function assembleEntity(context: SessionContext, values: EntityValues): Entityish {
  const schema = context.instance.getSchema();
  const entitySpec = schema.getEntityTypeSpecification(values.type);
  if (!entitySpec) {
    throw new Error(`No entity spec for type ${values.type}`);
  }
  const entity: Entityish = {
    id: values.uuid,
    _type: values.type,
    _name: values.name,
  };
  if (values.data) {
    for (const [fieldName, fieldValue] of Object.entries(values.data)) {
      const fieldSpec = schema.getEntityFieldSpecification(entitySpec, fieldName);
      if (!fieldSpec) {
        throw new Error(`No field spec for ${fieldName} in entity spec ${values.type}`);
      }
      const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
      const decodedData = fieldAdapter.decodeData(fieldValue);
      entity[fieldName] = decodedData;
    }
  }
  return entity;
}
