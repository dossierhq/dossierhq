import type {
  AdminClient,
  AdminEntity,
  AdminEntityTypeSpecification,
  AdminFieldSpecification,
  AdminQuery,
  AdminSchema,
  AdminSearchQuery,
  AdminValueTypeSpecification,
  EntityHistory,
  EntityReference,
  EntitySamplingOptions,
  EntitySamplingPayload,
  EntityVersionReference,
  ItemTraverseNode,
  PageInfo,
  Paging,
  PublishedClient,
  PublishedEntity,
  PublishedEntityTypeSpecification,
  PublishedFieldSpecification,
  PublishedQuery,
  PublishedSchema,
  PublishedSearchQuery,
  PublishedValueTypeSpecification,
  PublishingHistory,
  RichText,
  UniqueIndexReference,
  ValueItem,
} from '@jonasb/datadata-core';
import {
  isEntityField,
  isEntityItemField,
  isEntityListField,
  isItemValueItem,
  isRichTextEntityLinkNode,
  isRichTextEntityNode,
  isRichTextField,
  isValueItemField,
  isValueItemListField,
  ItemTraverseNodeType,
  traverseItemField,
} from '@jonasb/datadata-core';
import type { GraphQLResolveInfo } from 'graphql';
import type { SessionGraphQLContext } from './GraphQLSchemaGenerator.js';

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

export async function loadPublishedEntity<TContext extends SessionGraphQLContext>(
  schema: PublishedSchema,
  context: TContext,
  reference: EntityReference | UniqueIndexReference
): Promise<PublishedEntity> {
  const publishedClient = context.publishedClient.valueOrThrow() as PublishedClient;
  const result = await publishedClient.getEntity(reference);
  return buildResolversForPublishedEntity(schema, result.valueOrThrow());
}

export async function loadPublishedEntities<TContext extends SessionGraphQLContext>(
  schema: PublishedSchema,
  context: TContext,
  ids: string[]
): Promise<Array<PublishedEntity | null>> {
  const publishedClient = context.publishedClient.valueOrThrow() as PublishedClient;
  const results = await publishedClient.getEntities(ids.map((id) => ({ id })));
  if (results.isError()) {
    throw results.toError();
  }
  return results.value.map((result) => {
    if (result.isOk()) {
      return buildResolversForPublishedEntity(schema, result.value);
    }
    // TODO handle errors
    return null;
  });
}

export async function loadPublishedSampleEntities<TContext extends SessionGraphQLContext>(
  schema: PublishedSchema,
  context: TContext,
  query: PublishedQuery | undefined,
  options: EntitySamplingOptions | undefined
): Promise<EntitySamplingPayload<PublishedEntity>> {
  const publishedClient = context.publishedClient.valueOrThrow() as PublishedClient;
  const result = await publishedClient.sampleEntities(query, options);
  if (result.isError()) {
    throw result.toError();
  }

  return {
    ...result.value,
    items: result.value.items.map((it) => buildResolversForPublishedEntity(schema, it)),
  };
}

export async function loadSearchEntities<TContext extends SessionGraphQLContext>(
  schema: PublishedSchema,
  context: TContext,
  query: PublishedSearchQuery | undefined,
  paging: Paging
): Promise<ConnectionWithTotalCount<Edge<PublishedEntity>, TContext> | null> {
  const publishedClient = context.publishedClient.valueOrThrow() as PublishedClient;
  const result = await publishedClient.searchEntities(query, paging);
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
        node: edge.node.isOk() ? buildResolversForPublishedEntity(schema, edge.node.value) : null, //TODO throw error if accessed?
      };
    }),
    totalCount: buildTotalCount(query),
  };
}

function buildTotalCount<TContext extends SessionGraphQLContext>(
  query: PublishedQuery | undefined
): FieldValueOrResolver<TContext, number> {
  return async (_args, context, _info) => {
    const publishedClient = context.publishedClient.valueOrThrow();
    const result = await publishedClient.getTotalCount(query);
    return result.valueOrThrow();
  };
}

function buildResolversForPublishedEntity<TContext extends SessionGraphQLContext>(
  schema: PublishedSchema,
  entity: PublishedEntity
): PublishedEntity {
  const entitySpec = schema.getEntityTypeSpecification(entity.info.type);
  if (!entitySpec) {
    throw new Error(`Couldn't find entity spec for type: ${entity.info.type}`);
  }
  const result = { ...entity };
  resolveFields<TContext>(schema, entitySpec, result, false);
  return result;
}

export async function loadAdminEntity<TContext extends SessionGraphQLContext>(
  schema: AdminSchema,
  context: TContext,
  reference: EntityReference | EntityVersionReference | UniqueIndexReference
): Promise<AdminEntity> {
  const adminClient = context.adminClient.valueOrThrow() as AdminClient;
  const result = await adminClient.getEntity(reference);
  return buildResolversForAdminEntity(schema, result.valueOrThrow());
}

export async function loadAdminEntities<TContext extends SessionGraphQLContext>(
  schema: AdminSchema,
  context: TContext,
  ids: string[]
): Promise<Array<AdminEntity | null>> {
  const adminClient = context.adminClient.valueOrThrow() as AdminClient;
  const results = await adminClient.getEntities(ids.map((id) => ({ id })));
  return results.valueOrThrow().map((result) => {
    if (result.isOk()) {
      return buildResolversForAdminEntity(schema, result.value);
    }
    // TODO handle errors
    return null;
  });
}

export function buildResolversForAdminEntity<TContext extends SessionGraphQLContext>(
  schema: AdminSchema,
  entity: AdminEntity
): AdminEntity {
  const entitySpec = schema.getEntityTypeSpecification(entity.info.type);
  if (!entitySpec) {
    throw new Error(`Couldn't find entity spec for type: ${entity.info.type}`);
  }
  const result = { ...entity };

  resolveFields<TContext>(schema, entitySpec, result, true);

  return result;
}

export async function loadAdminSampleEntities<TContext extends SessionGraphQLContext>(
  schema: AdminSchema,
  context: TContext,
  query: AdminQuery | undefined,
  options: EntitySamplingOptions | undefined
): Promise<EntitySamplingPayload<AdminEntity>> {
  const adminClient = context.adminClient.valueOrThrow() as AdminClient;
  const result = await adminClient.sampleEntities(query, options);
  const payload = result.valueOrThrow();

  return {
    ...payload,
    items: payload.items.map((it) => buildResolversForAdminEntity(schema, it)),
  };
}

export async function loadAdminSearchEntities<TContext extends SessionGraphQLContext>(
  schema: AdminSchema,
  context: TContext,
  query: AdminSearchQuery | undefined,
  paging: Paging
): Promise<ConnectionWithTotalCount<Edge<AdminEntity>, TContext> | null> {
  const adminClient = context.adminClient.valueOrThrow() as AdminClient;
  const result = await adminClient.searchEntities(query, paging);
  const connection = result.valueOrThrow();

  if (connection === null) {
    // No results
    return null;
  }

  return {
    pageInfo: connection.pageInfo,
    edges: connection.edges.map((edge) => {
      return {
        cursor: edge.cursor,
        node: edge.node.isOk() ? buildResolversForAdminEntity(schema, edge.node.value) : null, //TODO throw error if accessed?
      };
    }),
    totalCount: buildAdminTotalCount(query),
  };
}

function resolveFields<TContext extends SessionGraphQLContext>(
  schema: AdminSchema | PublishedSchema,
  spec:
    | AdminEntityTypeSpecification
    | PublishedEntityTypeSpecification
    | AdminValueTypeSpecification
    | PublishedValueTypeSpecification,
  item: ValueItem | PublishedEntity | AdminEntity,
  isAdmin: boolean
) {
  const fields = isItemValueItem(item) ? item : item.fields;
  for (const fieldSpec of spec.fields) {
    const value = fields[fieldSpec.name];
    if (isRichTextField(fieldSpec, value) && value) {
      const ids = extractEntityIdsForRichTextField(schema, fieldSpec, value);
      fields[fieldSpec.name] = {
        root: value.root,
        entities:
          ids.length === 0
            ? []
            : (_args: undefined, context: TContext, _info: unknown) => {
                return isAdmin
                  ? loadAdminEntities(schema as AdminSchema, context, ids)
                  : loadPublishedEntities(schema, context, ids);
              },
      };
    } else if (isEntityField(fieldSpec, value) && value) {
      fields[fieldSpec.name] = (_args: undefined, context: TContext, _info: unknown) =>
        isAdmin
          ? loadAdminEntity(schema as AdminSchema, context, value)
          : loadPublishedEntity(schema, context, value);
    } else if (isEntityListField(fieldSpec, value) && value && value.length > 0) {
      fields[fieldSpec.name] = (_args: undefined, context: TContext, _info: unknown) => {
        const ids = value.map((x) => x.id);
        return isAdmin
          ? loadAdminEntities(schema as AdminSchema, context, ids)
          : loadPublishedEntities(schema, context, ids);
      };
    } else if (isValueItemField(fieldSpec, value) && value) {
      fields[fieldSpec.name] = buildResolversForValue(schema, value, isAdmin);
    } else if (isValueItemListField(fieldSpec, value) && value && value.length > 0) {
      fields[fieldSpec.name] = value.map((x) => buildResolversForValue(schema, x, isAdmin));
    }
  }
}

function extractEntityIdsForRichTextField(
  schema: AdminSchema | PublishedSchema,
  fieldSpec: AdminFieldSpecification | PublishedFieldSpecification,
  value: RichText
) {
  const referencesCollector = createReferencesCollector();
  for (const node of traverseItemField(schema, [fieldSpec.name], fieldSpec, value)) {
    referencesCollector.collect(node);
  }
  return referencesCollector.result;
}

//TODO we have two identical (three similar) implementations of this function, should it move to core?
function createReferencesCollector<TSchema extends AdminSchema | PublishedSchema>() {
  const references = new Set<string>();
  return {
    collect: (node: ItemTraverseNode<TSchema>) => {
      switch (node.type) {
        case ItemTraverseNodeType.fieldItem:
          if (isEntityItemField(node.fieldSpec, node.value) && node.value) {
            references.add(node.value.id);
          }
          break;
        case ItemTraverseNodeType.richTextNode: {
          const richTextNode = node.node;
          if (isRichTextEntityNode(richTextNode) || isRichTextEntityLinkNode(richTextNode)) {
            references.add(richTextNode.reference.id);
          }
          break;
        }
      }
    },
    get result(): string[] {
      return [...references];
    },
  };
}

export function buildResolversForValue<TContext extends SessionGraphQLContext>(
  schema: AdminSchema | PublishedSchema,
  valueItem: ValueItem,
  isAdmin: boolean
): ValueItem {
  const valueSpec = schema.getValueTypeSpecification(valueItem.type);
  if (!valueSpec) {
    throw new Error(`Couldn't find value spec for type: ${valueItem.type}`);
  }
  const result = { ...valueItem };
  resolveFields<TContext>(schema, valueSpec, result, isAdmin);
  return result;
}

function buildAdminTotalCount<TContext extends SessionGraphQLContext>(
  query: AdminQuery | undefined
): FieldValueOrResolver<TContext, number> {
  return async (_args, context, _info) => {
    const adminClient = context.adminClient.valueOrThrow();
    const result = await adminClient.getTotalCount(query);
    return result.valueOrThrow();
  };
}

export async function loadVersionHistory<TContext extends SessionGraphQLContext>(
  context: TContext,
  reference: EntityReference
): Promise<EntityHistory> {
  const adminClient = context.adminClient.valueOrThrow();
  const result = await adminClient.getEntityHistory(reference);
  return result.valueOrThrow();
}

export async function loadPublishingHistory<TContext extends SessionGraphQLContext>(
  context: TContext,
  reference: EntityReference
): Promise<PublishingHistory> {
  const adminClient = context.adminClient.valueOrThrow();
  const result = await adminClient.getPublishingHistory(reference);
  return result.valueOrThrow();
}
