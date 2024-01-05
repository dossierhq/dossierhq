import { assertResultValue } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import type { PublishedEntityTestContext } from './PublishedEntityTestSuite.js';

export const GetEntitiesTotalCountSubSuite: UnboundTestFunction<PublishedEntityTestContext>[] = [
  getEntitiesTotalCount_minimal,
  getEntitiesTotalCount_authKeySubject,
  getEntitiesTotalCount_authKeyNoneAndSubject,
];

async function getEntitiesTotalCount_minimal({
  clientProvider,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const result = await clientProvider.publishedClient().getEntitiesTotalCount({
    entityTypes: ['ReadOnly'],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getEntitiesTotalCount_authKeySubject({
  clientProvider,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities(['subject']);
  const result = await clientProvider.publishedClient().getEntitiesTotalCount({
    entityTypes: ['ReadOnly'],
    authKeys: ['subject'],
  });
  assertResultValue(result, expectedEntities.length);
}

async function getEntitiesTotalCount_authKeyNoneAndSubject({
  clientProvider,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities([
    'none',
    'subject',
  ]);
  const result = await clientProvider.publishedClient().getEntitiesTotalCount({
    entityTypes: ['ReadOnly'],
    authKeys: ['none', 'subject'],
  });
  assertResultValue(result, expectedEntities.length);
}
