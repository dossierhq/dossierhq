import { assertOkResult } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import type { SchemaTestContext } from './SchemaTestSuite.js';

export const ServerRevalidateNextEntitySubSuite: UnboundTestFunction<SchemaTestContext>[] = [
  serverRevalidateNextEntity_all,
];

async function serverRevalidateNextEntity_all({ server }: SchemaTestContext) {
  let done = false;
  while (!done) {
    const result = await server.revalidateNextEntity();
    assertOkResult(result);
    if (!result.value) {
      done = true;
    }
  }
}
