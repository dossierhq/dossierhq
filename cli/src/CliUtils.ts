import chalk from 'chalk';
import { ErrorType } from '@datadata/core';

export function logErrorType(message: string, errorType: ErrorType): void {
  console.log(
    `${chalk.yellow(chalk.bold('!'))} ${chalk.bold(message + ':')} ${chalk.yellow(errorType)}`
  );
}
