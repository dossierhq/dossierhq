import { AdminEntityStatus, copyEntity, ErrorType } from '@jonasb/datadata-core';
import { assertErrorResult, assertOkResult, assertResultValue } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';
import { TITLE_ONLY_CREATE } from '../shared-entity/Fixtures';

export const PublishEntitiesSubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  publishEntities_minimal,
  publishEntities_minimalWithSubjectAuthKey,
  publishEntities_errorMissingRequiredTitle,
  publishEntities_errorWrongAuthKey,
];

async function publishEntities_minimal({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  if (assertOkResult(createResult)) {
    const {
      entity: {
        id,
        info: { version },
      },
    } = createResult.value;

    const publishResult = await client.publishEntities([{ id, version }]);
    if (assertOkResult(publishResult)) {
      const [{ updatedAt }] = publishResult.value;
      assertResultValue(publishResult, [
        {
          id,
          effect: 'published',
          status: AdminEntityStatus.published,
          updatedAt,
        },
      ]);

      const expectedEntity = copyEntity(createResult.value.entity, {
        info: { status: AdminEntityStatus.published, updatedAt },
      });

      const getResult = await client.getEntity({ id });
      assertResultValue(getResult, expectedEntity);
    }
  }
}

async function publishEntities_minimalWithSubjectAuthKey({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: 'subject' } })
  );
  if (assertOkResult(createResult)) {
    const {
      entity: {
        id,
        info: { version },
      },
    } = createResult.value;

    const publishResult = await client.publishEntities([{ id, version, authKeys: ['subject'] }]);
    if (assertOkResult(publishResult)) {
      const [{ updatedAt }] = publishResult.value;
      assertResultValue(publishResult, [
        {
          id,
          effect: 'published',
          status: AdminEntityStatus.published,
          updatedAt,
        },
      ]);

      const expectedEntity = copyEntity(createResult.value.entity, {
        info: { status: AdminEntityStatus.published, updatedAt },
      });

      const getResult = await client.getEntity({ id, authKeys: ['subject'] });
      assertResultValue(getResult, expectedEntity);
    }
  }
}

async function publishEntities_errorMissingRequiredTitle({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { fields: { title: null } })
  );
  if (assertOkResult(createResult)) {
    const {
      entity: {
        id,
        info: { version },
      },
    } = createResult.value;

    const publishResult = await client.publishEntities([{ id, version }]);
    assertErrorResult(
      publishResult,
      ErrorType.BadRequest,
      `entity(${id}).fields.title: Required field is empty`
    );
  }
}

async function publishEntities_errorWrongAuthKey({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: 'subject' } })
  );
  if (assertOkResult(createResult)) {
    const {
      entity: {
        id,
        info: { version },
      },
    } = createResult.value;

    const publishResult = await client.publishEntities([{ id, version }]);
    assertErrorResult(
      publishResult,
      ErrorType.NotAuthorized,
      `entity(${id}): Wrong authKey provided`
    );
  }
}
