import type { ErrorType, Result, SessionContext } from '.';
import { ensureRequired } from './Assertions';
import type { EntitiesTable, EntityVersionsTable } from './DbTableTypes';
import * as EntityFieldTypeAdapters from './EntityFieldTypeAdapters';
import { notOk, ok } from './ErrorResult';

export type EntityValues = Pick<EntitiesTable, 'uuid' | 'type' | 'name'> &
  Pick<EntityVersionsTable, 'data'>;

interface Entityish {
  id: string;
  _type: string;
  _name: string;
  [fieldName: string]: unknown;
}

export function decodeEntity(context: SessionContext, values: EntityValues): Entityish {
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

export function encodeEntity(
  context: SessionContext,
  entity: { _type: string; _name: string; [fieldName: string]: unknown },
  defaultValuesEncoded: Record<string, unknown> | null
): Result<{ type: string; name: string; data: Record<string, unknown> }, ErrorType.BadRequest> {
  const assertion = ensureRequired({ 'entity._type': entity._type, 'entity._name': entity._name });
  if (assertion.isError()) {
    return assertion;
  }

  const { _type: type, _name: name } = entity;

  const schema = context.instance.getSchema();
  const entitySpec = schema.getEntityTypeSpecification(type);
  if (!entitySpec) {
    return notOk.BadRequest(`Entity type ${type} doesn’t exist`);
  }

  const result: { type: string; name: string; data: Record<string, unknown> } = {
    type,
    name,
    data: {},
  };
  for (const fieldSpec of entitySpec.fields) {
    const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
    if (fieldSpec.name in entity) {
      const data = entity[fieldSpec.name];
      result.data[fieldSpec.name] = fieldAdapter.encodeData(data);
    } else if (defaultValuesEncoded && fieldSpec.name in defaultValuesEncoded) {
      result.data[fieldSpec.name] = defaultValuesEncoded[fieldSpec.name]; // is already encoded
    }
  }
  return ok(result);
}
