import { AdminEntityStatus, copyEntity } from '@jonasb/datadata-core';
import { v4 as uuidv4 } from 'uuid';
import { assertOkResult, assertResultValue } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';
import {
  TITLE_ONLY_CREATE,
  TITLE_ONLY_ADMIN_ENTITY,
  TITLE_ONLY_UPSERT,
} from '../shared-entity/Fixtures';

export const UpsertEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  upsertEntity_minimalCreate,
  upsertEntity_minimalUpdate,
  upsertEntity_updateAndPublishWithSubjectAuthKey,
];

async function upsertEntity_minimalCreate({ client }: AdminEntityTestContext) {
  const id = uuidv4();
  const upsertResult = await client.upsertEntity(copyEntity(TITLE_ONLY_UPSERT, { id }));
  if (assertOkResult(upsertResult)) {
    const {
      entity: {
        info: { name, createdAt, updatedAt },
      },
    } = upsertResult.value;

    const expectedEntity = copyEntity(TITLE_ONLY_ADMIN_ENTITY, {
      id,
      info: {
        name,
        createdAt,
        updatedAt,
      },
    });

    assertResultValue(upsertResult, {
      effect: 'created',
      entity: expectedEntity,
    });

    const getResult = await client.getEntity({ id });
    assertResultValue(getResult, expectedEntity);
  }
}

async function upsertEntity_minimalUpdate({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  if (assertOkResult(createResult)) {
    const {
      entity: { id },
    } = createResult.value;

    const upsertResult = await client.upsertEntity(
      copyEntity(TITLE_ONLY_UPSERT, { id, fields: { title: 'Updated title' } })
    );
    if (assertOkResult(upsertResult)) {
      const {
        entity: {
          info: { updatedAt },
        },
      } = upsertResult.value;

      const expectedEntity = copyEntity(createResult.value.entity, {
        info: { version: 1, updatedAt },
        fields: { title: 'Updated title' },
      });

      assertResultValue(upsertResult, {
        effect: 'updated',
        entity: expectedEntity,
      });

      const getResult = await client.getEntity({ id });
      assertResultValue(getResult, expectedEntity);
    }
  }
}

async function upsertEntity_updateAndPublishWithSubjectAuthKey({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: 'subject' } })
  );
  if (assertOkResult(createResult)) {
    const {
      entity: { id },
    } = createResult.value;

    const upsertResult = await client.upsertEntity(
      copyEntity(TITLE_ONLY_UPSERT, {
        id,
        info: { authKey: 'subject' },
        fields: { title: 'Updated title' },
      }),
      { publish: true }
    );
    if (assertOkResult(upsertResult)) {
      const {
        entity: {
          info: { updatedAt },
        },
      } = upsertResult.value;

      const expectedEntity = copyEntity(createResult.value.entity, {
        info: { version: 1, updatedAt, status: AdminEntityStatus.published },
        fields: { title: 'Updated title' },
      });

      assertResultValue(upsertResult, {
        effect: 'updatedAndPublished',
        entity: expectedEntity,
      });

      const getResult = await client.getEntity({ id });
      assertResultValue(getResult, expectedEntity);
    }
  }
}
