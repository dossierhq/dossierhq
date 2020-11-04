#!/usr/bin/env npx ts-node
require('dotenv').config();
import faker from 'faker';
import path from 'path';
import * as BenchPress from './BenchPress';
import * as Core from './Core';
import * as Db from './Db';

const PERCENTILES = [50, 90, 95];

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

async function createOrganization(session: Core.Session, timestamp: string) {
  const result = await BenchPress.runTest(
    async (clock) => {
      const name = faker.company.companyName();
      const entity = cleanupEntity({
        name,
        organizationNumber: randomNullUndefined('000000-000', 99, 0, 1),
        address1: faker.address.streetAddress(),
        address2: randomNullUndefined(
          faker.address.secondaryAddress,
          50,
          0,
          50
        ),
        city: faker.address.city(),
        zip: faker.address.zipCode(),
        web: randomNullUndefined(faker.internet.url, 30, 0, 70),
      });

      clock.start();
      await Core.createEntity(session, 'Organization', name, entity);

      clock.stop();
      return true;
    },
    { warmup: 30, iterations: 10000 }
  );

  await BenchPress.reportResult(result, {
    name: 'create organization',
    percentiles: PERCENTILES,
    folder: path.join(__dirname, 'output'),
    baseName: `create-organization-${timestamp}`,
  });
}

async function createPlaceOfBusiness(session: Core.Session, timestamp: string) {
  const result = await BenchPress.runTest(
    async (clock) => {
      const name = faker.company.companyName();
      const entity = cleanupEntity({
        name,
        address1: faker.address.streetAddress(),
        address2: randomNullUndefined(
          faker.address.secondaryAddress,
          50,
          0,
          50
        ),
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

      clock.start();

      await Core.createEntity(session, 'PlaceOfBusiness', name, entity);
      clock.stop();
      return true;
    },
    { warmup: 30, iterations: 10000 }
  );

  await BenchPress.reportResult(result, {
    name: 'create place-of-business',
    percentiles: PERCENTILES,
    folder: path.join(__dirname, 'output'),
    baseName: `create-place-of-business-${timestamp}`,
  });
}

async function main() {
  const timestamp = BenchPress.fileTimestamp();
  const session = await Core.createSessionForPrincipal('sys', '12345');

  await createOrganization(session, timestamp);

  await createPlaceOfBusiness(session, timestamp);
}

if (require.main === module) {
  main()
    .then(Db.shutDownAsync)
    .catch((error) => {
      console.warn(error);
      process.exitCode = 1;
    });
}
