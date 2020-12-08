import { ErrorType, notOk, ok } from '.';
import type { PromiseResult, SessionContext } from '.';
import * as Db from './Db';
import type { EntitiesTable, EntityVersionsTable } from './DbTableTypes';
import { decodePublishedEntity } from './EntityCodec';

export interface Entity {
  id: string;
  _type: string;
  _name: string;
  [fieldName: string]: unknown;
}

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
