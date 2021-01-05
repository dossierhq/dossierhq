import inquirer from 'inquirer';
import { ErrorType } from '@datadata/core';
import type { AuthContext, Instance, Session } from '@datadata/server';
import { Auth } from '@datadata/server';
import * as CliUtils from './CliUtils';
import { showConfirm } from './widgets';

async function createPrincipalWithConfirm(
  authContext: AuthContext,
  provider: string,
  identifier: string
) {
  if (await showConfirm('Principal doesn’t exist. Create new principal?')) {
    const result = await Auth.createPrincipal(authContext, provider, identifier);
    if (result.isOk()) {
      return true;
    }
    CliUtils.logErrorResult('Failed creating principal', result);
  }
  return false;
}

export async function veryInsecureCreateSession(
  instance: Instance,
  defaultProvider: string,
  defaultIdentifier: string
): Promise<Session | null> {
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
  const authContext = instance.createAuthContext();
  let sessionResult = await Auth.createSessionForPrincipal(authContext, provider, identifier);
  if (sessionResult.isOk()) {
    return sessionResult.value;
  }
  if (sessionResult.error !== ErrorType.NotFound) {
    CliUtils.logErrorResult('Failed creating session', sessionResult);
    return null;
  }

  // Create new principal
  const created = await createPrincipalWithConfirm(authContext, provider, identifier);
  if (!created) {
    return null;
  }

  // Create session (second attempt)
  sessionResult = await Auth.createSessionForPrincipal(authContext, provider, identifier);
  if (sessionResult.isOk()) {
    return sessionResult.value;
  }
  CliUtils.logErrorResult('Failed creating session', sessionResult);
  return null;
}
