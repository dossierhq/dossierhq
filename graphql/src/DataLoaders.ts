import {
  EntityAdmin,
  isEntityTypeField,
  isEntityTypeListField,
  isValueTypeField,
  isValueTypeListField,
  PublishedEntity,
} from '@datadata/core';
import type {
  AdminEntity,
  AdminEntityHistory,
  AdminQuery,
  Entity,
  PageInfo,
  Paging,
  SessionContext,
  Value,
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

async function loadEntities<TContext extends SessionGraphQLContext>(
  context: TContext,
  ids: string[]
): Promise<Array<Entity | null>> {
  const sessionContext = getSessionContext(context);
  // TODO add PublishedEntity.getEntities
  const results = await Promise.all(ids.map((id) => PublishedEntity.getEntity(sessionContext, id)));
  return results.map((result) => {
    if (result.isOk()) {
      return buildResolversForEntity(sessionContext, result.value.item);
    } else {
      // TODO handle errors
      return null;
    }
  });
}

function buildResolversForEntity<TContext extends SessionGraphQLContext>(
  context: SessionContext,
  entity: Entity
): Entity {
  const entitySpec = context.instance.getSchema().getEntityTypeSpecification(entity._type);
  if (!entitySpec) {
    throw new Error(`Couldn't find entity spec for type: ${entity._type}`);
  }
  const result = { ...entity };
  for (const fieldSpec of entitySpec.fields) {
    const value = result[fieldSpec.name];
    if (isEntityTypeField(fieldSpec, value) && value) {
      result[fieldSpec.name] = (args: undefined, context: TContext, unusedInfo: unknown) =>
        loadEntity(context, value.id);
    } else if (isEntityTypeListField(fieldSpec, value) && value && value.length > 0) {
      result[fieldSpec.name] = (args: undefined, context: TContext, unusedInfo: unknown) =>
        loadEntities(
          context,
          value.map((x) => x.id)
        );
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

async function loadAdminEntities<TContext extends SessionGraphQLContext>(
  context: TContext,
  ids: string[]
): Promise<Array<AdminEntity | null>> {
  const sessionContext = getSessionContext(context);
  // TODO add EntityAdmin.getEntities
  const results = await Promise.all(ids.map((id) => EntityAdmin.getEntity(sessionContext, id, {})));
  return results.map((result) => {
    if (result.isOk()) {
      return buildResolversForAdminEntity(sessionContext, result.value.item);
    } else {
      // TODO handle errors
      return null;
    }
  });
}

export function buildResolversForAdminEntity<TContext extends SessionGraphQLContext>(
  context: SessionContext,
  entity: AdminEntity
): AdminEntity {
  const entitySpec = context.instance.getSchema().getEntityTypeSpecification(entity._type);
  if (!entitySpec) {
    throw new Error(`Couldn't find entity spec for type: ${entity._type}`);
  }
  const result = { ...entity };

  // _deleted is optional in AdminEntity, but not in GraphQL, so derive value
  result._deleted = entity._deleted === true;

  for (const fieldSpec of entitySpec.fields) {
    const value = result[fieldSpec.name];
    if (isEntityTypeField(fieldSpec, value) && value) {
      result[fieldSpec.name] = (args: undefined, context: TContext, unusedInfo: unknown) =>
        loadAdminEntity(context, value.id, null);
    } else if (isEntityTypeListField(fieldSpec, value) && value && value.length > 0) {
      result[fieldSpec.name] = (args: undefined, context: TContext, unusedInfo: unknown) =>
        loadAdminEntities(
          context,
          value.map((x) => x.id)
        );
    } else if (isValueTypeField(fieldSpec, value) && value) {
      result[fieldSpec.name] = buildResolversForAdminValue(context, value);
    } else if (isValueTypeListField(fieldSpec, value) && value && value.length > 0) {
      result[fieldSpec.name] = value.map((x) => buildResolversForAdminValue(context, x));
    }
  }
  return result;
}

export function buildResolversForAdminValue<TContext extends SessionGraphQLContext>(
  context: SessionContext,
  valueItem: Value
): Value {
  const valueSpec = context.instance.getSchema().getValueTypeSpecification(valueItem._type);
  if (!valueSpec) {
    throw new Error(`Couldn't find value spec for type: ${valueItem._type}`);
  }
  const result = { ...valueItem };

  for (const fieldSpec of valueSpec.fields) {
    const value = result[fieldSpec.name];
    if (isEntityTypeField(fieldSpec, value) && value) {
      result[fieldSpec.name] = (args: undefined, context: TContext, unusedInfo: unknown) =>
        loadAdminEntity(context, value.id, null);
    } else if (isEntityTypeListField(fieldSpec, value) && value && value.length > 0) {
      result[fieldSpec.name] = (args: undefined, context: TContext, unusedInfo: unknown) =>
        loadAdminEntities(
          context,
          value.map((x) => x.id)
        );
    } else if (isValueTypeField(fieldSpec, value) && value) {
      result[fieldSpec.name] = buildResolversForAdminValue(context, value);
    } else if (isValueTypeListField(fieldSpec, value) && value && value.length > 0) {
      result[fieldSpec.name] = value.map((x) => buildResolversForAdminValue(context, x));
    }
  }
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
