import { EntityAdmin, isReferenceFieldType, PublishedEntity } from '@datadata/core';
import type {
  AdminEntity,
  AdminFilter,
  Entity,
  EntityHistory,
  Paging,
  PageInfo,
  SessionContext,
} from '@datadata/core';
import type { GraphQLResolveInfo } from 'graphql';
import type { SessionGraphQLContext } from './GraphQLSchemaGenerator';
import { getSessionContext } from './Utils';

interface Connection<T extends Edge<unknown>> {
  pageInfo: PageInfo;
  edges: T[];
}

type FieldValueOrResolver<TContext, TResult> =
  | TResult
  | Promise<TResult>
  | ((args: unknown, context: TContext, info: GraphQLResolveInfo) => TResult | Promise<TResult>);

interface ConnectionWithTotalCount<T extends Edge<unknown>, TContext> extends Connection<T> {
  totalCount: FieldValueOrResolver<TContext, number>;
}

interface Edge<T> {
  node: T | null;
  cursor: string;
}

export async function loadEntity<TContext extends SessionGraphQLContext>(
  context: TContext,
  id: string
): Promise<Entity> {
  const sessionContext = getSessionContext(context);
  const result = await PublishedEntity.getEntity(sessionContext, id);
  if (result.isError()) {
    throw result.toError();
  }
  return buildResolversForEntity(sessionContext, result.value.item);
}

function buildResolversForEntity<TContext extends SessionGraphQLContext>(
  context: SessionContext,
  entity: Entity
): Entity {
  const entitySpec = context.instance.getSchema().getEntityTypeSpecification(entity._type);
  if (!entitySpec) {
    throw new Error(`Couldn't find entity spec for type: ${entity._name}`);
  }
  const result = { ...entity };
  for (const fieldSpec of entitySpec.fields) {
    const value = result[fieldSpec.name];
    if (isReferenceFieldType(fieldSpec, value) && value) {
      result[fieldSpec.name] = (args: undefined, context: TContext, unusedInfo: unknown) =>
        loadEntity(context, value.id);
    }
  }
  return result;
}

export async function loadAdminEntity<TContext extends SessionGraphQLContext>(
  context: TContext,
  id: string,
  version: number | undefined | null
): Promise<AdminEntity> {
  const sessionContext = getSessionContext(context);
  const result = await EntityAdmin.getEntity(sessionContext, id, { version });
  if (result.isError()) {
    throw result.toError();
  }
  return buildResolversForAdminEntity(sessionContext, result.value.item);
}

export function buildResolversForAdminEntity<TContext extends SessionGraphQLContext>(
  context: SessionContext,
  entity: AdminEntity
): AdminEntity {
  const entitySpec = context.instance.getSchema().getEntityTypeSpecification(entity._type);
  if (!entitySpec) {
    throw new Error(`Couldn't find entity spec for type: ${entity._name}`);
  }
  const result = { ...entity };
  for (const fieldSpec of entitySpec.fields) {
    const value = result[fieldSpec.name];
    if (isReferenceFieldType(fieldSpec, value) && value) {
      result[fieldSpec.name] = (args: undefined, context: TContext, unusedInfo: unknown) =>
        loadAdminEntity(context, value.id, null);
    }
  }
  return result;
}

export async function loadAdminSearchEntities<TContext extends SessionGraphQLContext>(
  context: TContext,
  filter: AdminFilter | undefined,
  paging: Paging
): Promise<ConnectionWithTotalCount<Edge<AdminEntity>, TContext> | null> {
  const sessionContext = getSessionContext(context);
  const result = await EntityAdmin.searchEntities(sessionContext, filter, paging);
  if (result.isError()) {
    throw result.toError();
  }

  if (result.value === null) {
    // No results
    return null;
  }

  return {
    pageInfo: result.value.pageInfo,
    edges: result.value.edges.map((edge) => {
      return {
        cursor: edge.cursor,
        node: edge.node.isOk()
          ? buildResolversForAdminEntity(sessionContext, edge.node.value)
          : null, //TODO throw error if accessed?
      };
    }),
    totalCount: buildTotalCount(filter),
  };
}

function buildTotalCount<TContext extends SessionGraphQLContext>(
  filter: AdminFilter | undefined
): FieldValueOrResolver<TContext, number> {
  return async (args, context, unusedInfo) => {
    const sessionContext = getSessionContext(context);
    const result = await EntityAdmin.getTotalCount(sessionContext, filter);
    if (result.isError()) {
      throw result.toError();
    }
    return result.value;
  };
}

export async function loadVersionHistory<TContext extends SessionGraphQLContext>(
  context: TContext,
  id: string
): Promise<EntityHistory> {
  const sessionContext = getSessionContext(context);
  const result = await EntityAdmin.getEntityHistory(sessionContext, id);
  if (result.isError()) {
    throw result.toError();
  }
  return result.value;
}
