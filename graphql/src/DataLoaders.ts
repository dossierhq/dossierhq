import {
  isEntityTypeField,
  isEntityTypeListField,
  isValueTypeField,
  isValueTypeListField,
} from '@datadata/core';
import type {
  AdminEntity,
  Entity,
  EntityTypeSpecification,
  PageInfo,
  Value,
  ValueTypeSpecification,
} from '@datadata/core';
import type { AdminEntityHistory, AdminQuery, Paging, SessionContext } from '@datadata/server';
import { EntityAdmin, PublishedEntity } from '@datadata/server';
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

export async function loadEntities<TContext extends SessionGraphQLContext>(
  context: TContext,
  ids: string[]
): Promise<Array<Entity | null>> {
  const sessionContext = getSessionContext(context);
  const results = await PublishedEntity.getEntities(sessionContext, ids);
  return results.map((result) => {
    if (result.isOk()) {
      return buildResolversForEntity(sessionContext, result.value);
    }
    // TODO handle errors
    return null;
  });
}

function buildResolversForEntity<TContext extends SessionGraphQLContext>(
  context: SessionContext,
  entity: Entity
): Entity {
  const entitySpec = context.server.getSchema().getEntityTypeSpecification(entity._type);
  if (!entitySpec) {
    throw new Error(`Couldn't find entity spec for type: ${entity._type}`);
  }
  const result = { ...entity };
  resolveFields<TContext>(context, entitySpec, result, false);
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

export async function loadAdminEntities<TContext extends SessionGraphQLContext>(
  context: TContext,
  ids: string[]
): Promise<Array<AdminEntity | null>> {
  const sessionContext = getSessionContext(context);
  const results = await EntityAdmin.getEntities(sessionContext, ids);
  return results.map((result) => {
    if (result.isOk()) {
      return buildResolversForAdminEntity(sessionContext, result.value);
    }
    // TODO handle errors
    return null;
  });
}

export function buildResolversForAdminEntity<TContext extends SessionGraphQLContext>(
  context: SessionContext,
  entity: AdminEntity
): AdminEntity {
  const entitySpec = context.server.getSchema().getEntityTypeSpecification(entity._type);
  if (!entitySpec) {
    throw new Error(`Couldn't find entity spec for type: ${entity._type}`);
  }
  const result = { ...entity };

  // _deleted is optional in AdminEntity, but not in GraphQL, so derive value
  result._deleted = entity._deleted === true;

  resolveFields<TContext>(context, entitySpec, result, true);

  return result;
}

export async function loadAdminSearchEntities<TContext extends SessionGraphQLContext>(
  context: TContext,
  query: AdminQuery | undefined,
  paging: Paging
): Promise<ConnectionWithTotalCount<Edge<AdminEntity>, TContext> | null> {
  const sessionContext = getSessionContext(context);
  const result = await EntityAdmin.searchEntities(sessionContext, query, paging);
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
    totalCount: buildTotalCount(query),
  };
}

function resolveFields<TContext extends SessionGraphQLContext>(
  context: SessionContext,
  spec: EntityTypeSpecification | ValueTypeSpecification,
  item: Value | Entity | AdminEntity,
  isAdmin: boolean
) {
  for (const fieldSpec of spec.fields) {
    const value = item[fieldSpec.name];
    if (isEntityTypeField(fieldSpec, value) && value) {
      item[fieldSpec.name] = (args: undefined, context: TContext, unusedInfo: unknown) =>
        isAdmin ? loadAdminEntity(context, value.id, null) : loadEntity(context, value.id);
    } else if (isEntityTypeListField(fieldSpec, value) && value && value.length > 0) {
      item[fieldSpec.name] = (args: undefined, context: TContext, unusedInfo: unknown) => {
        const ids = value.map((x) => x.id);
        return isAdmin ? loadAdminEntities(context, ids) : loadEntities(context, ids);
      };
    } else if (isValueTypeField(fieldSpec, value) && value) {
      item[fieldSpec.name] = buildResolversForValue(context, value, isAdmin);
    } else if (isValueTypeListField(fieldSpec, value) && value && value.length > 0) {
      item[fieldSpec.name] = value.map((x) => buildResolversForValue(context, x, isAdmin));
    }
  }
}

export function buildResolversForValue<TContext extends SessionGraphQLContext>(
  context: SessionContext,
  valueItem: Value,
  isAdmin: boolean
): Value {
  const valueSpec = context.server.getSchema().getValueTypeSpecification(valueItem._type);
  if (!valueSpec) {
    throw new Error(`Couldn't find value spec for type: ${valueItem._type}`);
  }
  const result = { ...valueItem };
  resolveFields<TContext>(context, valueSpec, result, isAdmin);
  return result;
}

function buildTotalCount<TContext extends SessionGraphQLContext>(
  query: AdminQuery | undefined
): FieldValueOrResolver<TContext, number> {
  return async (args, context, unusedInfo) => {
    const sessionContext = getSessionContext(context);
    const result = await EntityAdmin.getTotalCount(sessionContext, query);
    if (result.isError()) {
      throw result.toError();
    }
    return result.value;
  };
}

export async function loadVersionHistory<TContext extends SessionGraphQLContext>(
  context: TContext,
  id: string
): Promise<AdminEntityHistory> {
  const sessionContext = getSessionContext(context);
  const result = await EntityAdmin.getEntityHistory(sessionContext, id);
  if (result.isError()) {
    throw result.toError();
  }
  return result.value;
}
