import type { UnboundTestFunction } from '../Builder';
import { assertSampledEntitiesArePartOfExpected } from '../shared-entity/SampleTestUtils';
import { publishedClientForMainPrincipal } from '../shared-entity/TestClients';
import type { PublishedEntityTestContext } from './PublishedEntityTestSuite';

export const SampleEntitiesSubSuite: UnboundTestFunction<PublishedEntityTestContext>[] = [
  sampleEntities_minimal,
  sampleEntities_authKeySubject,
  sampleEntities_authKeyNoneAndSubject,
];

async function sampleEntities_minimal({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities();
  const result = await publishedClientForMainPrincipal(server).sampleEntities({
    entityTypes: ['ReadOnly'],
  });
  assertSampledEntitiesArePartOfExpected(result, expectedEntities);
}

async function sampleEntities_authKeySubject({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities(['subject']);
  const result = await publishedClientForMainPrincipal(server).sampleEntities({
    entityTypes: ['ReadOnly'],
    authKeys: ['subject'],
  });
  assertSampledEntitiesArePartOfExpected(result, expectedEntities);
}

async function sampleEntities_authKeyNoneAndSubject({
  server,
  readOnlyEntityRepository,
}: PublishedEntityTestContext) {
  const expectedEntities = readOnlyEntityRepository.getMainPrincipalPublishedEntities([
    'none',
    'subject',
  ]);
  const result = await publishedClientForMainPrincipal(server).sampleEntities({
    entityTypes: ['ReadOnly'],
    authKeys: ['none', 'subject'],
  });
  assertSampledEntitiesArePartOfExpected(result, expectedEntities);
}
