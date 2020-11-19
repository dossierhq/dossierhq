import { EntityFieldSpecification, EntityFieldType, PublishedEntity } from '@datadata/core';
import type { Entity, SessionContext } from '@datadata/core';
import type { SessionGraphQLContext } from './GraphQLSchemaGenerator';

// TODO move to core, use by cli?
interface EntityFieldValueTypeMap {
  [EntityFieldType.Reference]: { id: string } | null;
  [EntityFieldType.String]: string | null;
}

function isReferenceFieldType(
  fieldSpec: EntityFieldSpecification,
  value: unknown
): value is EntityFieldValueTypeMap[EntityFieldType.Reference] {
  return fieldSpec.type === EntityFieldType.Reference;
}

function isStringFieldType(
  fieldSpec: EntityFieldSpecification,
  value: unknown
): value is EntityFieldValueTypeMap[EntityFieldType.String] {
  return fieldSpec.type === EntityFieldType.String;
}

export async function loadEntity<TContext extends SessionGraphQLContext>(
  context: TContext,
  id: string
): Promise<Entity> {
  if (context.context.isError()) {
    throw context.context.toError();
  }
  const sessionContext = context.context.value;
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
