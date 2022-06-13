import { faker } from '@faker-js/faker';
import type {
  AdminClient,
  AdminSchemaSpecificationUpdate,
  EntityReference,
  Location,
} from '@jonasb/datadata-core';
import { FieldType } from '@jonasb/datadata-core';
import {
  createAdapterAndServer,
  createDatabase,
  exportDatabase,
} from '../utils/shared-generator.js';

const SCHEMA: AdminSchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'PlaceOfBusiness',
      fields: [
        { name: 'name', type: FieldType.String, isName: true, required: true },
        { name: 'address', type: FieldType.ValueType, valueTypes: ['Address'] },
        { name: 'slogan', type: FieldType.String, required: true },
        { name: 'description', type: FieldType.String, multiline: true, required: true },
      ],
    },
    {
      name: 'Review',
      fields: [
        { name: 'reviewer', type: FieldType.EntityType, entityTypes: ['Reviewer'], required: true },
        {
          name: 'placeOfBusiness',
          type: FieldType.EntityType,
          entityTypes: ['PlaceOfBusiness'],
          required: true,
        },
        { name: 'review', type: FieldType.String, required: true },
      ],
    },
    {
      name: 'Reviewer',
      fields: [{ name: 'name', type: FieldType.String, isName: true, required: true }],
    },
  ],
  valueTypes: [
    {
      name: 'Address',
      fields: [
        { name: 'location', type: FieldType.Location, required: true },
        { name: 'line1', type: FieldType.String, required: true },
        { name: 'line2', type: FieldType.String },
        { name: 'zip', type: FieldType.String, required: true },
        { name: 'city', type: FieldType.String, required: true },
      ],
    },
  ],
};

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
    await adminClient.createEntity(
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
    await adminClient.createEntity(
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
    await adminClient.createEntity(
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
