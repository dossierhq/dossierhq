import { assertResultValue } from '../Asserts.js';
import type { UnboundTestFunction } from '../Builder.js';
import type { PublishedEntityTestContext } from './PublishedEntityTestSuite.js';

export const GetEntitiesTotalCountSubSuite: UnboundTestFunction<PublishedEntityTestContext>[] = [
  getEntitiesTotalCount_minimal,
  getEntitiesTotalCount_authKeySubject,
  getEntitiesTotalCount_authKeySubjectFromReadonlyRandom,
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

async function getEntitiesTotalCount_authKeySubjectFromReadonlyRandom({
  clientProvider,
}: PublishedEntityTestContext) {
  const publishedClient = clientProvider.publishedClient('random', 'readonly');
  const result = await publishedClient.getEntitiesTotalCount({ authKeys: ['subject'] });
  assertResultValue(result, 0);
}

async function getEntitiesTotalCount_authKeyNoneAndSubject({
  clientProvider,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities([
    '',
    'subject',
  ]);
  const result = await clientProvider.publishedClient().getEntitiesTotalCount({
    entityTypes: ['ReadOnly'],
    authKeys: ['', 'subject'],
  });
  assertResultValue(result, expectedEntities.length);
}
