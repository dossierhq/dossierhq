import chalk from 'chalk';
import {
  EntityFieldType,
  EntityTypeSpecification,
  isReferenceFieldType,
  isReferenceListFieldType,
  isStringFieldType,
  isStringListFieldType,
  PromiseResult,
} from '@datadata/core';
import type {
  AdminEntity,
  Entity,
  EntityFieldSpecification,
  ErrorResult,
  ErrorType,
  SessionContext,
} from '@datadata/core';

interface Entityish {
  _type: string;
  [fieldName: string]: unknown;
}

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

  const schema = context.instance.getSchema();
  const entitySpec = schema.getEntityTypeSpecification(entity._type);
  if (!entitySpec) {
    console.log(chalk.red(`No entity spec exist for type ${entity._type}`));
    return;
  }

  for (const fieldSpec of entitySpec.fields) {
    const value = entity[fieldSpec.name];
    logKeyValue(fieldSpec.name, formatFieldValue(fieldSpec, value));
  }
}

export function formatEntityOneLine(entity: Entity): string {
  return `${entity._type} | ${chalk.bold(entity._name)} | ${entity.id}`;
}

export function formatFieldValue(fieldSpec: EntityFieldSpecification, value: unknown): string {
  if (isReferenceFieldType(fieldSpec, value)) {
    if (isReferenceAnEntity(value)) {
      return formatEntityOneLine(value);
    }
    return value ? value.id : chalk.grey('<not set>');
  }
  if (isReferenceListFieldType(fieldSpec, value)) {
    if (!value) {
      return chalk.grey('<not set>');
    }
    return value
      .map((x) => (isReferenceAnEntity(x) ? formatEntityOneLine(x) : x.id))
      .join(chalk.grey(', '));
  }
  if (isStringFieldType(fieldSpec, value)) {
    return value ? value : chalk.grey('<not set>');
  }
  if (isStringListFieldType(fieldSpec, value)) {
    return value ? value.join(chalk.grey(', ')) : chalk.grey('<not set>');
  }
  throw new Error(`Unknown type (${fieldSpec.type})`);
}

export function getEntitySpec(context: SessionContext, entity: Entityish): EntityTypeSpecification {
  const { instance } = context;
  const schema = instance.getSchema();
  const entitySpec = schema.getEntityTypeSpecification(entity._type);
  if (!entitySpec) {
    throw new Error(`Couldn't find entity spec for type: ${entity._type}`);
  }
  return entitySpec;
}

export function isReferenceAnEntity(value: { id: string } | null): value is Entity {
  return !!value && Object.keys(value).indexOf('_type') >= 0;
}

export async function replaceReferencesWithEntitiesGeneric(
  context: SessionContext,
  entity: Entityish,
  entityFetcher: (context: SessionContext, id: string) => PromiseResult<{ item: Entity }, ErrorType>
): Promise<void> {
  const entitySpec = getEntitySpec(context, entity);
  for (const fieldSpec of entitySpec.fields) {
    if (!(fieldSpec.name in entity)) {
      continue;
    }
    const value = entity[fieldSpec.name];
    if (fieldSpec.type === EntityFieldType.Reference) {
      if (isReferenceFieldType(fieldSpec, value)) {
        if (!value || isReferenceAnEntity(value)) {
          continue;
        }
        const referenceResult = await entityFetcher(context, value.id);
        if (referenceResult.isOk()) {
          entity[fieldSpec.name] = referenceResult.value.item;
        } else {
          logErrorResult('Failed fetching reference', referenceResult);
        }
      }
      if (isReferenceListFieldType(fieldSpec, value)) {
        if (!value) {
          continue;
        }
        entity[fieldSpec.name] = await Promise.all(
          value.map(async (reference) => {
            if (!isReferenceAnEntity(reference)) {
              //TODO change to getEntities()
              const referenceResult = await entityFetcher(context, reference.id);
              if (referenceResult.isOk()) {
                return referenceResult.value.item;
              } else {
                logErrorResult('Failed fetching reference', referenceResult);
              }
            }
            return reference;
          })
        );
      }
    }
  }
}
