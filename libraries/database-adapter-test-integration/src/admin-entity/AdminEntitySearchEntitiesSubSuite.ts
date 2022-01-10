import { assertOkResult, assertResultValue } from '../Asserts';
import type { UnboundTestFunction } from '../Builder';
import { assertAdminEntityConnectionToMatchSlice } from '../shared-entity/SearchTestUtils';
import { adminClientForMainPrincipal } from '../shared-entity/TestClients';
import type { AdminEntityTestContext } from './AdminEntityTestSuite';

export const SearchEntitiesSubSuite: UnboundTestFunction<AdminEntityTestContext>[] = [
  searchEntities_minimal,
  searchEntities_pagingFirst,
  searchEntities_pagingFirst0,
  searchEntities_pagingLast,
  searchEntities_pagingLast0,
  searchEntities_pagingFirstAfter,
  searchEntities_pagingLastBefore,
  searchEntities_pagingFirstBetween,
  searchEntities_pagingLastBetween,
  searchEntities_authKeySubject,
  searchEntities_authKeyNoneAndSubject,
];

async function searchEntities_minimal({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const result = await adminClientForMainPrincipal(server).searchEntities({
    entityTypes: ['ReadOnly'],
  });
  assertAdminEntityConnectionToMatchSlice(expectedEntities, result, 0, 25);
}

async function searchEntities_pagingFirst({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const result = await adminClientForMainPrincipal(server).searchEntities(
    { entityTypes: ['ReadOnly'] },
    { first: 10 }
  );
  assertAdminEntityConnectionToMatchSlice(expectedEntities, result, 0, 10);
}

async function searchEntities_pagingFirst0({ server }: AdminEntityTestContext) {
  const result = await adminClientForMainPrincipal(server).searchEntities(
    { entityTypes: ['ReadOnly'] },
    { first: 0 }
  );
  assertResultValue(result, null);
}

async function searchEntities_pagingLast({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const result = await adminClientForMainPrincipal(server).searchEntities(
    { entityTypes: ['ReadOnly'] },
    { last: 10 }
  );
  assertAdminEntityConnectionToMatchSlice(expectedEntities, result, -10, undefined);
}

async function searchEntities_pagingLast0({ server }: AdminEntityTestContext) {
  const result = await adminClientForMainPrincipal(server).searchEntities(
    { entityTypes: ['ReadOnly'] },
    { last: 0 }
  );
  assertResultValue(result, null);
}

async function searchEntities_pagingFirstAfter({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const firstResult = await adminClientForMainPrincipal(server).searchEntities(
    { entityTypes: ['ReadOnly'] },
    { first: 10 }
  );
  assertOkResult(firstResult);
  const secondResult = await adminClientForMainPrincipal(server).searchEntities(
    { entityTypes: ['ReadOnly'] },
    { first: 20, after: firstResult.value?.pageInfo.endCursor }
  );
  assertAdminEntityConnectionToMatchSlice(expectedEntities, secondResult, 10, 10 + 20);
}

async function searchEntities_pagingLastBefore({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const firstResult = await adminClientForMainPrincipal(server).searchEntities(
    { entityTypes: ['ReadOnly'] },
    { last: 10 }
  );
  assertOkResult(firstResult);
  const secondResult = await adminClientForMainPrincipal(server).searchEntities(
    { entityTypes: ['ReadOnly'] },
    { last: 20, before: firstResult.value?.pageInfo.startCursor }
  );
  assertAdminEntityConnectionToMatchSlice(expectedEntities, secondResult, -10 - 20, -10);
}

async function searchEntities_pagingFirstBetween({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const firstResult = await adminClientForMainPrincipal(server).searchEntities(
    { entityTypes: ['ReadOnly'] },
    { first: 20 }
  );
  assertOkResult(firstResult);
  const secondResult = await adminClientForMainPrincipal(server).searchEntities(
    { entityTypes: ['ReadOnly'] },
    {
      first: 20,
      after: firstResult.value?.edges[2].cursor,
      before: firstResult.value?.edges[8].cursor,
    }
  );
  assertAdminEntityConnectionToMatchSlice(
    expectedEntities,
    secondResult,
    3 /*inclusive*/,
    8 /*exclusive*/
  );
}

async function searchEntities_pagingLastBetween({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities();
  const firstResult = await adminClientForMainPrincipal(server).searchEntities(
    { entityTypes: ['ReadOnly'] },
    { first: 20 }
  );
  assertOkResult(firstResult);
  const secondResult = await adminClientForMainPrincipal(server).searchEntities(
    { entityTypes: ['ReadOnly'] },
    {
      first: 20,
      after: firstResult.value?.edges[2].cursor,
      before: firstResult.value?.edges[8].cursor,
    }
  );
  assertAdminEntityConnectionToMatchSlice(
    expectedEntities,
    secondResult,
    3 /*inclusive*/,
    8 /*exclusive*/
  );
}

async function searchEntities_authKeySubject({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities(['subject']);
  const result = await adminClientForMainPrincipal(server).searchEntities({
    entityTypes: ['ReadOnly'],
    authKeys: ['subject'],
  });
  assertAdminEntityConnectionToMatchSlice(expectedEntities, result, 0, 25);
}

async function searchEntities_authKeyNoneAndSubject({
  server,
  readOnlyEntityRepository,
}: AdminEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalAdminEntities([
    'none',
    'subject',
  ]);
  const result = await adminClientForMainPrincipal(server).searchEntities({
    entityTypes: ['ReadOnly'],
    authKeys: ['none', 'subject'],
  });
  assertAdminEntityConnectionToMatchSlice(expectedEntities, result, 0, 25);
}
