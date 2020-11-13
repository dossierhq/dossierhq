import chalk from 'chalk';
import type { EntityFieldSpecification, ErrorResult, ErrorType } from '@datadata/core';
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

export function formatFieldValue(fieldSpec: EntityFieldSpecification, value: unknown): string {
  switch (fieldSpec.type) {
    case EntityFieldType.String:
      return value ? (value as string) : chalk.grey('<not set>');
  }
  throw new Error(`Unknown type (${fieldSpec.type})`);
}
