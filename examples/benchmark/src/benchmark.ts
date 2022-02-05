import faker from '@faker-js/faker';
import {
  AdminClient,
  AdminEntityCreate,
  assertIsDefined,
  copyEntity,
  ok,
} from '@jonasb/datadata-core';
import {
  BenchPressOptions,
  BenchPressResult,
  fileTimestamp,
  reportResult,
  runTest,
} from 'benchpress';
import 'dotenv/config';
import path from 'path';
import { DatabaseAdapterSelector, initializeServer } from './server';

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

function randomNullUndefined<T>(
  value: T | (() => T),
  valueWeight: number,
  nullWeight: number,
  undefinedWeight: number
): T | undefined | null {
  return randomGenerate([value, null, undefined], [valueWeight, nullWeight, undefinedWeight]);
}

// async function randomReference(adminClient: AdminClient, query?: AdminQuery) {
//   const result = await adminClient.searchEntities(query);
//   if (result.isError()) return result;

// }

function createEntity(type: string): AdminEntityCreate {
  if (type === 'Organization') {
    return createOrganization();
  }
  if (type === 'Person') {
    return createPerson();
  }
  throw new Error('Unknown type: ' + type);
}

function createOrganization(): AdminEntityCreate {
  const name = faker.company.companyName();
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

function createPerson() {
  const name = `${faker.name.firstName()} ${faker.name.lastName()}`;
  return cleanupEntity({
    info: { authKey: 'none', type: 'Person', name },
    fields: {
      name,
      address: createPostalAddress(),
    },
  });
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
    const entity = createPerson();

    clock.start();

    const result = await adminClient.createEntity(entity);

    clock.stop();

    return result.isOk();
  }, options);
}

async function testCreateEntities(adminClient: AdminClient, options: BenchPressOptions) {
  return await runTest(async (clock) => {
    const type = randomWeightedSelect(['Organization', 'Person'], [30, 70]);
    const entity = createEntity(type);

    clock.start();

    const result = await adminClient.createEntity(entity);

    clock.stop();

    return result.isOk();
  }, options);
}

// async function testEditEntities(adminClient: AdminClient, options: BenchPressOptions) {
//   return await runTest(async (clock) => {
//     const existingEntity = await Core.getRandomEntity({
//       entityTypes: ['Organization', 'PlaceOfBusiness'],
//     });
//     if (!existingEntity) {
//       return false;
//     }
//     const { type } = existingEntity.item;
//     const { name: newName, entity: newEntity } = await createEntity(type);

//     clock.start();

//     await Core.updateEntity(session, existingEntity.item.uuid, newName, newEntity);

//     clock.stop();

//     return true;
//   }, options);
// }

// async function testGetEntity(options: BenchPressOptions) {
//   return await runTest(async (clock) => {
//     const reference = await randomReference({});
//     if (!reference) {
//       return false;
//     }

//     clock.start();

//     const entity = await Core.getEntity(reference.uuid);

//     clock.stop();

//     return entity !== null;
//   }, options);
// }

async function testGetEntities(adminClient: AdminClient, options: BenchPressOptions) {
  return await runTest(async (clock) => {
    clock.start();

    const result = await adminClient.searchEntities({}, { first: 50 });

    clock.stop();

    return result.isOk() && result.value?.edges.length === 50;
  }, options);
}

async function report(resultPromise: Promise<BenchPressResult>, baseName: string) {
  const result = await resultPromise;
  await reportResult(result, {
    percentiles: [50, 90, 95],
    folder: path.join(process.cwd(), 'output'),
    baseName,
    tsvFilename: 'crud-benchmark.tsv',
  });

  console.log();
}

async function runTests(runName: string, variant: string, adminClient: AdminClient) {
  const warmup = 30;
  const iterations = 1_000;

  await report(
    testCreateEntities(adminClient, {
      testName: 'create entities',
      variant,
      runName,
      warmup,
      iterations,
    }),
    `${runName}-${variant}-create-entity`
  );

  await report(
    testCreateOrganizationEntities(adminClient, {
      testName: 'create organization',
      variant,
      runName,
      warmup,
      iterations,
    }),
    `${runName}-${variant}-create-organization`
  );

  await report(
    testCreatePersonEntities(adminClient, {
      testName: 'create person',
      variant,
      runName,
      warmup,
      iterations,
    }),
    `${runName}-${variant}-create-person`
  );

  // await report(
  //   testEditEntities(adminClient, {
  //     testName: 'edit entity',
  //     runName,
  //     warmup,
  //     iterations,
  //   }),
  //   `${runName}-${variant}-edit-entity`
  // );

  // await report(
  //   testGetEntity({ testName: 'get entity', runName, warmup, iterations }),
  //   `${runName}-${variant}-get-entity`
  // );

  await report(
    testGetEntities(adminClient, {
      testName: 'get entities',
      variant,
      runName,
      warmup,
      iterations,
    }),
    `${runName}-${variant}-get-entities`
  );

  // await report(
  //   testDeleteEntities(adminClient, {
  //     testName: 'delete entity',
  //     runName,
  //     warmup,
  //     iterations,
  //   }),
  //   `${runName}-${variant}-delete-entity`
  // );
}

async function initializeAndRunTests(
  runName: string,
  variant: string,
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

    await runTests(runName, variant, adminClient);
  } finally {
    await server.shutdown();
  }
  return ok(undefined);
}

async function main(runName: string) {
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
    const fullRunName = runName ? `${timestamp}-${runName}` : timestamp;
    const result = await initializeAndRunTests(fullRunName, variant, adapter);
    result.throwIfError();
  }
}

const runName = process.argv[2] || '';
const timestamp = fileTimestamp();

main(runName).catch((error) => {
  console.warn(error);
  process.exitCode = 1;
});
