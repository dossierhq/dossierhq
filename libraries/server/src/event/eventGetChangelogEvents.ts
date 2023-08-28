import {
  ErrorType,
  EventType,
  notOk,
  ok,
  type ChangelogEvent,
  type ChangelogEventQuery,
  type Connection,
  type Edge,
  type EntityChangelogEvent,
  type Paging,
  type PromiseResult,
  type Result,
} from '@dossierhq/core';
import type {
  DatabaseAdapter,
  DatabaseEventChangelogEventPayload,
  DatabaseResolvedEntityReference,
  ResolvedAuthKey,
} from '@dossierhq/database-adapter';
import { authResolveAuthorizationKeys, authVerifyAuthorizationKey } from '../Auth.js';
import type { AuthorizationAdapter } from '../AuthorizationAdapter.js';
import type { SessionContext } from '../Context.js';
import { fetchAndDecodeConnection } from '../utils/fetchAndDecodeConnection.js';

export async function eventGetChangelogEvents(
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: ChangelogEventQuery | undefined,
  paging: Paging | undefined,
): PromiseResult<
  Connection<Edge<ChangelogEvent, typeof ErrorType.Generic>> | null,
  typeof ErrorType.BadRequest | typeof ErrorType.NotAuthorized | typeof ErrorType.Generic
> {
  const resolvedAuthKeys: ResolvedAuthKey[] = [];

  const decodeEdge = (changelogEvent: DatabaseEventChangelogEventPayload) =>
    decodeChangelogEvent(resolvedAuthKeys, changelogEvent);

  const entityResult = await getEntityInfoAndAuthorize(
    authorizationAdapter,
    databaseAdapter,
    context,
    query,
  );
  if (entityResult.isError()) return entityResult;

  return fetchAndDecodeConnection(
    paging,
    async (pagingInfo) => {
      const result = await databaseAdapter.eventGetChangelogEvents(
        context,
        query ?? {},
        pagingInfo,
        entityResult.value,
      );
      if (result.isOk()) {
        resolvedAuthKeys.push(
          ...(await resolveAuthKeysForEntityChangelogEvents(
            authorizationAdapter,
            context,
            result.value.edges,
          )),
        );
      }
      return result;
    },
    decodeEdge,
  );
}

export async function getEntityInfoAndAuthorize(
  authorizationAdapter: AuthorizationAdapter,
  databaseAdapter: DatabaseAdapter,
  context: SessionContext,
  query: ChangelogEventQuery | undefined,
): PromiseResult<
  DatabaseResolvedEntityReference | null,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  let entity: DatabaseResolvedEntityReference | null = null;
  if (query?.entity) {
    const entityResult = await databaseAdapter.eventGetChangelogEventsEntityInfo(
      context,
      query.entity,
    );
    if (entityResult.isError()) {
      if (entityResult.isErrorType(ErrorType.NotFound)) {
        return notOk.BadRequest(`entity: Entity ${query.entity.id} is not found`);
      }
      return notOk.Generic(entityResult.message); // cast generic->generic
    }
    entity = { entityInternalId: entityResult.value.entityInternalId };

    const authResult = await authVerifyAuthorizationKey(
      authorizationAdapter,
      context,
      entityResult.value,
    );
    if (authResult.isError()) {
      if (authResult.isErrorType(ErrorType.BadRequest)) {
        return authResult;
      }
      if (authResult.isErrorType(ErrorType.NotAuthorized)) {
        return notOk.BadRequest(`entity: Wrong authKey provided`);
      }
      return notOk.Generic(authResult.message); // cast generic->generic
    }
  }
  return ok(entity);
}

async function resolveAuthKeysForEntityChangelogEvents(
  authorizationAdapter: AuthorizationAdapter,
  context: SessionContext,
  encodedEntities: DatabaseEventChangelogEventPayload[],
): Promise<ResolvedAuthKey[]> {
  const authKeys = new Set<string>();
  for (const changelogEvent of encodedEntities) {
    if ('entities' in changelogEvent) {
      for (const encodedEntity of changelogEvent.entities) {
        authKeys.add(encodedEntity.authKey);
      }
    }
  }

  if (authKeys.size > 0) {
    const resolveResult = await authResolveAuthorizationKeys(authorizationAdapter, context, [
      ...authKeys,
    ]);
    // Ignore errors since we will just treat them as unauthorized
    if (resolveResult.isOk()) {
      return resolveResult.value;
    }
  }
  return [];
}

function decodeChangelogEvent(
  resolvedAuthKeys: ResolvedAuthKey[],
  changelogEvent: DatabaseEventChangelogEventPayload,
): Result<ChangelogEvent, typeof ErrorType.Generic> {
  const { cursor, ...event } = changelogEvent;
  if (event.type === EventType.updateSchema) {
    return ok(event);
  }
  const entities: EntityChangelogEvent['entities'] = [];
  let unauthorizedEntityCount = 0;

  for (const encodedEntity of event.entities) {
    const { id, type, name, version, authKey, resolvedAuthKey } = encodedEntity;
    const matchingKey = resolvedAuthKeys.find(
      (it) => it.authKey === authKey && it.resolvedAuthKey === resolvedAuthKey,
    );
    if (!matchingKey) {
      unauthorizedEntityCount++;
    } else {
      entities.push({ id, type, name, version });
    }
  }

  entities.sort((a, b) => {
    const typeCompare = a.type.localeCompare(b.type);
    if (typeCompare !== 0) return typeCompare;

    return a.name.localeCompare(b.name);
  });

  return ok({ ...event, entities, unauthorizedEntityCount });
}
