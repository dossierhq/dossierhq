import type { EntityReference, Location } from '@dossierhq/core';
import {
  createRichTextParagraphNode,
  createRichTextRootNode,
  createRichTextTextAndWhitespaceNodes,
  createRichTextTextNode,
} from '@dossierhq/core';
import { faker } from '@faker-js/faker';
import {
  createAdapterAndServer,
  createNewDatabase,
  optimizeAndCloseDatabase,
} from '../utils/shared-generator.js';
import type {
  AdminPersonalNote,
  AdminPlaceOfBusiness,
  AdminReview,
  AdminReviewer,
  AppAdminClient,
} from './schema-types.js';
import { SCHEMA } from './schema.js';

function* generateLocation(): Generator<Location, void> {
  let lat = 55.6;
  let lng = 13;
  while (true) {
    const location = faker.location.nearbyGPSCoordinate({
      origin: [lat, lng],
      radius: 100,
      isMetric: true,
    });
    lat = location[0];
    lng = location[1];
    yield { lat, lng };
  }
}

async function createPlaceOfBusiness(
  adminClient: AppAdminClient,
  locationGenerator: Generator<Location, void>
) {
  const name = faker.company.name();
  const line1 = faker.address.streetAddress();
  const zip = faker.address.zipCode();
  const city = faker.address.city();

  const nextValue = locationGenerator.next();
  const location = !nextValue.done ? nextValue.value : null;
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
            line2: null,
            zip,
            city,
          },
        },
      },
      { publish: true }
    )
  ).valueOrThrow();
}

async function createReviewer(adminClient: AppAdminClient) {
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
  adminClient: AppAdminClient,
  placeOfBusiness: AdminPlaceOfBusiness,
  reviewer: EntityReference
) {
  return (
    await adminClient.createEntity<AdminReview>(
      {
        info: { type: 'Review', authKey: 'none', name: 'Review' },
        fields: {
          placeOfBusiness: { id: placeOfBusiness.id },
          reviewer,
          review: `${faker.word.interjection()} ${faker.internet.emoji()}`,
        },
      },
      { publish: true }
    )
  ).valueOrThrow();
}

async function createPersonalNote(
  adminClient: AppAdminClient,
  placeOfBusiness: AdminPlaceOfBusiness,
  userName: string
) {
  return (
    await adminClient.createEntity<AdminPersonalNote>(
      {
        info: { type: 'PersonalNote', authKey: 'subject', name: `Note: ${userName}` },
        fields: {
          placeOfBusiness: { id: placeOfBusiness.id },
          note: createRichTextRootNode([
            createRichTextParagraphNode([
              createRichTextTextNode(
                `This is a personal note about ${placeOfBusiness.fields.name} that only ${userName} can see.`
              ),
            ]),
            createRichTextParagraphNode(createRichTextTextAndWhitespaceNodes(faker.lorem.text())),
          ]),
        },
      },
      { publish: true }
    )
  ).valueOrThrow();
}

async function main() {
  const database = await createNewDatabase('dist/reviews.sqlite');
  const { adminClient, bobAdminClient, server } = await createAdapterAndServer<AppAdminClient>(
    database,
    SCHEMA
  );

  const placesOfBusiness: AdminPlaceOfBusiness[] = [];
  for (const _ of Array(100).keys()) {
    const { entity } = await createPlaceOfBusiness(adminClient, generateLocation());
    placesOfBusiness.push(entity);
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
      faker.helpers.arrayElement(placesOfBusiness),
      faker.helpers.arrayElement(reviewers)
    );
  }

  for (const _ of Array(5).keys()) {
    await createPersonalNote(adminClient, faker.helpers.arrayElement(placesOfBusiness), 'Alice');
  }
  for (const _ of Array(2).keys()) {
    await createPersonalNote(bobAdminClient, faker.helpers.arrayElement(placesOfBusiness), 'Bob');
  }

  await optimizeAndCloseDatabase(server);
}

main().catch((error) => {
  console.error(error);
  console.error((error as Error).stack);
});
