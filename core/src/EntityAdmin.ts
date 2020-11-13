import type { ErrorType, PromiseResult, Result, SessionContext } from '.';
import { ensureRequired } from './Assertions';
import * as Db from './Db';
import * as EntityFieldTypeAdapters from './EntityFieldTypeAdapters';
import { notOk, ok } from './ErrorResult';

interface AdminEntityCreate {
  /** UUIDv4 */
  id?: string;
  _name: string;
  _type: string;
  [fieldName: string]: unknown;
}

export async function createEntity(
  context: SessionContext,
  entity: AdminEntityCreate,
  options: { publish: boolean }
): PromiseResult<{ id: string }, ErrorType.BadRequest> {
  const encodeResult = encodeFieldsToValues(context, entity);
  if (encodeResult.isError()) {
    return encodeResult;
  }
  const { type, name, data } = encodeResult.value;

  return await context.withTransaction(async (context) => {
    const { id: entityId, uuid } = await Db.queryOne<{ id: number; uuid: string }>(
      context,
      'INSERT INTO entities (name, type) VALUES ($1, $2) RETURNING id, uuid',
      [name, type]
    );

    const { id: versionsId } = await Db.queryOne<{ id: number }>(
      context,
      'INSERT INTO entity_versions (entities_id, version, created_by, data) VALUES ($1, 0, $2, $3) RETURNING id',
      [entityId, context.session.subjectId, data]
    );
    if (options.publish) {
      await Db.queryNone(
        context,
        'UPDATE entities SET published_entity_versions_id = $1 WHERE id = $2',
        [versionsId, entityId]
      );
    }
    return ok({ id: uuid });
  });
}

function encodeFieldsToValues(
  context: SessionContext,
  entity: AdminEntityCreate
): Result<{ type: string; name: string; data: Record<string, unknown> }, ErrorType.BadRequest> {
  const assertion = ensureRequired({ 'entity._type': entity._type, 'entity._name': entity._name });
  if (assertion.isError()) return assertion;

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
    const data = entity[fieldSpec.name];
    result.data[fieldSpec.name] = fieldAdapter.encodeData(data);
  }
  return ok(result);
}

export async function deleteEntity(
  context: SessionContext,
  id: string,
  options: { publish: boolean }
): PromiseResult<void, ErrorType.NotFound> {
  return await context.withTransaction(async (context) => {
    const versionResult = await resolveMaxVersionForEntity(context, id);
    if (versionResult.isError()) {
      return versionResult;
    }
    const { entityId, maxVersion } = versionResult.value;
    const version = maxVersion + 1;
    const { id: versionsId } = await Db.queryOne<{ id: number }>(
      context,
      'INSERT INTO entity_versions (entities_id, created_by, version) VALUES ($1, $2, $3) RETURNING id',
      [entityId, context.session.subjectId, version]
    );
    if (options.publish) {
      await Db.queryNone(
        context,
        'UPDATE entities SET published_entity_versions_id = $1, published_deleted = true WHERE id = $2',
        [versionsId, entityId]
      );
    }
    return ok(undefined);
  });
}

async function resolveMaxVersionForEntity(
  context: SessionContext,
  id: string
): PromiseResult<{ entityId: number; maxVersion: number }, ErrorType.NotFound> {
  const result = await Db.queryNoneOrOne<{
    entities_id: number;
    version: number;
  }>(
    context,
    `SELECT ev.entities_id, MAX(ev.version) AS version
      FROM entity_versions ev, entities e
      WHERE e.uuid = $1 AND e.id = ev.entities_id
      GROUP BY entities_id`,
    [id]
  );
  if (!result) {
    return notOk.NotFound('No such entity');
  }
  return ok({ entityId: result.entities_id, maxVersion: result.version });
}
