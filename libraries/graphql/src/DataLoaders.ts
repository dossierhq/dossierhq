import type {
  AdminClient,
  AdminComponentTypeSpecification,
  AdminEntity,
  AdminEntityQuery,
  AdminEntitySharedQuery,
  AdminEntityTypeSpecification,
  AdminFieldSpecification,
  AdminSchema,
  ChangelogEvent,
  ChangelogEventQuery,
  Component,
  ContentTraverseNode,
  Connection as CoreConnection,
  Edge as CoreEdge,
  EntityReference,
  EntitySamplingOptions,
  EntitySamplingPayload,
  EntityVersionReference,
  ErrorResult,
  ErrorType,
  PageInfo,
  Paging,
  PromiseResult,
  PublishedClient,
  PublishedComponentTypeSpecification,
  PublishedEntity,
  PublishedEntityQuery,
  PublishedEntitySharedQuery,
  PublishedEntityTypeSpecification,
  PublishedFieldSpecification,
  PublishedSchema,
  RichText,
  UniqueIndexReference,
} from '@dossierhq/core';
import {
  ContentTraverseNodeType,
  isComponent,
  isComponentListField,
  isComponentSingleField,
  isEntityItemField,
  isEntityListField,
  isEntitySingleField,
  isRichTextEntityLinkNode,
  isRichTextEntityNode,
  isRichTextSingleField,
  traverseContentField,
} from '@dossierhq/core';
import type { GraphQLResolveInfo } from 'graphql';
import type { SessionGraphQLContext } from './GraphQLSchemaGenerator.js';
import { getRequestedChildFields } from './utils/getRequestedChildFields.js';

interface Connection<TContext, T extends Edge<TContext, unknown>> {
  pageInfo?: PageInfo;
  edges?: T[];
}

type FieldValueOrResolver<TContext, TPayload, TArgs = unknown> =
  | TPayload
  | Error
  | Promise<TPayload>
  | ((args: TArgs, context: TContext, info: GraphQLResolveInfo) => TPayload | Promise<TPayload>);

interface ConnectionWithTotalCount<T extends Edge<TContext, unknown>, TContext>
  extends Connection<TContext, T> {
  totalCount?: FieldValueOrResolver<TContext, number> | null;
}

interface Edge<TContext, T> {
  node: FieldValueOrResolver<TContext, T | null>;
  cursor: string;
}

type AdminEntityPayload<TContext> = AdminEntity & {
  changelogEvents: FieldValueOrResolver<
    TContext,
    Connection<TContext, Edge<TContext, ChangelogEvent>> | null,
    {
      query?: ChangelogEventQuery;
      first?: number;
      after?: string;
      last?: number;
      before?: string;
    }
  >;
};

export async function loadPublishedEntity<TContext extends SessionGraphQLContext>(
  schema: PublishedSchema,
  context: TContext,
  reference: EntityReference | UniqueIndexReference,
): Promise<PublishedEntity> {
  const publishedClient = context.publishedClient.valueOrThrow() as PublishedClient;
  const result = await publishedClient.getEntity(reference);
  return buildResolversForPublishedEntity(schema, result.valueOrThrow());
}

export async function loadPublishedEntityList<TContext extends SessionGraphQLContext>(
  schema: PublishedSchema,
  context: TContext,
  ids: string[],
): Promise<FieldValueOrResolver<TContext, PublishedEntity | null>[]> {
  const publishedClient = context.publishedClient.valueOrThrow() as PublishedClient;
  const results = await publishedClient.getEntityList(ids.map((id) => ({ id })));
  return results
    .valueOrThrow()
    .map((result) =>
      result.isOk()
        ? buildResolversForPublishedEntity(schema, result.value)
        : buildErrorResolver(result),
    );
}

function buildErrorResolver(result: ErrorResult<unknown, ErrorType>) {
  return result.toError();
}

export async function loadPublishedEntitiesSample<TContext extends SessionGraphQLContext>(
  schema: PublishedSchema,
  context: TContext,
  query: PublishedEntitySharedQuery | undefined,
  options: EntitySamplingOptions | undefined,
): Promise<EntitySamplingPayload<PublishedEntity>> {
  const publishedClient = context.publishedClient.valueOrThrow() as PublishedClient;
  const result = await publishedClient.getEntitiesSample(query, options);
  if (result.isError()) {
    throw result.toError();
  }

  return {
    ...result.value,
    items: result.value.items.map((it) => buildResolversForPublishedEntity(schema, it)),
  };
}

export async function loadPublishedEntities<TContext extends SessionGraphQLContext>(
  schema: PublishedSchema,
  context: TContext,
  query: PublishedEntityQuery | undefined,
  paging: Paging,
  info: GraphQLResolveInfo,
): Promise<ConnectionWithTotalCount<Edge<TContext, PublishedEntity>, TContext> | null> {
  const publishedClient = context.publishedClient.valueOrThrow() as PublishedClient;
  return buildResolversForConnection<TContext, PublishedEntity>(
    () => publishedClient.getEntities(query, paging),
    () => publishedClient.getEntitiesTotalCount(query),
    (it) => buildResolversForPublishedEntity(schema, it),
    info,
  );
}

function buildResolversForPublishedEntity<TContext extends SessionGraphQLContext>(
  schema: PublishedSchema,
  entity: PublishedEntity,
): PublishedEntity {
  const entitySpec = schema.getEntityTypeSpecification(entity.info.type);
  if (!entitySpec) {
    throw new Error(`Couldn't find entity spec for type: ${entity.info.type}`);
  }
  const result = { ...entity };
  resolveFields<TContext>(schema, entitySpec, result, false);
  return result;
}

async function buildResolversForConnection<TContext extends SessionGraphQLContext, TNode>(
  connectionLoader: () => PromiseResult<
    CoreConnection<CoreEdge<TNode, ErrorType>> | null,
    ErrorType
  >,
  totalCountLoader: () => PromiseResult<number, ErrorType>,
  nodeResolver: (node: TNode) => TNode,
  info: GraphQLResolveInfo,
): Promise<ConnectionWithTotalCount<Edge<TContext, TNode>, TContext> | null> {
  const requestedFields = getRequestedChildFields(info);

  const loadConnection = requestedFields.has('edges') || requestedFields.has('pageInfo');
  const loadTotalCount = requestedFields.has('totalCount');

  // Load in parallel, only load what's needed
  const [connection, totalCount] = await Promise.all([
    loadConnection ? connectionLoader().then((it) => it.valueOrThrow()) : null,
    loadTotalCount ? totalCountLoader().then((it) => it.valueOrThrow()) : null,
  ]);

  if (loadConnection && connection === null) {
    // No results
    return null;
  }
  return {
    pageInfo: connection?.pageInfo,
    edges: connection?.edges.map((edge) => ({
      cursor: edge.cursor,
      node: edge.node.isOk() ? nodeResolver(edge.node.value) : buildErrorResolver(edge.node),
    })),
    totalCount,
  };
}

export async function loadAdminEntity<TContext extends SessionGraphQLContext>(
  schema: AdminSchema,
  context: TContext,
  reference: EntityReference | EntityVersionReference | UniqueIndexReference,
): Promise<AdminEntity> {
  const adminClient = context.adminClient.valueOrThrow() as AdminClient;
  const result = await adminClient.getEntity(reference);
  return buildResolversForAdminEntity(schema, result.valueOrThrow());
}

export async function loadAdminEntityList<TContext extends SessionGraphQLContext>(
  schema: AdminSchema,
  context: TContext,
  ids: string[],
): Promise<FieldValueOrResolver<TContext, AdminEntity | null>[]> {
  const adminClient = context.adminClient.valueOrThrow() as AdminClient;
  const results = await adminClient.getEntityList(ids.map((id) => ({ id })));
  return results
    .valueOrThrow()
    .map((result) =>
      result.isOk()
        ? buildResolversForAdminEntity(schema, result.value)
        : buildErrorResolver(result),
    );
}

export function buildResolversForAdminEntity<TContext extends SessionGraphQLContext>(
  schema: AdminSchema,
  entity: AdminEntity,
): AdminEntityPayload<TContext> {
  const entitySpec = schema.getEntityTypeSpecification(entity.info.type);
  if (!entitySpec) {
    throw new Error(`Couldn't find entity spec for type: ${entity.info.type}`);
  }

  const payload: AdminEntityPayload<TContext> = {
    ...entity,
    changelogEvents: (args, context, info) => {
      const { query, first, after, last, before } = args;
      const paging = { first, after, last, before };
      return loadChangelogEvents(context, { ...query, entity: { id: entity.id } }, paging, info);
    },
  };

  resolveFields<TContext>(schema, entitySpec, payload, true);

  return payload;
}

export async function loadAdminEntitiesSample<TContext extends SessionGraphQLContext>(
  schema: AdminSchema,
  context: TContext,
  query: AdminEntitySharedQuery | undefined,
  options: EntitySamplingOptions | undefined,
): Promise<EntitySamplingPayload<AdminEntity>> {
  const adminClient = context.adminClient.valueOrThrow() as AdminClient;
  const result = await adminClient.getEntitiesSample(query, options);
  const payload = result.valueOrThrow();

  return {
    ...payload,
    items: payload.items.map((it) => buildResolversForAdminEntity(schema, it)),
  };
}

export function loadAdminEntities<TContext extends SessionGraphQLContext>(
  schema: AdminSchema,
  context: TContext,
  query: AdminEntityQuery | undefined,
  paging: Paging,
  info: GraphQLResolveInfo,
): Promise<ConnectionWithTotalCount<Edge<TContext, AdminEntity>, TContext> | null> {
  const adminClient = context.adminClient.valueOrThrow() as AdminClient;
  return buildResolversForConnection<TContext, AdminEntity>(
    () => adminClient.getEntities(query, paging),
    () => adminClient.getEntitiesTotalCount(query),
    (it) => buildResolversForAdminEntity(schema, it),
    info,
  );
}

function resolveFields<TContext extends SessionGraphQLContext>(
  schema: AdminSchema | PublishedSchema,
  spec:
    | AdminEntityTypeSpecification
    | PublishedEntityTypeSpecification
    | AdminComponentTypeSpecification
    | PublishedComponentTypeSpecification,
  item: Component | PublishedEntity | AdminEntity,
  isAdmin: boolean,
) {
  const fields = isComponent(item) ? item : item.fields;
  for (const fieldSpec of spec.fields) {
    const value = fields[fieldSpec.name];
    if (isRichTextSingleField(fieldSpec, value) && value) {
      const ids = extractEntityIdsForRichTextField(schema, fieldSpec, value);
      fields[fieldSpec.name] = {
        root: value.root,
        entities:
          ids.length === 0
            ? []
            : (_args: undefined, context: TContext, _info: unknown) => {
                return isAdmin
                  ? loadAdminEntityList(schema as AdminSchema, context, ids)
                  : loadPublishedEntityList(schema as PublishedSchema, context, ids);
              },
      };
    } else if (isEntitySingleField(fieldSpec, value) && value) {
      fields[fieldSpec.name] = (_args: undefined, context: TContext, _info: GraphQLResolveInfo) =>
        isAdmin
          ? loadAdminEntity(schema as AdminSchema, context, value)
          : loadPublishedEntity(schema as PublishedSchema, context, value);
    } else if (isEntityListField(fieldSpec, value) && value && value.length > 0) {
      fields[fieldSpec.name] = (_args: undefined, context: TContext, _info: unknown) => {
        const ids = value.map((it) => it.id);
        return isAdmin
          ? loadAdminEntityList(schema as AdminSchema, context, ids)
          : loadPublishedEntityList(schema as PublishedSchema, context, ids);
      };
    } else if (isComponentSingleField(fieldSpec, value) && value) {
      fields[fieldSpec.name] = buildResolversForValue(schema, value, isAdmin);
    } else if (isComponentListField(fieldSpec, value) && value && value.length > 0) {
      fields[fieldSpec.name] = value.map((it) => buildResolversForValue(schema, it, isAdmin));
    }
  }
}

function extractEntityIdsForRichTextField(
  schema: AdminSchema | PublishedSchema,
  fieldSpec: AdminFieldSpecification | PublishedFieldSpecification,
  value: RichText,
) {
  const referencesCollector = createReferencesCollector();
  for (const node of traverseContentField(schema, [fieldSpec.name], fieldSpec, value)) {
    referencesCollector.collect(node);
  }
  return referencesCollector.result;
}

//TODO we have two identical (three similar) implementations of this function, should it move to core?
function createReferencesCollector<TSchema extends AdminSchema | PublishedSchema>() {
  const references = new Set<string>();
  return {
    collect: (node: ContentTraverseNode<TSchema>) => {
      switch (node.type) {
        case ContentTraverseNodeType.fieldItem:
          if (isEntityItemField(node.fieldSpec, node.value) && node.value) {
            references.add(node.value.id);
          }
          break;
        case ContentTraverseNodeType.richTextNode: {
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
  component: Component,
  isAdmin: boolean,
): Component {
  const componentSpec = schema.getComponentTypeSpecification(component.type);
  if (!componentSpec) {
    throw new Error(`Couldn't find component spec for type: ${component.type}`);
  }
  const result = { ...component };
  resolveFields<TContext>(schema, componentSpec, result, isAdmin);
  return result;
}

export async function loadChangelogEvents<TContext extends SessionGraphQLContext>(
  context: TContext,
  query: ChangelogEventQuery | undefined,
  paging: Paging,
  info: GraphQLResolveInfo,
): Promise<Connection<TContext, Edge<TContext, ChangelogEvent>> | null> {
  const adminClient = context.adminClient.valueOrThrow();
  return buildResolversForConnection<TContext, ChangelogEvent>(
    () => adminClient.getChangelogEvents(query, paging),
    () => adminClient.getChangelogEventsTotalCount(query),
    (it) => it,
    info,
  );
}
