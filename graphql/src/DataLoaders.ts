import {
  isEntityTypeField,
  isEntityTypeListField,
  isItemValueItem,
  isRichTextEntityBlock,
  isRichTextField,
  isValueTypeField,
  isValueTypeListField,
  visitFieldRecursively,
} from '@datadata/core';
import type {
  AdminEntity2,
  AdminQuery,
  Entity,
  EntityHistory,
  EntityTypeSpecification,
  FieldSpecification,
  PageInfo,
  Paging,
  PublishingHistory,
  RichText,
  Schema,
  ValueItem,
  ValueTypeSpecification,
} from '@datadata/core';
import type { GraphQLResolveInfo } from 'graphql';
import type { SessionGraphQLContext } from './GraphQLSchemaGenerator';
import { getAdminClient, getPublishedClient, getSchema } from './Utils';

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
  const schema = getSchema(context);
  const publishedClient = getPublishedClient(context);
  const result = await publishedClient.getEntity({ id });
  if (result.isError()) {
    throw result.toError();
  }
  return buildResolversForEntity(schema, result.value);
}

export async function loadEntities<TContext extends SessionGraphQLContext>(
  context: TContext,
  ids: string[]
): Promise<Array<Entity | null>> {
  const schema = getSchema(context);
  const publishedClient = getPublishedClient(context);
  const results = await publishedClient.getEntities(ids.map((id) => ({ id })));
  return results.map((result) => {
    if (result.isOk()) {
      return buildResolversForEntity(schema, result.value);
    }
    // TODO handle errors
    return null;
  });
}

function buildResolversForEntity<TContext extends SessionGraphQLContext>(
  schema: Schema,
  entity: Entity
): Entity {
  const entitySpec = schema.getEntityTypeSpecification(entity.info.type);
  if (!entitySpec) {
    throw new Error(`Couldn't find entity spec for type: ${entity.info.type}`);
  }
  const result = { ...entity };
  resolveFields<TContext>(schema, entitySpec, result, false);
  return result;
}

export async function loadAdminEntity<TContext extends SessionGraphQLContext>(
  context: TContext,
  id: string,
  version: number | undefined | null
): Promise<AdminEntity2> {
  const schema = getSchema(context);
  const adminClient = getAdminClient(context);
  const result = await adminClient.getEntity(
    typeof version === 'number' ? { id, version } : { id }
  );
  if (result.isError()) {
    throw result.toError();
  }
  return buildResolversForAdminEntity(schema, result.value);
}

export async function loadAdminEntities<TContext extends SessionGraphQLContext>(
  context: TContext,
  ids: string[]
): Promise<Array<AdminEntity2 | null>> {
  const schema = getSchema(context);
  const adminClient = getAdminClient(context);
  const results = await adminClient.getEntities(ids.map((id) => ({ id })));
  return results.map((result) => {
    if (result.isOk()) {
      return buildResolversForAdminEntity(schema, result.value);
    }
    // TODO handle errors
    return null;
  });
}

export function buildResolversForAdminEntity<TContext extends SessionGraphQLContext>(
  schema: Schema,
  entity: AdminEntity2
): AdminEntity2 {
  const entitySpec = schema.getEntityTypeSpecification(entity.info.type);
  if (!entitySpec) {
    throw new Error(`Couldn't find entity spec for type: ${entity.info.type}`);
  }
  const result = { ...entity };

  resolveFields<TContext>(schema, entitySpec, result, true);

  return result;
}

export async function loadAdminSearchEntities<TContext extends SessionGraphQLContext>(
  context: TContext,
  query: AdminQuery | undefined,
  paging: Paging
): Promise<ConnectionWithTotalCount<Edge<AdminEntity2>, TContext> | null> {
  const schema = getSchema(context);
  const adminClient = getAdminClient(context);
  const result = await adminClient.searchEntities(query, paging);
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
        node: edge.node.isOk() ? buildResolversForAdminEntity(schema, edge.node.value) : null, //TODO throw error if accessed?
      };
    }),
    totalCount: buildTotalCount(query),
  };
}

function resolveFields<TContext extends SessionGraphQLContext>(
  schema: Schema,
  spec: EntityTypeSpecification | ValueTypeSpecification,
  item: ValueItem | Entity | AdminEntity2,
  isAdmin: boolean
) {
  const fields = isItemValueItem(item) ? item : item.fields;
  for (const fieldSpec of spec.fields) {
    const value = fields[fieldSpec.name];
    if (isRichTextField(fieldSpec, value) && value) {
      const ids = extractEntityIdsForRichTextField(schema, fieldSpec, value);
      fields[fieldSpec.name] = {
        blocksJson: JSON.stringify(value.blocks),
        entities:
          ids.length === 0
            ? []
            : (_args: undefined, context: TContext, _info: unknown) => {
                return isAdmin ? loadAdminEntities(context, ids) : loadEntities(context, ids);
              },
      };
    } else if (isEntityTypeField(fieldSpec, value) && value) {
      fields[fieldSpec.name] = (_args: undefined, context: TContext, _info: unknown) =>
        isAdmin ? loadAdminEntity(context, value.id, null) : loadEntity(context, value.id);
    } else if (isEntityTypeListField(fieldSpec, value) && value && value.length > 0) {
      fields[fieldSpec.name] = (_args: undefined, context: TContext, _info: unknown) => {
        const ids = value.map((x) => x.id);
        return isAdmin ? loadAdminEntities(context, ids) : loadEntities(context, ids);
      };
    } else if (isValueTypeField(fieldSpec, value) && value) {
      fields[fieldSpec.name] = buildResolversForValue(schema, value, isAdmin);
    } else if (isValueTypeListField(fieldSpec, value) && value && value.length > 0) {
      fields[fieldSpec.name] = value.map((x) => buildResolversForValue(schema, x, isAdmin));
    }
  }
}

function extractEntityIdsForRichTextField(
  schema: Schema,
  fieldSpec: FieldSpecification,
  value: RichText
) {
  const entityIds = new Set<string>();
  visitFieldRecursively({
    schema,
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
  schema: Schema,
  valueItem: ValueItem,
  isAdmin: boolean
): ValueItem {
  const valueSpec = schema.getValueTypeSpecification(valueItem._type);
  if (!valueSpec) {
    throw new Error(`Couldn't find value spec for type: ${valueItem._type}`);
  }
  const result = { ...valueItem };
  resolveFields<TContext>(schema, valueSpec, result, isAdmin);
  return result;
}

function buildTotalCount<TContext extends SessionGraphQLContext>(
  query: AdminQuery | undefined
): FieldValueOrResolver<TContext, number> {
  return async (args, context, _info) => {
    const adminClient = getAdminClient(context);
    const result = await adminClient.getTotalCount(query);
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
  const adminClient = getAdminClient(context);
  const result = await adminClient.getEntityHistory({ id });
  if (result.isError()) {
    throw result.toError();
  }
  return result.value;
}

export async function loadPublishingHistory<TContext extends SessionGraphQLContext>(
  context: TContext,
  id: string
): Promise<PublishingHistory> {
  const adminClient = getAdminClient(context);
  const result = await adminClient.getPublishingHistory({ id });
  if (result.isError()) {
    throw result.toError();
  }
  return result.value;
}
