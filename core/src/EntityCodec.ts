import type { EntityTypeSpecification, ErrorType, PromiseResult, SessionContext } from '.';
import { notOk, ok } from '.';
import { ensureRequired } from './Assertions';
import * as Db from './Db';
import type { EntitiesTable, EntityVersionsTable } from './DbTableTypes';
import * as EntityFieldTypeAdapters from './EntityFieldTypeAdapters';

export type EntityValues = Pick<EntitiesTable, 'uuid' | 'type' | 'name'> &
  Pick<EntityVersionsTable, 'data'>;

interface Entityish {
  id: string;
  _type: string;
  _name: string;
  [fieldName: string]: unknown;
}

interface EncodeEntityResult {
  type: string;
  name: string;
  data: Record<string, unknown>;
  referenceIds: number[];
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

export async function encodeEntity(
  context: SessionContext,
  entity: { _type: string; _name: string; [fieldName: string]: unknown },
  defaultValuesEncoded: Record<string, unknown> | null
): PromiseResult<EncodeEntityResult, ErrorType.BadRequest> {
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

  const result: EncodeEntityResult = {
    type,
    name,
    data: {},
    referenceIds: [],
  };
  for (const fieldSpec of entitySpec.fields) {
    const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
    if (fieldSpec.name in entity) {
      const data = entity[fieldSpec.name];
      result.data[fieldSpec.name] = fieldAdapter.encodeData(data);
    } else if (defaultValuesEncoded && fieldSpec.name in defaultValuesEncoded) {
      const encodedData = defaultValuesEncoded[fieldSpec.name];
      result.data[fieldSpec.name] = encodedData;
    }
  }

  const referenceIdsResult = await collectReferenceIds(
    context,
    entitySpec,
    entity,
    defaultValuesEncoded
  );
  if (referenceIdsResult.isError()) {
    return referenceIdsResult;
  }
  result.referenceIds.push(...referenceIdsResult.value);

  return ok(result);
}

async function collectReferenceIds(
  context: SessionContext,
  entitySpec: EntityTypeSpecification,
  entity: { _type: string; _name: string; [fieldName: string]: unknown },
  defaultValuesEncoded: Record<string, unknown> | null
): PromiseResult<number[], ErrorType.BadRequest> {
  const uuids = new Set<string>();

  for (const fieldSpec of entitySpec.fields) {
    const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
    let fieldUUIDs: string[] | null = null;
    if (fieldSpec.name in entity) {
      const data = entity[fieldSpec.name];
      fieldUUIDs = fieldAdapter.getReferenceUUIDs(data);
    } else if (defaultValuesEncoded && fieldSpec.name in defaultValuesEncoded) {
      // TODO check when existing reference isn't updated
      const encodedData = defaultValuesEncoded[fieldSpec.name];
      fieldUUIDs = fieldAdapter.getReferenceUUIDs(fieldAdapter.decodeData(encodedData));
    }
    fieldUUIDs?.forEach((x) => uuids.add(x));
  }

  if (uuids.size === 0) {
    return ok([]);
  }

  const items = await Db.queryMany<Pick<EntitiesTable, 'id' | 'type' | 'uuid'>>(
    context,
    'SELECT id, uuid, type FROM entities WHERE uuid = ANY($1)',
    [[...uuids]]
  );

  for (const fieldSpec of entitySpec.fields) {
    const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
    let fieldUUIDs: string[] | null = null;
    if (fieldSpec.name in entity) {
      const data = entity[fieldSpec.name];
      fieldUUIDs = fieldAdapter.getReferenceUUIDs(data);
    } else if (defaultValuesEncoded && fieldSpec.name in defaultValuesEncoded) {
      const encodedData = defaultValuesEncoded[fieldSpec.name];
      fieldUUIDs = fieldAdapter.getReferenceUUIDs(fieldAdapter.decodeData(encodedData));
    }

    if (!fieldUUIDs || fieldUUIDs.length === 0) {
      continue;
    }
    for (const uuid of fieldUUIDs) {
      const item = items.find((x) => x.uuid === uuid);
      if (!item) {
        return notOk.BadRequest(
          `Referenced entity (${uuid}) of field ${fieldSpec.name} doesn’t exist`
        );
      }
      if (fieldSpec.entityTypes && fieldSpec.entityTypes.length > 0) {
        if (fieldSpec.entityTypes.indexOf(item.type) < 0) {
          return notOk.BadRequest(
            `Referenced entity (${uuid}) of field ${fieldSpec.name} has an invalid type ${item.type}`
          );
        }
      }
    }
  }

  return ok(items.map((item) => item.id));
}
