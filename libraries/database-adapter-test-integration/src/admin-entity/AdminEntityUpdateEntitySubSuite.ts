import { AdminEntityStatus, copyEntity, ErrorType } from '@jonasb/datadata-core';
import { assertErrorResult, assertOkResult, assertResultValue } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';
import { TITLE_ONLY_CREATE } from './Fixtures';

export const UpdateEntitySubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  updateEntity_minimal,
  updateEntity_noChange,
  updateEntity_minimalWithSubjectAuthKey,
  updateEntity_updateAndPublishEntity,
  updateEntity_updateAndPublishEntityWithSubjectAuthKey,
  updateEntity_noChangeAndPublishDraftEntity,
  updateEntity_noChangeAndPublishPublishedEntity,
  updateEntity_errorWhenNotSpecifyingSubjectAuthKey,
  updateEntity_errorPublishWithoutRequiredTitle,
];

async function updateEntity_minimal({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  if (assertOkResult(createResult)) {
    const {
      entity: { id },
    } = createResult.value;
    const updateResult = await client.updateEntity({ id, fields: { title: 'Updated title' } });
    if (assertOkResult(updateResult)) {
      const {
        entity: {
          info: { updatedAt },
        },
      } = updateResult.value;

      const expectedEntity = copyEntity(createResult.value.entity, {
        info: {
          updatedAt,
          version: 1,
        },
        fields: {
          title: 'Updated title',
        },
      });

      assertResultValue(updateResult, {
        effect: 'updated',
        entity: expectedEntity,
      });

      const getResult = await client.getEntity({ id });
      assertResultValue(getResult, expectedEntity);
    }
  }
}

async function updateEntity_noChange({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  if (assertOkResult(createResult)) {
    const {
      entity: {
        id,
        fields: { title },
      },
    } = createResult.value;
    const updateResult = await client.updateEntity({ id, fields: { title } });
    assertResultValue(updateResult, {
      effect: 'none',
      entity: createResult.value.entity,
    });
  }
}

async function updateEntity_minimalWithSubjectAuthKey({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: 'subject' } })
  );
  if (assertOkResult(createResult)) {
    const {
      entity: { id },
    } = createResult.value;
    const updateResult = await client.updateEntity({
      id,
      info: { authKey: 'subject' },
      fields: { title: 'Updated title' },
    });
    if (assertOkResult(updateResult)) {
      const {
        entity: {
          info: { updatedAt },
        },
      } = updateResult.value;

      const expectedEntity = copyEntity(createResult.value.entity, {
        info: {
          updatedAt,
          version: 1,
        },
        fields: {
          title: 'Updated title',
        },
      });

      assertResultValue(updateResult, {
        effect: 'updated',
        entity: expectedEntity,
      });

      const getResult = await client.getEntity({ id, authKeys: ['subject'] });
      assertResultValue(getResult, expectedEntity);
    }
  }
}

async function updateEntity_updateAndPublishEntity({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  if (assertOkResult(createResult)) {
    const {
      entity: { id },
    } = createResult.value;
    const updateResult = await client.updateEntity(
      { id, fields: { title: 'Updated title' } },
      { publish: true }
    );
    if (assertOkResult(updateResult)) {
      const {
        entity: {
          info: { updatedAt },
        },
      } = updateResult.value;

      const expectedEntity = copyEntity(createResult.value.entity, {
        info: {
          updatedAt,
          version: 1,
          status: AdminEntityStatus.published,
        },
        fields: {
          title: 'Updated title',
        },
      });

      assertResultValue(updateResult, {
        effect: 'updatedAndPublished',
        entity: expectedEntity,
      });

      const getResult = await client.getEntity({ id });
      assertResultValue(getResult, expectedEntity);
    }
  }
}

async function updateEntity_updateAndPublishEntityWithSubjectAuthKey({
  client,
}: AdminEntityTestContext) {
  const createResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: 'subject' } })
  );
  if (assertOkResult(createResult)) {
    const {
      entity: { id },
    } = createResult.value;
    const updateResult = await client.updateEntity(
      { id, info: { authKey: 'subject' }, fields: { title: 'Updated title' } },
      { publish: true }
    );
    if (assertOkResult(updateResult)) {
      const {
        entity: {
          info: { updatedAt },
        },
      } = updateResult.value;

      const expectedEntity = copyEntity(createResult.value.entity, {
        info: {
          updatedAt,
          version: 1,
          status: AdminEntityStatus.published,
        },
        fields: {
          title: 'Updated title',
        },
      });

      assertResultValue(updateResult, {
        effect: 'updatedAndPublished',
        entity: expectedEntity,
      });

      const getResult = await client.getEntity({ id, authKeys: ['subject'] });
      assertResultValue(getResult, expectedEntity);
    }
  }
}

async function updateEntity_noChangeAndPublishDraftEntity({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  if (assertOkResult(createResult)) {
    const {
      entity: {
        id,
        fields: { title },
      },
    } = createResult.value;
    const updateResult = await client.updateEntity({ id, fields: { title } }, { publish: true });
    if (assertOkResult(updateResult)) {
      const {
        entity: {
          info: { updatedAt },
        },
      } = updateResult.value;

      const expectedEntity = copyEntity(createResult.value.entity, {
        info: {
          updatedAt,
          status: AdminEntityStatus.published,
        },
      });

      assertResultValue(updateResult, {
        effect: 'published',
        entity: expectedEntity,
      });

      const getResult = await client.getEntity({ id });
      assertResultValue(getResult, expectedEntity);
    }
  }
}

async function updateEntity_noChangeAndPublishPublishedEntity({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE, { publish: true });
  if (assertOkResult(createResult)) {
    const {
      entity: {
        id,
        fields: { title },
      },
    } = createResult.value;
    const updateResult = await client.updateEntity({ id, fields: { title } }, { publish: true });
    if (assertOkResult(updateResult)) {
      assertResultValue(updateResult, {
        effect: 'none',
        entity: createResult.value.entity,
      });
    }
  }
}

async function updateEntity_errorWhenNotSpecifyingSubjectAuthKey({
  client,
}: AdminEntityTestContext) {
  const createResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: 'subject' } })
  );
  if (assertOkResult(createResult)) {
    const {
      entity: { id },
    } = createResult.value;

    const updateResult = await client.updateEntity({ id, fields: {} });
    assertErrorResult(updateResult, ErrorType.NotAuthorized, 'Wrong authKey provided');
  }
}

async function updateEntity_errorPublishWithoutRequiredTitle({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  if (assertOkResult(createResult)) {
    const {
      entity: { id },
    } = createResult.value;

    const updateResult = await client.updateEntity(
      { id, fields: { title: null } },
      { publish: true }
    );
    assertErrorResult(
      updateResult,
      ErrorType.BadRequest,
      `entity(${id}).fields.title: Required field is empty`
    );

    const getResult = await client.getEntity({ id });
    assertResultValue(getResult, createResult.value.entity);
  }
}
