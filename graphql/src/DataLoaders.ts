import {
  isEntityTypeField,
  isEntityTypeListField,
  isRichTextEntityBlock,
  isRichTextField,
  isValueTypeField,
  isValueTypeListField,
  visitFieldRecursively,
} from '@datadata/core';
import type {
  AdminEntity,
  AdminEntityHistory,
  AdminQuery,
  Entity,
  EntityTypeSpecification,
  FieldSpecification,
  PageInfo,
  Paging,
  PublishHistory,
  RichText,
  ValueItem,
  ValueTypeSpecification,
} from '@datadata/core';
import type { SessionContext } from '@datadata/server';
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
  return buildResolversForEntity(sessionContext, result.value);
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
  const result = await EntityAdmin.getEntity(sessionContext, id, version);
  if (result.isError()) {
    throw result.toError();
  }
  return buildResolversForAdminEntity(sessionContext, result.value);
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
  item: ValueItem | Entity | AdminEntity,
  isAdmin: boolean
) {
  for (const fieldSpec of spec.fields) {
    const value = item[fieldSpec.name];
    if (isRichTextField(fieldSpec, value) && value) {
      const ids = extractEntityIdsForRichTextField(context, fieldSpec, value);
      item[fieldSpec.name] = {
        blocksJson: JSON.stringify(value.blocks),
        entities:
          ids.length === 0
            ? []
            : (_args: undefined, context: TContext, _info: unknown) => {
                return isAdmin ? loadAdminEntities(context, ids) : loadEntities(context, ids);
              },
      };
    } else if (isEntityTypeField(fieldSpec, value) && value) {
      item[fieldSpec.name] = (_args: undefined, context: TContext, _info: unknown) =>
        isAdmin ? loadAdminEntity(context, value.id, null) : loadEntity(context, value.id);
    } else if (isEntityTypeListField(fieldSpec, value) && value && value.length > 0) {
      item[fieldSpec.name] = (_args: undefined, context: TContext, _info: unknown) => {
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

function extractEntityIdsForRichTextField(
  context: SessionContext,
  fieldSpec: FieldSpecification,
  value: RichText
) {
  const entityIds = new Set<string>();
  visitFieldRecursively({
    schema: context.server.getSchema(),
    fieldSpec,
    value,
    visitField: (_path, fieldSpec, data, _visitContext) => {
      if (isEntityTypeField(fieldSpec, data) && data) {
        entityIds.add(data.id);
      }
    },
    visitRichTextBlock: (_path, _fieldSpec, block, _visitContext) => {
      if (isRichTextEntityBlock(block) && block.data) {
        entityIds.add(block.data.id);
      }
    },
    visitContext: undefined,
  });
  return [...entityIds];
}

export function buildResolversForValue<TContext extends SessionGraphQLContext>(
  context: SessionContext,
  valueItem: ValueItem,
  isAdmin: boolean
): ValueItem {
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
  return async (args, context, _info) => {
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

export async function loadPublishHistory<TContext extends SessionGraphQLContext>(
  context: TContext,
  id: string
): Promise<PublishHistory> {
  const sessionContext = getSessionContext(context);
  const result = await EntityAdmin.getPublishHistory(sessionContext, id);
  if (result.isError()) {
    throw result.toError();
  }
  return result.value;
}
