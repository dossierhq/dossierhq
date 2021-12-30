import { copyEntity, CoreTestUtils } from '@jonasb/datadata-core';
import { v4 as uuidv4 } from 'uuid';
import type { UnboundTestFunction } from '../Builder';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';
import { TITLE_ONLY_CREATE, TITLE_ONLY_ENTITY, TITLE_ONLY_UPSERT } from './Fixtures';

const { expectOkResult, expectResultValue } = CoreTestUtils;

export const UpsertEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  upsertEntity_minimalCreate,
  upsertEntity_minimalUpdate,
];

async function upsertEntity_minimalCreate({ client }: AdminEntityTestContext) {
  const id = uuidv4();
  const upsertResult = await client.upsertEntity(copyEntity(TITLE_ONLY_UPSERT, { id }));
  if (expectOkResult(upsertResult)) {
    const {
      entity: {
        info: { name, createdAt, updatedAt },
      },
    } = upsertResult.value;

    const expectedEntity = copyEntity(TITLE_ONLY_ENTITY, {
      id,
      info: {
        name,
        createdAt,
        updatedAt,
      },
    });

    expectResultValue(upsertResult, {
      effect: 'created',
      entity: expectedEntity,
    });

    const getResult = await client.getEntity({ id });
    expectResultValue(getResult, expectedEntity);
  }
}

async function upsertEntity_minimalUpdate({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  if (expectOkResult(createResult)) {
    const {
      entity: { id },
    } = createResult.value;

    const upsertResult = await client.upsertEntity(
      copyEntity(TITLE_ONLY_UPSERT, { id, fields: { title: 'Updated title' } })
    );
    if (expectOkResult(upsertResult)) {
      const {
        entity: {
          info: { updatedAt },
        },
      } = upsertResult.value;

      const expectedEntity = copyEntity(createResult.value.entity, {
        info: { version: 1, updatedAt },
        fields: { title: 'Updated title' },
      });

      expectResultValue(upsertResult, {
        effect: 'updated',
        entity: expectedEntity,
      });

      const getResult = await client.getEntity({ id });
      expectResultValue(getResult, expectedEntity);
    }
  }
}
