import chalk from 'chalk';
import type {
  Entity,
  EntityFieldSpecification,
  ErrorResult,
  ErrorType,
  SessionContext,
} from '@datadata/core';
import { EntityFieldType } from '@datadata/core';

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
}

export function logKeyValue(key: string, value: string): void {
  console.log(`${chalk.bold(`${key}:`)} ${value}`);
}

export function logEntity(context: SessionContext, entity: Entity) {
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

export function formatFieldValue(fieldSpec: EntityFieldSpecification, value: unknown): string {
  switch (fieldSpec.type) {
    case EntityFieldType.String:
      return value ? (value as string) : chalk.grey('<not set>');
  }
  throw new Error(`Unknown type (${fieldSpec.type})`);
}
