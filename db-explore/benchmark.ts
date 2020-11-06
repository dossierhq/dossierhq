#!/usr/bin/env npx ts-node
require('dotenv').config();
import faker from 'faker';
import path from 'path';
import * as BenchPress from './BenchPress';
import * as Core from './CoreB';
import * as Db from './Db';

function cleanupEntity(entity: Record<string, unknown>) {
  const cleanedUpEntity: Record<string, unknown> = {};
  // TODO remove and add support to core?
  for (const [key, value] of Object.entries(entity)) {
    if (value !== null && value !== undefined) {
      cleanedUpEntity[key] = value;
    }
  }
  return cleanedUpEntity;
}

function randomWeightedSelect<T>(values: T[], weights: number[]) {
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const originalRandom = faker.random.float({ max: weightSum });
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
  return randomGenerate(
    [value, null, undefined],
    [valueWeight, nullWeight, undefinedWeight]
  );
}

async function randomReference(query: Core.Query) {
  const result = await Core.getRandomEntity(query);
  return !result ? null : { uuid: result.item.uuid };
}

async function createEntity(
  type: string
): Promise<{ name: string; entity: Record<string, unknown> }> {
  if (type === 'Organization') {
    return createOrganization();
  }
  if (type === 'PlaceOfBusiness') {
    return await createPlaceOfBusiness();
  }
  throw new Error('Unknown type: ' + type);
}

function createOrganization() {
  const name = faker.company.companyName();
  const entity = cleanupEntity({
    name,
    organizationNumber: randomNullUndefined('000000-000', 99, 0, 1),
    address1: faker.address.streetAddress(),
    address2: randomNullUndefined(faker.address.secondaryAddress, 50, 0, 50),
    city: faker.address.city(),
    zip: faker.address.zipCode(),
    web: randomNullUndefined(faker.internet.url, 30, 0, 70),
  });
  return { name, entity };
}

async function createPlaceOfBusiness() {
  const name = faker.company.companyName();
  const entity = cleanupEntity({
    name,
    address1: faker.address.streetAddress(),
    address2: randomNullUndefined(faker.address.secondaryAddress, 50, 0, 50),
    city: faker.address.city(),
    zip: faker.address.zipCode(),
    phone: randomNullUndefined(faker.phone.phoneNumber, 30, 0, 70),
    email: randomNullUndefined(faker.internet.email, 30, 0, 70),
    facebook: randomNullUndefined(
      () => `https://facebook.com/${faker.lorem.slug()}`,
      30,
      0,
      70
    ),
    instagram: randomNullUndefined(
      () => `https://instagram.com/${faker.lorem.slug()}`,
      30,
      0,
      70
    ),
    web: randomNullUndefined(faker.internet.url, 30, 0, 70),
    owner: await randomNullUndefined(
      () => randomReference({ entityTypes: ['Organization'] }),
      90,
      0,
      10
    ),
  });
  return { name, entity };
}

async function testCreateOrganizationEntities(
  session: Core.Session,
  options: BenchPress.BenchPressOptions
) {
  return await BenchPress.runTest(async (clock) => {
    const { name, entity } = createOrganization();

    clock.start();

    await Core.createEntity(session, 'Organization', name, entity);

    clock.stop();

    return true;
  }, options);
}

async function testCreatePlaceOfBusinessEntities(
  session: Core.Session,
  options: BenchPress.BenchPressOptions
) {
  return await BenchPress.runTest(async (clock) => {
    const { name, entity } = await createPlaceOfBusiness();

    clock.start();

    await Core.createEntity(session, 'PlaceOfBusiness', name, entity);

    clock.stop();

    return true;
  }, options);
}

async function testCreateEntities(
  session: Core.Session,
  options: BenchPress.BenchPressOptions
) {
  return await BenchPress.runTest(async (clock) => {
    const type = randomWeightedSelect(
      ['Organization', 'PlaceOfBusiness'],
      [30, 70]
    );
    const { name, entity } = await createEntity(type);

    clock.start();

    await Core.createEntity(session, type, name, entity);

    clock.stop();

    return true;
  }, options);
}

async function testEditEntities(
  session: Core.Session,
  options: BenchPress.BenchPressOptions
) {
  return await BenchPress.runTest(async (clock) => {
    const existingEntity = await Core.getRandomEntity({
      entityTypes: ['Organization', 'PlaceOfBusiness'],
    });
    if (!existingEntity) {
      return false;
    }
    const { type } = existingEntity.item;
    const { name: newName, entity: newEntity } = await createEntity(type);

    clock.start();

    await Core.updateEntity(
      session,
      existingEntity.item.uuid,
      newName,
      newEntity
    );

    clock.stop();

    return true;
  }, options);
}

async function testGetEntity(options: BenchPress.BenchPressOptions) {
  return await BenchPress.runTest(async (clock) => {
    const reference = await randomReference({});
    if (!reference) {
      return false;
    }

    clock.start();

    const entity = await Core.getEntity(reference.uuid);

    clock.stop();

    return entity !== null;
  }, options);
}

async function testGetEntities(options: BenchPress.BenchPressOptions) {
  return await BenchPress.runTest(async (clock) => {
    clock.start();

    const entities = await Core.getAllEntities({}, { first: 50 });

    clock.stop();

    return entities.items.length === 50;
  }, options);
}

async function testDeleteEntities(
  session: Core.Session,
  options: BenchPress.BenchPressOptions
) {
  return await BenchPress.runTest(async (clock) => {
    const reference = await randomReference({});
    if (!reference) {
      return false;
    }

    clock.start();

    await Core.deleteEntity(session, reference.uuid);

    clock.stop();

    return true;
  }, options);
}

async function report(
  resultPromise: Promise<BenchPress.BenchPressResult>,
  baseName: string
) {
  const result = await resultPromise;
  await BenchPress.reportResult(result, {
    percentiles: [50, 90, 95],
    folder: path.join(process.cwd(), 'output'),
    baseName,
    tsvFilename: 'crud-benchmark.tsv',
  });

  console.log();
}

async function main(runName: string) {
  const iterations = 1_000;
  const session = await Core.createSessionForPrincipal('sys', '12345');

  await report(
    testCreateEntities(session, {
      testName: 'create entities',
      runName,
      warmup: 30,
      iterations,
    }),
    `${runName}-create-entity`
  );

  await report(
    testCreateOrganizationEntities(session, {
      testName: 'create organization',
      runName,
      warmup: 30,
      iterations,
    }),
    `${runName}-create-organization`
  );

  await report(
    testCreatePlaceOfBusinessEntities(session, {
      testName: 'create place-of-business',
      runName,
      warmup: 30,
      iterations,
    }),
    `${runName}-create-place-of-business`
  );

  await report(
    testEditEntities(session, {
      testName: 'edit entity',
      runName,
      warmup: 30,
      iterations,
    }),
    `${runName}-edit-entity`
  );

  await report(
    testGetEntity({ testName: 'get entity', runName, warmup: 30, iterations }),
    `${runName}-get-entity`
  );

  await report(
    testGetEntities({
      testName: 'get entities',
      runName,
      warmup: 30,
      iterations,
    }),
    `${runName}-get-entities`
  );

  await report(
    testDeleteEntities(session, {
      testName: 'delete entity',
      runName,
      warmup: 30,
      iterations,
    }),
    `${runName}-delete-entity`
  );
}

if (require.main === module) {
  const runName = process.argv[2] || '';
  const timestamp = BenchPress.fileTimestamp();
  const fullRunName = runName ? `${timestamp}-${runName}` : timestamp;
  main(fullRunName)
    .then(Db.shutDownAsync)
    .catch((error) => {
      console.warn(error);
      process.exitCode = 1;
    });
}
