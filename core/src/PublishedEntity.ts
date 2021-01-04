import { ErrorType, notOk, ok } from '.';
import type { PromiseResult, Result, SessionContext } from '.';
import * as Db from './Db';
import type { EntitiesTable, EntityVersionsTable } from './DbTableTypes';
import { decodePublishedEntity } from './EntityCodec';

export interface Entity {
  id: string;
  _type: string;
  _name: string;
  [fieldName: string]: unknown;
}

//TODO rename to ValueItem
export interface Value {
  _type: string;
  [fieldName: string]: unknown;
}

export async function getEntity(
  context: SessionContext,
  id: string
): PromiseResult<{ item: Entity }, ErrorType.NotFound> {
  const entityMain = await Db.queryNoneOrOne<
    Pick<EntitiesTable, 'uuid' | 'type' | 'name'> & Pick<EntityVersionsTable, 'data'>
  >(
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

  const entity = decodePublishedEntity(context, entityMain);

  return ok({
    item: entity,
  });
}

/**
 * Fetches published entities. The entities are returned in the same order as in `ids`.
 *
 * If any of the entities are missing that item is returned as an error but the others are returned
 * as normal.
 * @param context The session context
 * @param ids The ids of the entities
 */
export async function getEntities(
  context: SessionContext,
  ids: string[]
): Promise<Result<Entity, ErrorType.NotFound>[]> {
  if (ids.length === 0) {
    return [];
  }
  const entitiesMain = await Db.queryMany<
    Pick<EntitiesTable, 'uuid' | 'type' | 'name'> & Pick<EntityVersionsTable, 'data'>
  >(
    context,
    `SELECT e.uuid, e.type, e.name, ev.data
      FROM entities e, entity_versions ev
      WHERE e.uuid = ANY($1)
      AND e.published_deleted = false
      AND e.published_entity_versions_id = ev.id`,
    [ids]
  );

  const result: Result<Entity, ErrorType.NotFound>[] = ids.map((id) => {
    const entityMain = entitiesMain.find((x) => x.uuid === id);
    if (!entityMain) {
      return notOk.NotFound('No such entity');
    }
    const entity = decodePublishedEntity(context, entityMain);
    return ok(entity);
  });

  return result;
}
