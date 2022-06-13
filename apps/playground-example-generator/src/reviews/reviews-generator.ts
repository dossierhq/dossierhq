import { faker } from '@faker-js/faker';
import type { AdminClient, EntityReference, Location } from '@jonasb/datadata-core';
import {
  createAdapterAndServer,
  createDatabase,
  exportDatabase,
} from '../utils/shared-generator.js';
import type { AdminPlaceOfBusiness, AdminReview, AdminReviewer } from './schema-types.js';
import { SCHEMA } from './schema.js';

function* generateLocation(): Generator<Location, void> {
  let lat = 55.6;
  let lng = 13;
  while (true) {
    const [latString, lngString] = faker.address.nearbyGPSCoordinate([lat, lng], 100, true);
    lat = Number.parseFloat(latString);
    lng = Number.parseFloat(lngString);
    yield { lat, lng };
  }
}

async function createPlaceOfBusiness(
  adminClient: AdminClient,
  locationGenerator: Generator<Location, void>
) {
  const name = faker.company.companyName();
  const line1 = faker.address.streetAddress();
  const zip = faker.address.zipCode();
  const city = faker.address.city();
  const location = locationGenerator.next().value;
  return (
    await adminClient.createEntity<AdminPlaceOfBusiness>(
      {
        info: { type: 'PlaceOfBusiness', authKey: 'none', name },
        fields: {
          name,
          slogan: faker.company.catchPhrase(),
          description: faker.lorem.text(),
          address: {
            type: 'Address',
            location,
            line1,
            zip,
            city,
          },
        },
      },
      { publish: true }
    )
  ).valueOrThrow();
}

async function createReviewer(adminClient: AdminClient) {
  const name = faker.internet.userName();
  return (
    await adminClient.createEntity<AdminReviewer>(
      {
        info: { type: 'Reviewer', authKey: 'none', name },
        fields: { name },
      },
      { publish: true }
    )
  ).valueOrThrow();
}

async function createReview(
  adminClient: AdminClient,
  placeOfBusiness: EntityReference,
  reviewer: EntityReference
) {
  return (
    await adminClient.createEntity<AdminReview>(
      {
        info: { type: 'Review', authKey: 'none', name: 'Review' },
        fields: {
          placeOfBusiness,
          reviewer,
          review: `${faker.word.interjection()} ${faker.internet.emoji()}`,
        },
      },
      { publish: true }
    )
  ).valueOrThrow();
}

async function main() {
  const database = await createDatabase();
  const { adminClient } = await createAdapterAndServer(database, SCHEMA);

  const pobs: EntityReference[] = [];
  for (const _ of Array(100).keys()) {
    const {
      entity: { id },
    } = await createPlaceOfBusiness(adminClient, generateLocation());
    pobs.push({ id });
  }
  const reviewers: EntityReference[] = [];
  for (const _ of Array(100).keys()) {
    const {
      entity: { id },
    } = await createReviewer(adminClient);
    reviewers.push({ id });
  }
  for (const _ of Array(100).keys()) {
    await createReview(
      adminClient,
      faker.helpers.arrayElement(pobs),
      faker.helpers.arrayElement(reviewers)
    );
  }

  await exportDatabase(database, 'dist/reviews.sqlite');
  database.close();
}

main().catch((error) => {
  console.error(error);
  console.error((error as Error).stack);
});
