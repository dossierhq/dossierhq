import type { PromiseResult, SessionContext } from '.';
import * as Db from './Db';
import * as EntityFieldTypeAdapters from './EntityFieldTypeAdapters';
import { ErrorType, notOk, ok } from './ErrorResult';

export interface Entity {
  id: string;
  _type: string;
  _name: string;
  [fieldName: string]: unknown;
}

interface EntityMainInfo {
  uuid: string;
  type: string;
  name: string;
  data: Record<string, unknown>;
}

export async function getEntity(
  context: SessionContext,
  id: string
): PromiseResult<{ item: Entity }, ErrorType.NotFound> {
  const entityMain = await Db.queryNoneOrOne<EntityMainInfo>(
    context,
    `SELECT e.uuid, e.type, e.name, ev.data
      FROM entities e, entity_versions ev
      WHERE e.uuid = $1
      AND e.published_deleted = false
      AND e.published_entity_versions_id = ev.id`,
    [id]
  );
  if (!entityMain) {
    return notOk.NotFound('No such entity');
  }

  const entity = assembleEntity(context, entityMain);

  return ok({
    item: entity,
  });
}

export function assembleEntity(context: SessionContext, entityMain: EntityMainInfo): Entity {
  const schema = context.instance.getSchema();
  const entitySpec = schema.getEntityTypeSpecification(entityMain.type);
  if (!entitySpec) {
    throw new Error(`No entity spec for type ${entityMain.type}`);
  }
  const entity: Entity = {
    id: entityMain.uuid,
    _type: entityMain.type,
    _name: entityMain.name,
  };
  for (const [fieldName, fieldValue] of Object.entries(entityMain.data)) {
    const fieldSpec = schema.getEntityFieldSpecification(entitySpec, fieldName);
    if (!fieldSpec) {
      throw new Error(`No field spec for ${fieldName} in entity spec ${entityMain.type}`);
    }
    const fieldAdapter = EntityFieldTypeAdapters.getAdapter(fieldSpec);
    const decodedData = fieldAdapter.decodeData(fieldValue);
    entity[fieldName] = decodedData;
  }
  return entity;
}
