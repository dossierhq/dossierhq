import inquirer from 'inquirer';
import type { AuthContext, Instance, Session } from '@datadata/core';
import { Auth, ErrorType } from '@datadata/core';
import * as CliUtils from './CliUtils';

async function createPrincipalWithConfirm(
  authContext: AuthContext,
  provider: string,
  identifier: string
) {
  const { create } = await inquirer.prompt([
    {
      name: 'create',
      type: 'confirm',
      message: 'Principal doesn’t exist. Create new principal?',
    },
  ]);
  if (create) {
    const result = await Auth.createPrincipal(authContext, provider, identifier);
    if (result.isOk()) {
      return true;
    }
    CliUtils.logErrorType('Failed creating principal', result.error);
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
    CliUtils.logErrorType('Failed creating session', sessionResult.error);
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
  CliUtils.logErrorType('Failed creating session', sessionResult.error);
  return null;
}
