import { notOk, ok } from '@datadata/core';
import type { ErrorType, PromiseResult } from '@datadata/core';
import inquirer from 'inquirer';
import { showConfirm } from '.';
import { logError } from '../CliUtils';

export async function showJsonEdit(
  message: string,
  initialValue: unknown
): PromiseResult<unknown, ErrorType> {
  let json = JSON.stringify(initialValue, null, 2);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { value } = await inquirer.prompt([
      {
        name: 'value',
        type: 'editor',
        message,
        default: json,
        postfix: '.json',
      },
    ]);
    json = value;
    try {
      const resultParsed = JSON.parse(value);
      return ok(resultParsed);
    } catch (error) {
      logError(error);
      if (!(await showConfirm('Edit again'))) {
        return notOk.BadRequest('Invalid JSON');
      }
    }
  }
}
