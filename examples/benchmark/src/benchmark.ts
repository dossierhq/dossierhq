import type {
  AdminClient,
  Entity,
  EntityCreate,
  EntitySharedQuery,
  EntityUpdate,
  EntityReference,
  ErrorType,
  PromiseResult,
  Result,
} from '@dossierhq/core';
import { EntityStatus, copyEntity, notOk, ok } from '@dossierhq/core';
import type { DatabaseAdapter, Server } from '@dossierhq/server';
import { faker } from '@faker-js/faker';
import type { BenchPressOptions, BenchPressResult } from 'benchpress';
import { fileTimestamp, reportResult, runTest } from 'benchpress';
import assert from 'node:assert/strict';
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
  adminClient: AdminClient,
  query?: EntitySharedQuery,
): PromiseResult<
  EntityReference,
  | typeof ErrorType.NotFound
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  const result = await randomAdminEntity(adminClient, query);
  if (result.isError()) return result;
  return ok({ id: result.value.id });
}

async function randomAdminEntity(
  adminClient: AdminClient,
  query?: EntitySharedQuery,
): PromiseResult<
  Entity,
  | typeof ErrorType.NotFound
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  const result = await adminClient.getEntitiesSample(query, { count: 1 });
  if (result.isError()) return result;
  if (result.value.items.length === 0) {
    return notOk.NotFound('No such entity');
  }
  return ok(result.value.items[0]);
}

async function createEntity(
  adminClient: AdminClient,
  type: string,
  options?: CreateEntityOptions,
): PromiseResult<EntityCreate, ErrorType> {
  if (type === 'Organization') {
    return ok(createOrganization(options));
  }
  if (type === 'Person') {
    return await createPerson(adminClient, options);
  }
  return notOk.BadRequest(`Type ${type} not supported`);
}

async function updateEntity(
  adminClient: AdminClient,
  type: string,
  id: string,
): PromiseResult<EntityUpdate, ErrorType> {
  const createResult = await createEntity(adminClient, type);
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
  adminClient: AdminClient,
  options?: CreateEntityOptions,
): PromiseResult<EntityCreate, ErrorType> {
  const organizationResult = await randomGenerateResult(
    [
      ok(null),
      () =>
        randomAdminEntity(adminClient, {
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

async function testCreateOrganizationEntities(
  adminClient: AdminClient,
  options: BenchPressOptions,
) {
  return await runTest(async (clock) => {
    const entity = createOrganization();

    clock.start();

    const result = await adminClient.createEntity(entity);

    clock.stop();

    return result.isOk();
  }, options);
}

async function testCreatePersonEntities(adminClient: AdminClient, options: BenchPressOptions) {
  return await runTest(async (clock) => {
    const entityResult = await createPerson(adminClient);
    if (entityResult.isError()) return false;

    clock.start();

    const result = await adminClient.createEntity(entityResult.value);

    clock.stop();

    return result.isOk();
  }, options);
}

async function testCreateEntities(adminClient: AdminClient, options: BenchPressOptions) {
  return await runTest(async (clock) => {
    const type = randomWeightedSelect(['Organization', 'Person'], [30, 70]);
    const entityResult = await createEntity(adminClient, type);
    if (entityResult.isError()) return false;

    clock.start();

    const result = await adminClient.createEntity(entityResult.value);

    clock.stop();

    return result.isOk();
  }, options);
}

async function testCreateAndPublishEntity(adminClient: AdminClient, options: BenchPressOptions) {
  return await runTest(async (clock) => {
    const type = randomWeightedSelect(['Organization', 'Person'], [30, 70]);
    const entityResult = await createEntity(adminClient, type, { publishable: true });
    if (entityResult.isError()) return false;

    clock.start();

    const result = await adminClient.createEntity(entityResult.value, { publish: true });

    clock.stop();

    return result.isOk();
  }, options);
}

async function testEditEntity(adminClient: AdminClient, options: BenchPressOptions) {
  return await runTest(async (clock) => {
    const randomResult = await randomAdminEntity(adminClient, {
      entityTypes: ['Organization', 'Person'],
    });
    if (randomResult.isError()) return false;
    const entity = randomResult.value;
    const entityUpdateResult = await updateEntity(adminClient, entity.info.type, entity.id);
    if (entityUpdateResult.isError()) return false;

    clock.start();

    const updateResult = await adminClient.updateEntity(entityUpdateResult.value);

    clock.stop();

    return updateResult.isOk();
  }, options);
}

async function testArchiveEntity(adminClient: AdminClient, options: BenchPressOptions) {
  return await runTest(async (clock) => {
    let entity = null;
    while (!entity) {
      const randomResult = await randomAdminEntity(adminClient, {
        entityTypes: ['Organization', 'Person'],
        status: [EntityStatus.draft, EntityStatus.withdrawn],
      });
      if (randomResult.isError()) return false;

      if (randomResult.value.info.type === 'Person' && randomResult.value.fields.organization) {
        const referencedOrgResult = await adminClient.getEntity(
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

    const archiveResult = await adminClient.archiveEntity(entity);

    clock.stop();

    return archiveResult.isOk();
  }, options);
}

async function testGetAdminEntity(adminClient: AdminClient, options: BenchPressOptions) {
  return await runTest(async (clock) => {
    const referenceResult = await randomReference(adminClient);
    if (referenceResult.isError()) {
      return false;
    }

    clock.start();

    const entityResult = await adminClient.getEntity(referenceResult.value);

    clock.stop();

    return entityResult.isOk();
  }, options);
}

async function testSearchAdminEntitiesAnyFirst50(
  adminClient: AdminClient,
  options: BenchPressOptions,
) {
  return await runTest(async (clock) => {
    clock.start();

    const result = await adminClient.getEntities({}, { first: 50 });

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
  adminClient: AdminClient,
) {
  const warmup = 30;
  const iterations = 1_000;

  (await server.optimizeDatabase({ all: true })).throwIfError();

  await report(
    testCreateEntities(adminClient, {
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
    testCreateOrganizationEntities(adminClient, {
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
    testCreatePersonEntities(adminClient, {
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
    testCreateAndPublishEntity(adminClient, {
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
    testEditEntity(adminClient, {
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
    testArchiveEntity(adminClient, {
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
    testGetAdminEntity(adminClient, {
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
    testSearchAdminEntitiesAnyFirst50(adminClient, {
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

    const adminClient = server.createAdminClient(sessionResult.value.context);

    const tsvFilename = isCI ? 'ci-benchmark.tsv' : 'local-benchmark.tsv';
    await runTests(runName, variant, tsvFilename, server, adminClient);
  } finally {
    await server.shutdown();
  }
  return ok(undefined);
}
