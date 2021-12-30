import { AdminEntityStatus, copyEntity, CoreTestUtils, ErrorType } from '@jonasb/datadata-core';
import type { UnboundTestFunction } from '../Builder';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';
import { TITLE_ONLY_CREATE } from './Fixtures';

const { expectErrorResult, expectOkResult, expectResultValue } = CoreTestUtils;

export const PublishEntitiesSubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  publishEntities_minimal,
  publishEntities_minimalWithSubjectAuthKey,
  publishEntities_errorMissingRequiredTitle,
  publishEntities_errorWrongAuthKey,
];

async function publishEntities_minimal({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(TITLE_ONLY_CREATE);
  if (expectOkResult(createResult)) {
    const {
      entity: {
        id,
        info: { version },
      },
    } = createResult.value;

    const publishResult = await client.publishEntities([{ id, version }]);
    if (expectOkResult(publishResult)) {
      const [{ updatedAt }] = publishResult.value;
      expectResultValue(publishResult, [
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
      expectResultValue(getResult, expectedEntity);
    }
  }
}

async function publishEntities_minimalWithSubjectAuthKey({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { info: { authKey: 'subject' } })
  );
  if (expectOkResult(createResult)) {
    const {
      entity: {
        id,
        info: { version },
      },
    } = createResult.value;

    const publishResult = await client.publishEntities([{ id, version, authKeys: ['subject'] }]);
    if (expectOkResult(publishResult)) {
      const [{ updatedAt }] = publishResult.value;
      expectResultValue(publishResult, [
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
      expectResultValue(getResult, expectedEntity);
    }
  }
}

async function publishEntities_errorMissingRequiredTitle({ client }: AdminEntityTestContext) {
  const createResult = await client.createEntity(
    copyEntity(TITLE_ONLY_CREATE, { fields: { title: null } })
  );
  if (expectOkResult(createResult)) {
    const {
      entity: {
        id,
        info: { version },
      },
    } = createResult.value;

    const publishResult = await client.publishEntities([{ id, version }]);
    expectErrorResult(
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
  if (expectOkResult(createResult)) {
    const {
      entity: {
        id,
        info: { version },
      },
    } = createResult.value;

    const publishResult = await client.publishEntities([{ id, version }]);
    expectErrorResult(
      publishResult,
      ErrorType.NotAuthorized,
      `entity(${id}): Wrong authKey provided`
    );
  }
}
