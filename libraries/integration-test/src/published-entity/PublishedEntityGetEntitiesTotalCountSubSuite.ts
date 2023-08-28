import { assertResultValue } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import { publishedClientForMainPrincipal } from '../shared-entity/TestClients.js';
import type { PublishedEntityTestContext } from './PublishedEntityTestSuite.js';

export const GetEntitiesTotalCountSubSuite: UnboundTestFunction<PublishedEntityTestContext>[] = [
  getEntitiesTotalCount_minimal,
  getEntitiesTotalCount_authKeySubject,
  getEntitiesTotalCount_authKeyNoneAndSubject,
];

async function getEntitiesTotalCount_minimal({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const result = await publishedClientForMainPrincipal(server).getEntitiesTotalCount({
    entityTypes: ['ReadOnly'],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getEntitiesTotalCount_authKeySubject({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities(['subject']);
  const result = await publishedClientForMainPrincipal(server).getEntitiesTotalCount({
    entityTypes: ['ReadOnly'],
    authKeys: ['subject'],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getEntitiesTotalCount_authKeyNoneAndSubject({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities([
    'none',
    'subject',
  ]);
  const result = await publishedClientForMainPrincipal(server).getEntitiesTotalCount({
    entityTypes: ['ReadOnly'],
    authKeys: ['none', 'subject'],
  });
  assertResultValue(result, expectedEntities.length);
}
