import type { CliContext } from '.';
import { logEntity, logErrorResult } from './CliUtils';

export async function showEntity(context: CliContext, id: string): Promise<void> {
  const { publishedClient } = context;
  const result = await publishedClient.getEntity({ id });
  if (result.isError()) {
    logErrorResult('Failed getting entity', result);
    return;
  }
  const entity = result.value;
  logEntity(context, entity);
}
