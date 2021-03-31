import chalk from 'chalk';
import {
  FieldType,
  isEntityTypeField,
  isEntityTypeItemField,
  isEntityTypeListField,
  isLocationField,
  isLocationItemField,
  isLocationListField,
  isStringField,
  isStringItemField,
  isStringListField,
  isValueTypeField,
  isValueTypeItemField,
  isValueTypeListField,
  visitFieldsRecursively,
} from '@datadata/core';
import type {
  AdminEntity,
  BoundingBox,
  Entity,
  EntityReference,
  EntityTypeSpecification,
  ErrorResult,
  ErrorType,
  FieldSpecification,
  Location,
  PromiseResult,
  Result,
  Value,
  ValueTypeSpecification,
} from '@datadata/core';
import type { SessionContext } from '@datadata/server';

interface Entityish {
  _type: string;
  [fieldName: string]: unknown;
}

type EntityFetcher = (context: SessionContext, id: string) => PromiseResult<Entity, ErrorType>;
type MultipleEntitiesFetcher = (
  context: SessionContext,
  ids: string[]
) => Promise<Result<Entity, ErrorType>[]>;

function isAdminEntity(entity: AdminEntity | Entity): entity is AdminEntity {
  return '_version' in entity;
}

export function logErrorResult(
  message: string,
  errorResult: ErrorResult<unknown, ErrorType>
): void {
  console.log(
    `${chalk.yellow(chalk.bold('!'))} ${chalk.bold(message + ':')} ${formatErrorResult(
      errorResult
    )}`
  );
}

export function formatErrorResult(errorResult: ErrorResult<unknown, ErrorType>): string {
  return `${chalk.yellow(errorResult.error)} ${errorResult.message}`;
}

export function logError(error: Error): void {
  console.log(
    `${chalk.yellow(chalk.bold('!'))} ${chalk.bold('Caught error' + ':')} ${chalk.yellow(error)}`
  );
  console.log(error);
}

export function logErrorMessage(error: string, message: string): void {
  console.log(`${chalk.yellow(chalk.bold('!'))} ${chalk.bold(error + ':')} ${message}`);
}

export function logKeyValue(key: string, value: string): void {
  console.log(`${chalk.bold(`${key}:`)} ${value}`);
}

export function logEntity(context: SessionContext, entity: AdminEntity | Entity): void {
  logKeyValue('type', entity._type);
  logKeyValue('name', entity._name);
  logKeyValue('id', entity.id);
  if (isAdminEntity(entity)) {
    logKeyValue('version', String(entity._version));
    if (entity._deleted) {
      logKeyValue('deleted', 'true');
      return;
    }
  }

  const schema = context.server.getSchema();

  visitFieldsRecursively<{ indent: string }>({
    schema,
    entity,
    visitField: (path, fieldSpec, data, visitContext) => {
      let value;
      if (isEntityTypeItemField(fieldSpec, data)) {
        if (isReferenceAnEntity(data)) {
          value = formatEntityOneLine(data);
        } else {
          value = data ? data.id : chalk.grey('<not set>');
        }
      } else if (isValueTypeItemField(fieldSpec, data)) {
        value = data ? formatValueItemOneLine(data) : chalk.grey('<not set>');
      } else if (isStringItemField(fieldSpec, data)) {
        value = data ? data : chalk.grey('<not set>');
      } else if (isLocationItemField(fieldSpec, data)) {
        value = data ? formatLocation(data) : chalk.grey('<not set>');
      } else {
        throw new Error(`Unknown type (${fieldSpec.type})`);
      }
      const listIndex = Number.isInteger(path[path.length - 1]) ? path[path.length - 1] : undefined;
      logKeyValue(
        visitContext.indent + (listIndex === undefined ? fieldSpec.name : listIndex),
        value
      );
    },
    visitRichTextBlock: (_path, _fieldSpec, _block, _visitContext) => {
      // TODO implement
    },
    enterList: (path, fieldSpec, list, { indent }) => {
      console.log(indent + chalk.bold(fieldSpec.name));
      return { indent: indent + '  ' };
    },
    enterValueItem: (path, fieldSpec, valueItem, { indent }) => ({ indent: indent + '  ' }),
    initialVisitContext: { indent: '' },
  });
}

export function formatEntityOneLine(entity: Entity): string {
  return `${entity._type} | ${chalk.bold(entity._name)} | ${entity.id}`;
}

export function formatValueItemOneLine(value: Value): string {
  return `${value._type}`;
}

export function formatLocation({ lat, lng }: Location): string {
  return `${chalk.grey('(')}${lat}${chalk.grey(',')} ${lng}${chalk.grey(')')}`;
}

export function formatBoundingBox({ minLat, maxLat, minLng, maxLng }: BoundingBox): string {
  return `${minLat}${chalk.grey('–')}${maxLat}${chalk.grey(',')} ${minLng}${chalk.grey(
    '–'
  )}${maxLng}`;
}

export function formatFieldValue(fieldSpec: FieldSpecification, value: unknown): string {
  if (isEntityTypeField(fieldSpec, value)) {
    if (isReferenceAnEntity(value)) {
      return formatEntityOneLine(value);
    }
    return value ? value.id : chalk.grey('<not set>');
  }
  if (isEntityTypeListField(fieldSpec, value)) {
    if (!value) {
      return chalk.grey('<not set>');
    }
    return value
      .map((x) => (isReferenceAnEntity(x) ? formatEntityOneLine(x) : x.id))
      .join(chalk.grey(', '));
  }
  if (isValueTypeField(fieldSpec, value)) {
    if (!value) {
      return chalk.grey('<not set>');
    }
    return formatValueItemOneLine(value);
  }
  if (isValueTypeListField(fieldSpec, value)) {
    if (!value) {
      return chalk.grey('<not set>');
    }
    return value.map(formatValueItemOneLine).join(chalk.grey(', '));
  }
  if (isStringField(fieldSpec, value)) {
    return value ? value : chalk.grey('<not set>');
  }
  if (isStringListField(fieldSpec, value)) {
    return value ? value.join(chalk.grey(', ')) : chalk.grey('<not set>');
  }
  if (isLocationField(fieldSpec, value)) {
    return value ? formatLocation(value) : chalk.grey('<not set>');
  }
  if (isLocationListField(fieldSpec, value)) {
    return value ? value.map(formatLocation).join(chalk.grey(', ')) : chalk.grey('<not set>');
  }
  throw new Error(`Unknown type (${fieldSpec.type})`);
}

export function getEntitySpec(context: SessionContext, entity: Entityish): EntityTypeSpecification {
  const { server } = context;
  const schema = server.getSchema();
  const entitySpec = schema.getEntityTypeSpecification(entity._type);
  if (!entitySpec) {
    throw new Error(`Couldn't find entity spec for type: ${entity._type}`);
  }
  return entitySpec;
}

export function getValueSpec(context: SessionContext, valueItem: Value): ValueTypeSpecification {
  const { server } = context;
  const schema = server.getSchema();
  const valueSpec = schema.getValueTypeSpecification(valueItem._type);
  if (!valueSpec) {
    throw new Error(`Couldn't find value spec for type: ${valueItem._type}`);
  }
  return valueSpec;
}

export function isReferenceAnEntity(value: EntityReference | null): value is Entity {
  return !!value && Object.keys(value).indexOf('_type') >= 0;
}

export async function replaceEntityReferencesWithEntitiesGeneric(
  context: SessionContext,
  entity: Entityish,
  entityFetcher: EntityFetcher,
  multipleEntitiesFetcher: MultipleEntitiesFetcher
): Promise<void> {
  const entitySpec = getEntitySpec(context, entity);
  await replaceEntityOrValueItemReferencesWithEntitiesGeneric(
    context,
    entitySpec,
    entity,
    entityFetcher,
    multipleEntitiesFetcher
  );
}

export async function replaceValueItemReferencesWithEntitiesGeneric(
  context: SessionContext,
  valueItem: Value,
  entityFetcher: EntityFetcher,
  multipleEntitiesFetcher: MultipleEntitiesFetcher
): Promise<void> {
  const valueSpec = getValueSpec(context, valueItem);
  await replaceEntityOrValueItemReferencesWithEntitiesGeneric(
    context,
    valueSpec,
    valueItem,
    entityFetcher,
    multipleEntitiesFetcher
  );
}

async function replaceEntityOrValueItemReferencesWithEntitiesGeneric(
  context: SessionContext,
  spec: EntityTypeSpecification | ValueTypeSpecification,
  item: Entityish,
  entityFetcher: EntityFetcher,
  multipleEntitiesFetcher: MultipleEntitiesFetcher
): Promise<void> {
  for (const fieldSpec of spec.fields) {
    if (!(fieldSpec.name in item)) {
      continue;
    }
    const value = item[fieldSpec.name];
    if (fieldSpec.type === FieldType.EntityType) {
      if (isEntityTypeField(fieldSpec, value)) {
        if (!value || isReferenceAnEntity(value)) {
          continue;
        }
        const referenceResult = await entityFetcher(context, value.id);
        if (referenceResult.isOk()) {
          item[fieldSpec.name] = referenceResult.value.item;
        } else {
          logErrorResult('Failed fetching reference', referenceResult);
        }
      } else if (isEntityTypeListField(fieldSpec, value)) {
        if (!value) {
          continue;
        }
        const referenceIds = value.filter((x) => !isReferenceAnEntity(x)).map((x) => x.id);
        if (referenceIds.length > 0) {
          const entities = await multipleEntitiesFetcher(context, referenceIds);
          item[fieldSpec.name] = value.map((reference) => {
            if (!isReferenceAnEntity(reference)) {
              const entityResult = entities.find((x) => x.isOk() && x.value.id === reference.id);
              if (entityResult?.isOk()) {
                return entityResult.value;
              }
              logErrorMessage('Failed fetching reference', reference.id);
            }
            return reference;
          });
        }
      }
    }
  }
}
