import chalk from 'chalk';
import { isReferenceFieldType, isStringFieldType } from '@datadata/core';
import type {
  Entity,
  EntityFieldSpecification,
  ErrorResult,
  ErrorType,
  SessionContext,
} from '@datadata/core';

export function logErrorResult(
  message: string,
  errorResult: ErrorResult<unknown, ErrorType>
): void {
  console.log(
    `${chalk.yellow(chalk.bold('!'))} ${chalk.bold(message + ':')} ${chalk.yellow(
      errorResult.error
    )} ${errorResult.message}`
  );
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

export function logEntity(context: SessionContext, entity: Entity): void {
  logKeyValue('type', entity._type);
  logKeyValue('name', entity._name);
  logKeyValue('id', entity.id);

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
    // Check if it's actually an entity an not just a reference
    if (value && Object.keys(value).indexOf('_type') >= 0) {
      return formatEntityOneLine(value as Entity);
    }
    return value ? value.id : chalk.grey('<not set>');
  }
  if (isStringFieldType(fieldSpec, value)) {
    return value ? value : chalk.grey('<not set>');
  }
  throw new Error(`Unknown type (${fieldSpec.type})`);
}
