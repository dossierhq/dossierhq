import 'dotenv/config';
//
import { faker } from '@faker-js/faker';
import type {
  AdminClient,
  AdminEntity,
  AdminEntityCreate,
  AdminEntityUpdate,
  AdminQuery,
  EntityReference,
  ErrorType,
  PromiseResult,
  Result,
} from '@jonasb/datadata-core';
import { AdminEntityStatus, assertIsDefined, copyEntity, notOk, ok } from '@jonasb/datadata-core';
import type { BenchPressOptions, BenchPressResult } from 'benchpress';
import { fileTimestamp, reportResult, runTest } from 'benchpress';
import * as path from 'node:path';
import type { DatabaseAdapterSelector } from './server.js';
import { initializeServer } from './server.js';

const outputFolder = path.join(process.cwd(), 'output');

interface CreateEntityOptions {
  publishable?: boolean;
}

function cleanupEntity(entity: AdminEntityCreate) {
  const cleanedUpEntity: AdminEntityCreate = copyEntity(entity, { fields: {} });
  for (const [key, value] of Object.entries(cleanedUpEntity.fields)) {
    if (value === undefined) {
      delete cleanedUpEntity.fields[key];
    }
  }
  return cleanedUpEntity;
}

function randomWeightedSelect<T>(values: T[], weights: number[]) {
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const originalRandom = faker.datatype.float({ max: weightSum });
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

function randomGenerate<T>(values: Array<T | (() => T)>, weights: number[]) {
  const selected = randomWeightedSelect(values, weights);
  return typeof selected === 'function' ? (selected as () => T)() : selected;
}

async function randomGenerateResult<T>(
  values: Array<Result<T, ErrorType> | (() => PromiseResult<T, ErrorType>)>,
  weights: number[]
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
  undefinedWeight: number
): T | undefined | null {
  return randomGenerate([value, null, undefined], [valueWeight, nullWeight, undefinedWeight]);
}

async function randomReference(
  adminClient: AdminClient,
  query?: AdminQuery
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
  query?: AdminQuery
): PromiseResult<
  AdminEntity,
  | typeof ErrorType.NotFound
  | typeof ErrorType.BadRequest
  | typeof ErrorType.NotAuthorized
  | typeof ErrorType.Generic
> {
  const result = await adminClient.sampleEntities(query, { count: 1 });
  if (result.isError()) return result;
  if (result.value.items.length === 0) {
    return notOk.NotFound('No such entity');
  }
  return ok(result.value.items[0]);
}

async function createEntity(
  adminClient: AdminClient,
  type: string,
  options?: CreateEntityOptions
): PromiseResult<AdminEntityCreate, ErrorType> {
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
  id: string
): PromiseResult<AdminEntityUpdate, ErrorType> {
  const createResult = await createEntity(adminClient, type);
  if (createResult.isError()) return createResult;

  const result: AdminEntityUpdate = {
    id,
    info: {
      name: createResult.value.info.name,
    },
    fields: createResult.value.fields,
  };
  return ok(result);
}

function createOrganization(_options?: CreateEntityOptions): AdminEntityCreate {
  const name = faker.company.name();
  return cleanupEntity({
    info: { authKey: 'none', type: 'Organization', name },
    fields: {
      name,
      organizationNumber: randomNullUndefined('000000-000', 99, 0, 1),
      address: createPostalAddress(),
      web: randomNullUndefined(faker.internet.url, 30, 0, 70),
    },
  });
}

async function createPerson(
  adminClient: AdminClient,
  options?: CreateEntityOptions
): PromiseResult<AdminEntityCreate, ErrorType> {
  const organizationResult = await randomGenerateResult(
    [
      ok(null),
      () =>
        randomAdminEntity(adminClient, {
          entityTypes: ['Organization'],
          status: options?.publishable
            ? [AdminEntityStatus.published, AdminEntityStatus.modified]
            : undefined,
        }),
    ],
    [10, 90]
  );
  if (organizationResult.isError()) return organizationResult;

  const name = `${faker.name.firstName()} ${faker.name.lastName()}`;
  return ok(
    cleanupEntity({
      info: { authKey: 'none', type: 'Person', name },
      fields: {
        name,
        address: createPostalAddress(),
        organization: organizationResult.value,
      },
    })
  );
}

function createPostalAddress() {
  return {
    type: 'PostalAddress',
    address1: faker.address.streetAddress(),
    address2: randomNullUndefined(faker.address.secondaryAddress, 50, 0, 50),
    city: faker.address.city(),
    zip: faker.address.zipCode(),
  };
}

async function testCreateOrganizationEntities(
  adminClient: AdminClient,
  options: BenchPressOptions
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
        status: [AdminEntityStatus.draft, AdminEntityStatus.withdrawn],
      });
      if (randomResult.isError()) return false;

      if (randomResult.value.info.type === 'Person' && randomResult.value.fields.organization) {
        const referencedOrgResult = await adminClient.getEntity(
          randomResult.value.fields.organization as EntityReference
        );
        if (referencedOrgResult.isError()) return false;

        if (
          referencedOrgResult.value.info.status === AdminEntityStatus.published ||
          referencedOrgResult.value.info.status === AdminEntityStatus.modified
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
  options: BenchPressOptions
) {
  return await runTest(async (clock) => {
    clock.start();

    const result = await adminClient.searchEntities({}, { first: 50 });

    clock.stop();

    return result.isOk() && result.value?.edges.length === 50;
  }, options);
}

async function report(
  resultPromise: Promise<BenchPressResult>,
  baseName: string,
  tsvFilename: string
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
  adminClient: AdminClient
) {
  const warmup = 30;
  const iterations = 1_000;

  await report(
    testCreateEntities(adminClient, {
      testName: 'create entity',
      variant,
      runName,
      warmup,
      iterations,
    }),
    `${runName}-${variant}-create-entity`,
    tsvFilename
  );

  await report(
    testCreateOrganizationEntities(adminClient, {
      testName: 'create entity organization',
      variant,
      runName,
      warmup,
      iterations,
    }),
    `${runName}-${variant}-create-entity-organization`,
    tsvFilename
  );

  await report(
    testCreatePersonEntities(adminClient, {
      testName: 'create entity person',
      variant,
      runName,
      warmup,
      iterations,
    }),
    `${runName}-${variant}-create-entity-person`,
    tsvFilename
  );

  await report(
    testCreateAndPublishEntity(adminClient, {
      testName: 'create and publish entity',
      variant,
      runName,
      warmup,
      iterations,
    }),
    `${runName}-${variant}-create-publish-entity`,
    tsvFilename
  );

  await report(
    testEditEntity(adminClient, {
      testName: 'edit entity',
      variant,
      runName,
      warmup,
      iterations,
    }),
    `${runName}-${variant}-edit-entity`,
    tsvFilename
  );

  await report(
    testArchiveEntity(adminClient, {
      testName: 'archive entity',
      variant,
      runName,
      warmup,
      iterations,
    }),
    `${runName}-${variant}-archive-entity`,
    tsvFilename
  );

  await report(
    testGetAdminEntity(adminClient, {
      testName: 'get admin entity',
      variant,
      runName,
      warmup,
      iterations,
    }),
    `${runName}-${variant}-get-admin-entity`,
    tsvFilename
  );

  await report(
    testSearchAdminEntitiesAnyFirst50(adminClient, {
      testName: 'search admin entities (any, first 50)',
      variant,
      runName,
      warmup,
      iterations,
    }),
    `${runName}-${variant}-search-admin-entities-any-first-50`,
    tsvFilename
  );
}

async function initializeAndRunTests(
  runName: string,
  variant: string,
  tsvFilename: string,
  databaseSelector: DatabaseAdapterSelector
) {
  const serverResult = await initializeServer(databaseSelector);
  if (serverResult.isError()) return serverResult;
  const server = serverResult.value;
  try {
    const sessionResult = await server.createSession({
      provider: 'test',
      identifier: 'principal1',
      defaultAuthKeys: ['none'],
    });
    if (sessionResult.isError()) return sessionResult;

    const adminClient = server.createAdminClient(sessionResult.value.context);

    await runTests(runName, variant, tsvFilename, adminClient);
  } finally {
    await server.shutdown();
  }
  return ok(undefined);
}

async function main(runName: string, tsvFilename: string) {
  assertIsDefined(process.env.EXAMPLES_BENCHMARK_DATABASE_URL);
  const variants: { variant: string; adapter: DatabaseAdapterSelector }[] = [
    {
      variant: 'postgres',
      adapter: { postgresConnectionString: process.env.EXAMPLES_BENCHMARK_DATABASE_URL },
    },
    {
      variant: 'sqlite',
      adapter: { sqliteDatabasePath: 'output/db.sqlite' },
    },
  ];
  for (const { variant, adapter } of variants) {
    const result = await initializeAndRunTests(runName, variant, tsvFilename, adapter);
    result.throwIfError();
  }
}

const runNameOrCiSwitch = process.argv[2] || '';
let runName;
let tsvFilename;
if (runNameOrCiSwitch === 'ci') {
  assertIsDefined(process.env.GITHUB_SHA);
  runName = process.env.GITHUB_SHA.slice(0, 8); // use short sha
  tsvFilename = 'ci-benchmark.tsv';
} else {
  const timestamp = fileTimestamp();
  runName = runNameOrCiSwitch ? `${timestamp}-${runNameOrCiSwitch}` : timestamp;
  tsvFilename = 'local-benchmark.tsv';
}

main(runName, tsvFilename).catch((error) => {
  console.warn(error);
  process.exitCode = 1;
});
