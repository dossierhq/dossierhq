import { assertResultValue } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import { publishedClientForMainPrincipal } from '../shared-entity/TestClients.js';
import type { PublishedEntityTestContext } from './PublishedEntityTestSuite.js';

export const GetTotalCountSubSuite: UnboundTestFunction<PublishedEntityTestContext>[] = [
  getTotalCount_minimal,
  getTotalCount_authKeySubject,
  getTotalCount_authKeyNoneAndSubject,
];

async function getTotalCount_minimal({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const result = await publishedClientForMainPrincipal(server).getTotalCount({
    entityTypes: ['ReadOnly'],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getTotalCount_authKeySubject({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities(['subject']);
  const result = await publishedClientForMainPrincipal(server).getTotalCount({
    entityTypes: ['ReadOnly'],
    authKeys: ['subject'],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getTotalCount_authKeyNoneAndSubject({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities([
    'none',
    'subject',
  ]);
  const result = await publishedClientForMainPrincipal(server).getTotalCount({
    entityTypes: ['ReadOnly'],
    authKeys: ['none', 'subject'],
  });
  assertResultValue(result, expectedEntities.length);
}
