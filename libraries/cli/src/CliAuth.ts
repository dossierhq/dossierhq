import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import type { CreateSessionPayload, Server2 } from '@jonasb/datadata-server';
import inquirer from 'inquirer';
import * as CliUtils from './CliUtils';

export async function veryInsecureCreateSession(
  server: Server2,
  defaultProvider: string,
  defaultIdentifier: string
): PromiseResult<CreateSessionPayload, ErrorType.BadRequest | ErrorType.Generic> {
  const { provider, identifier } = await inquirer.prompt([
    {
      name: 'provider',
      type: 'input',
      message: 'Which principal provider?',
      default: defaultProvider,
    },
    {
      name: 'identifier',
      type: 'input',
      message: 'Which principal identifier?',
      default: defaultIdentifier,
    },
  ]);

  // Try to create session (first attempt)
  const sessionResult = await server.createSession(provider, identifier);
  if (sessionResult.isError()) {
    CliUtils.logErrorResult('Failed creating session', sessionResult);
  }
  return sessionResult;
}
