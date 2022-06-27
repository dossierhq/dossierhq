import { faker } from '@faker-js/faker';
import type { AdminClient, EntityReference, Location } from '@jonasb/datadata-core';
import {
  createRichTextParagraphNode,
  createRichTextRootNode,
  createRichTextTextNode,
} from '@jonasb/datadata-core';
import {
  createAdapterAndServer,
  createDatabase,
  exportDatabase,
} from '../utils/shared-generator.js';
import type {
  AdminPersonalNote,
  AdminPlaceOfBusiness,
  AdminReview,
  AdminReviewer,
} from './schema-types.js';
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

async function createPersonalNote(adminClient: AdminClient, placeOfBusiness: AdminPlaceOfBusiness) {
  return (
    await adminClient.createEntity<AdminPersonalNote>(
      {
        info: { type: 'PersonalNote', authKey: 'subject', name: 'Note: Alice' },
        fields: {
          placeOfBusiness: { id: placeOfBusiness.id },
          note: createRichTextRootNode([
            createRichTextParagraphNode([
              createRichTextTextNode(
                `This is a personal note about ${placeOfBusiness.fields.name} that only Alice can see.`
              ),
            ]),
            createRichTextParagraphNode([createRichTextTextNode(faker.lorem.text())]),
          ]),
        },
      },
      { publish: true }
    )
  ).valueOrThrow();
}

async function main() {
  const database = await createDatabase();
  const { adminClient } = await createAdapterAndServer(database, SCHEMA);

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
    await createPersonalNote(adminClient, faker.helpers.arrayElement(placesOfBusiness));
  }

  await exportDatabase(database, 'dist/reviews.sqlite');
  database.close();
}

main().catch((error) => {
  console.error(error);
  console.error((error as Error).stack);
});
