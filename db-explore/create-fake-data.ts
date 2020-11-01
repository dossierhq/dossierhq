#!/usr/bin/env npx ts-node
require('dotenv').config();
import faker from 'faker';
import * as Core from './Core';
import * as Db from './Db';

async function createEntities(
  session: Core.Session,
  type: string,
  count: number,
  entryGenerator: () => { name: string; entry: Record<string, unknown> }
) {
  for (let i = 0; i < count; i += 1) {
    const { name, entry } = entryGenerator();
    const filteredEntry: Record<string, unknown> = {};
    // TODO remove and add support to core?
    for (const [key, value] of Object.entries(entry)) {
      if (value !== null && value !== undefined) {
        filteredEntry[key] = value;
      }
    }
    await Core.createEntity(session, type, name, filteredEntry);
  }
}

function randomWeightedSelect<T>(values: T[], weights: number[]) {
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const originalRandom = faker.random.float({ max: weightSum });
  let remainingRandom = originalRandom;
  for (let i = 0; i < weights.length; i += 1) {
    const weight = weights[i];
    if (remainingRandom < weight) {
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

async function main() {
  const session = await Core.createSessionForPrincipal('sys', '12345');
  await createEntities(session, 'Organization', 10, () => {
    const name = faker.company.companyName();
    return {
      name,
      entry: {
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
      },
    };
  });
  await createEntities(session, 'PlaceOfBusiness', 10, () => {
    const name = faker.company.companyName();
    return {
      name,
      entry: {
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
      },
    };
  });
}

if (require.main === module) {
  main()
    .then(Db.shutDownAsync)
    .catch((error) => {
      console.warn(error);
      process.exitCode = 1;
    });
}
