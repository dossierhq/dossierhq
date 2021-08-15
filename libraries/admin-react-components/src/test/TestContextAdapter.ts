import type { AdminClient, AdminClientMiddleware } from '@jonasb/datadata-core';
import { createInMemoryAdminClient, InMemoryServer } from '@jonasb/datadata-testing-utils';
import type { InMemorySessionContext } from '@jonasb/datadata-testing-utils';
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';
import type { DataDataContextAdapter } from '..';
import { DataDataContextValue } from '..';
import { entitiesFixture } from './EntityFixtures';
import schema from '../stories/StoryboardSchema';

const GENERATE_ENTITIES_UUID_NAMESPACE = '96597f34-8654-4f66-b98d-3e9f5bb7cc9a';

export function createContextValue({
  adapter,
  adminClientMiddleware,
}: {
  adapter?: TestContextAdapter;
  adminClientMiddleware?: AdminClientMiddleware<InMemorySessionContext>[];
} = {}): {
  contextValue: DataDataContextValue;
  adminClient: AdminClient;
} {
  schema.validate().throwIfError();

  const userId = 'adba1452-1b89-42e9-8878-d0a2becf101f';
  const server = new InMemoryServer(schema);
  server.loadEntities(entitiesFixture);
  const context = server.createContext(userId);

  const adminClient = createInMemoryAdminClient({
    context,
    middleware: adminClientMiddleware ?? [],
  });

  return {
    contextValue: new DataDataContextValue(
      adapter ?? new TestContextAdapter(),
      adminClient,
      schema,
      uuidv4()
    ),
    adminClient,
  };
}

export const SlowMiddleware: AdminClientMiddleware<unknown> = async (_context, operation) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  operation.resolve(await operation.next());
};

export class TestContextAdapter implements DataDataContextAdapter {
  getEditorJSConfig: DataDataContextAdapter['getEditorJSConfig'] = (
    _fieldSpec,
    standardBlockTools,
    standardInlineTools
  ) => {
    return { tools: standardBlockTools, inlineToolbar: standardInlineTools };
  };
}

export async function createManyBarEntities(
  adminClient: AdminClient,
  entityCount: number
): Promise<void> {
  for (let i = 0; i < entityCount; i += 1) {
    const id = uuidv5(`bar-${i}`, GENERATE_ENTITIES_UUID_NAMESPACE);
    const result = await adminClient.createEntity({
      id,
      info: { type: 'Bar', name: `Generated bar ${i}` },
      fields: { title: `Generated bar ${i}` },
    });
    result.throwIfError();
  }
}
