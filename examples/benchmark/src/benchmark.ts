import assert from 'node:assert/strict';
import {
  copyEntity,
  EntityStatus,
  notOk,
  ok,
  type DossierClient,
  type Entity,
  type EntityCreate,
  type EntityReference,
  type EntitySharedQuery,
  type EntityUpdate,
  type ErrorType,
  type PromiseResult,
  type Result,
} from '@dossierhq/core';
import type { DatabaseAdapter, Server } from '@dossierhq/server';
import { faker } from '@faker-js/faker';
import {
  fileTimestamp,
  reportResult,
  runTest,
  type BenchPressOptions,
  type BenchPressResult,
} from 'benchpress';
import { initializeServer } from './server.js';

const outputFolder = 'output';

interface CreateEntityOptions {
  publishable?: boolean;
}

function cleanupEntity(entity: EntityCreate) {
  const cleanedUpEntity: EntityCreate = copyEntity(entity, { fields: {} });
  for (const [key, value] of Object.entries(cleanedUpEntity.fields)) {
    if (value === undefined) {
      delete cleanedUpEntity.fields[key];
    }
  }
  return cleanedUpEntity;
}

function randomWeightedSelect<T>(values: T[], weights: number[]) {
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const originalRandom = faker.number.float({ max: weightSum });
  let remainingRandom = originalRandom;
  for (let i = 0; i < weights.length; i += 1) {
    const weight = weights[i];
    if (remainingRandom <= weight) {
      return values[i];
    }
    remainingRandom -= weight;
  }
  throw new Error('Unexpected, remaining random: ' + remainingRandom);
}

function randomGenerate<T>(values: (T | (() => T))[], weights: number[]) {
  const selected = randomWeightedSelect(values, weights);
  return typeof selected === 'function' ? (selected as () => T)() : selected;
}

async function randomGenerateResult<T>(
  values: (Result<T, ErrorType> | (() => PromiseResult<T, ErrorType>))[],
  weights: number[],
): PromiseResult<T, ErrorType> {
  const selected = randomWeightedSelect(values, weights);
  return typeof selected === 'function'
    ? await (selected as () => PromiseResult<T, ErrorType>)()
    : selected;
}

function randomNullUndefined<T>(
  value: T | (() => T),
  valueWeight: number,
  nullWeight: number,
  undefinedWeight: number,
): T | undefined | null {
  return randomGenerate([value, null, undefined], [valueWeight, nullWeight, undefinedWeight]);
}

async function randomReference(
  client: DossierClient,
  query?: EntitySharedQuery,
): PromiseResult<
  EntityReference,
  | typeof ErrorType.NotFound
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  const result = await randomAdminEntity(client, query);
  if (result.isError()) return result;
  return ok({ id: result.value.id });
}

async function randomAdminEntity(
  client: DossierClient,
  query?: EntitySharedQuery,
): PromiseResult<
  Entity,
  | typeof ErrorType.NotFound
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  const result = await client.getEntitiesSample(query, { count: 1 });
  if (result.isError()) return result;
  if (result.value.items.length === 0) {
    return notOk.NotFound('No such entity');
  }
  return ok(result.value.items[0]);
}

async function createEntity(
  client: DossierClient,
  type: string,
  options?: CreateEntityOptions,
): PromiseResult<EntityCreate, ErrorType> {
  if (type === 'Organization') {
    return ok(createOrganization(options));
  }
  if (type === 'Person') {
    return await createPerson(client, options);
  }
  return notOk.BadRequest(`Type ${type} not supported`);
}

async function updateEntity(
  client: DossierClient,
  type: string,
  id: string,
): PromiseResult<EntityUpdate, ErrorType> {
  const createResult = await createEntity(client, type);
  if (createResult.isError()) return createResult;

  const result: EntityUpdate = {
    id,
    info: {
      name: createResult.value.info.name,
    },
    fields: createResult.value.fields,
  };
  return ok(result);
}

function createOrganization(_options?: CreateEntityOptions): EntityCreate {
  const name = faker.company.name();
  return cleanupEntity({
    info: { type: 'Organization', name },
    fields: {
      name,
      organizationNumber: randomNullUndefined('000000-000', 99, 0, 1),
      address: createPostalAddress(),
      web: randomNullUndefined(faker.internet.url(), 30, 0, 70),
    },
  });
}

async function createPerson(
  client: DossierClient,
  options?: CreateEntityOptions,
): PromiseResult<EntityCreate, ErrorType> {
  const organizationResult = await randomGenerateResult(
    [
      ok(null),
      () =>
        randomAdminEntity(client, {
          entityTypes: ['Organization'],
          status: options?.publishable
            ? [EntityStatus.published, EntityStatus.modified]
            : undefined,
        }),
    ],
    [10, 90],
  );
  if (organizationResult.isError()) return organizationResult;

  const name = `${faker.person.firstName()} ${faker.person.lastName()}`;
  return ok(
    cleanupEntity({
      info: { type: 'Person', name },
      fields: {
        name,
        address: createPostalAddress(),
        organization: organizationResult.value,
      },
    }),
  );
}

function createPostalAddress() {
  return {
    type: 'PostalAddress',
    address1: faker.location.streetAddress(),
    address2: randomNullUndefined(faker.location.secondaryAddress(), 50, 0, 50),
    city: faker.location.city(),
    zip: faker.location.zipCode(),
  };
}

async function testCreateOrganizationEntities(client: DossierClient, options: BenchPressOptions) {
  return await runTest(async (clock) => {
    const entity = createOrganization();

    clock.start();

    const result = await client.createEntity(entity);

    clock.stop();

    return result.isOk();
  }, options);
}

async function testCreatePersonEntities(client: DossierClient, options: BenchPressOptions) {
  return await runTest(async (clock) => {
    const entityResult = await createPerson(client);
    if (entityResult.isError()) return false;

    clock.start();

    const result = await client.createEntity(entityResult.value);

    clock.stop();

    return result.isOk();
  }, options);
}

async function testCreateEntities(client: DossierClient, options: BenchPressOptions) {
  return await runTest(async (clock) => {
    const type = randomWeightedSelect(['Organization', 'Person'], [30, 70]);
    const entityResult = await createEntity(client, type);
    if (entityResult.isError()) return false;

    clock.start();

    const result = await client.createEntity(entityResult.value);

    clock.stop();

    return result.isOk();
  }, options);
}

async function testCreateAndPublishEntity(client: DossierClient, options: BenchPressOptions) {
  return await runTest(async (clock) => {
    const type = randomWeightedSelect(['Organization', 'Person'], [30, 70]);
    const entityResult = await createEntity(client, type, { publishable: true });
    if (entityResult.isError()) return false;

    clock.start();

    const result = await client.createEntity(entityResult.value, { publish: true });

    clock.stop();

    return result.isOk();
  }, options);
}

async function testEditEntity(client: DossierClient, options: BenchPressOptions) {
  return await runTest(async (clock) => {
    const randomResult = await randomAdminEntity(client, {
      entityTypes: ['Organization', 'Person'],
    });
    if (randomResult.isError()) return false;
    const entity = randomResult.value;
    const entityUpdateResult = await updateEntity(client, entity.info.type, entity.id);
    if (entityUpdateResult.isError()) return false;

    clock.start();

    const updateResult = await client.updateEntity(entityUpdateResult.value);

    clock.stop();

    return updateResult.isOk();
  }, options);
}

async function testArchiveEntity(client: DossierClient, options: BenchPressOptions) {
  return await runTest(async (clock) => {
    let entity = null;
    while (!entity) {
      const randomResult = await randomAdminEntity(client, {
        entityTypes: ['Organization', 'Person'],
        status: [EntityStatus.draft, EntityStatus.withdrawn],
      });
      if (randomResult.isError()) return false;

      if (randomResult.value.info.type === 'Person' && randomResult.value.fields.organization) {
        const referencedOrgResult = await client.getEntity(
          randomResult.value.fields.organization as EntityReference,
        );
        if (referencedOrgResult.isError()) return false;

        if (
          referencedOrgResult.value.info.status === EntityStatus.published ||
          referencedOrgResult.value.info.status === EntityStatus.modified
        ) {
          // Need to find another Person
          continue;
        }
      }
      entity = { id: randomResult.value.id };
    }

    clock.start();

    const archiveResult = await client.archiveEntity(entity);

    clock.stop();

    return archiveResult.isOk();
  }, options);
}

async function testGetAdminEntity(client: DossierClient, options: BenchPressOptions) {
  return await runTest(async (clock) => {
    const referenceResult = await randomReference(client);
    if (referenceResult.isError()) {
      return false;
    }

    clock.start();

    const entityResult = await client.getEntity(referenceResult.value);

    clock.stop();

    return entityResult.isOk();
  }, options);
}

async function testSearchAdminEntitiesAnyFirst50(
  client: DossierClient,
  options: BenchPressOptions,
) {
  return await runTest(async (clock) => {
    clock.start();

    const result = await client.getEntities({}, { first: 50 });

    clock.stop();

    return result.isOk() && result.value?.edges.length === 50;
  }, options);
}

async function report(
  resultPromise: Promise<BenchPressResult>,
  baseName: string,
  tsvFilename: string,
) {
  const result = await resultPromise;
  await reportResult(result, {
    percentiles: [50, 90, 95],
    folder: outputFolder,
    baseName,
    tsvFilename,
  });

  console.log();
}

async function runTests(
  runName: string,
  variant: string,
  tsvFilename: string,
  server: Server,
  client: DossierClient,
) {
  const warmup = 30;
  const iterations = 1_000;

  (await server.optimizeDatabase({ all: true })).throwIfError();

  await report(
    testCreateEntities(client, {
      testName: 'create entity',
      variant,
      runName,
      warmup,
      iterations,
    }),
    `${runName}-${variant}-create-entity`,
    tsvFilename,
  );

  (await server.optimizeDatabase({ all: true })).throwIfError();

  await report(
    testCreateOrganizationEntities(client, {
      testName: 'create entity organization',
      variant,
      runName,
      warmup,
      iterations,
    }),
    `${runName}-${variant}-create-entity-organization`,
    tsvFilename,
  );

  (await server.optimizeDatabase({ all: true })).throwIfError();

  await report(
    testCreatePersonEntities(client, {
      testName: 'create entity person',
      variant,
      runName,
      warmup,
      iterations,
    }),
    `${runName}-${variant}-create-entity-person`,
    tsvFilename,
  );

  (await server.optimizeDatabase({ all: true })).throwIfError();

  await report(
    testCreateAndPublishEntity(client, {
      testName: 'create and publish entity',
      variant,
      runName,
      warmup,
      iterations,
    }),
    `${runName}-${variant}-create-publish-entity`,
    tsvFilename,
  );

  (await server.optimizeDatabase({ all: true })).throwIfError();

  await report(
    testEditEntity(client, {
      testName: 'edit entity',
      variant,
      runName,
      warmup,
      iterations,
    }),
    `${runName}-${variant}-edit-entity`,
    tsvFilename,
  );

  (await server.optimizeDatabase({ all: true })).throwIfError();

  await report(
    testArchiveEntity(client, {
      testName: 'archive entity',
      variant,
      runName,
      warmup,
      iterations,
    }),
    `${runName}-${variant}-archive-entity`,
    tsvFilename,
  );

  (await server.optimizeDatabase({ all: true })).throwIfError();

  await report(
    testGetAdminEntity(client, {
      testName: 'get admin entity',
      variant,
      runName,
      warmup,
      iterations,
    }),
    `${runName}-${variant}-get-admin-entity`,
    tsvFilename,
  );

  (await server.optimizeDatabase({ all: true })).throwIfError();

  await report(
    testSearchAdminEntitiesAnyFirst50(client, {
      testName: 'search admin entities (any, first 50)',
      variant,
      runName,
      warmup,
      iterations,
    }),
    `${runName}-${variant}-search-admin-entities-any-first-50`,
    tsvFilename,
  );
}

export async function initializeAndRunTests({
  runName,
  variant,
  databaseAdapter,
  ciOrLocal,
}: {
  runName: string;
  variant: string;
  databaseAdapter: DatabaseAdapter;
  ciOrLocal: { githubSha: string | undefined } | 'local';
}) {
  const isCI = typeof ciOrLocal === 'object';
  if (isCI) {
    assert(ciOrLocal.githubSha);
    runName = ciOrLocal.githubSha.slice(0, 8); // use short sha
  } else {
    const timestamp = fileTimestamp();
    runName = runName ? `${timestamp}-${runName}` : timestamp;
  }

  const serverResult = await initializeServer(databaseAdapter);
  if (serverResult.isError()) return serverResult;
  const server = serverResult.value;
  try {
    const sessionResult = await server.createSession({
      provider: 'test',
      identifier: 'principal1',
    });
    if (sessionResult.isError()) return sessionResult;

    const client = server.createDossierClient(sessionResult.value.context);

    const tsvFilename = isCI ? 'ci-benchmark.tsv' : 'local-benchmark.tsv';
    await runTests(runName, variant, tsvFilename, server, client);
  } finally {
    await server.shutdown();
  }
  return ok(undefined);
}
