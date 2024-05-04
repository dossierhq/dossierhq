import {
  createRichText,
  createRichTextParagraphNode,
  createRichTextTextAndWhitespaceNodes,
  createRichTextTextNode,
  type EntityReference,
  type Location,
} from '@dossierhq/core';
import { faker } from '@faker-js/faker';
import {
  createAdapterAndServer,
  createNewDatabase,
  optimizeAndCloseDatabase,
} from '../utils/shared-generator.js';
import type {
  AppDossierClient,
  PersonalNote,
  PlaceOfBusiness,
  Review,
  Reviewer,
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
  client: AppDossierClient,
  locationGenerator: Generator<Location, void>,
) {
  const name = faker.company.name();
  const line1 = faker.location.streetAddress();
  const zip = faker.location.zipCode();
  const city = faker.location.city();

  const nextValue = locationGenerator.next();
  const location = !nextValue.done ? nextValue.value : null;
  return (
    await client.createEntity<PlaceOfBusiness>(
      {
        info: { type: 'PlaceOfBusiness', name },
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
      { publish: true },
    )
  ).valueOrThrow();
}

async function createReviewer(client: AppDossierClient) {
  const name = faker.internet.userName();
  return (
    await client.createEntity<Reviewer>(
      {
        info: { type: 'Reviewer', name },
        fields: { name },
      },
      { publish: true },
    )
  ).valueOrThrow();
}

async function createReview(
  client: AppDossierClient,
  placeOfBusiness: PlaceOfBusiness,
  reviewer: EntityReference,
) {
  return (
    await client.createEntity<Review>(
      {
        info: { type: 'Review', name: 'Review' },
        fields: {
          placeOfBusiness: { id: placeOfBusiness.id },
          reviewer,
          review: `${faker.word.interjection()} ${faker.internet.emoji()}`,
        },
      },
      { publish: true },
    )
  ).valueOrThrow();
}

async function createPersonalNote(
  client: AppDossierClient,
  placeOfBusiness: PlaceOfBusiness,
  userName: string,
) {
  return (
    await client.createEntity<PersonalNote>(
      {
        info: { type: 'PersonalNote', authKey: 'subject', name: `Note: ${userName}` },
        fields: {
          placeOfBusiness: { id: placeOfBusiness.id },
          note: createRichText([
            createRichTextParagraphNode([
              createRichTextTextNode(
                `This is a personal note about ${placeOfBusiness.fields.name} that only ${userName} can see.`,
              ),
            ]),
            createRichTextParagraphNode(createRichTextTextAndWhitespaceNodes(faker.lorem.text())),
          ]),
        },
      },
      { publish: true },
    )
  ).valueOrThrow();
}

async function main() {
  const database = await createNewDatabase('dist/reviews.sqlite');
  const { client, bobDossierClient, server } = await createAdapterAndServer<AppDossierClient>(
    database,
    SCHEMA,
  );

  const placesOfBusiness: PlaceOfBusiness[] = [];
  for (const _ of Array(100).keys()) {
    const { entity } = await createPlaceOfBusiness(client, generateLocation());
    placesOfBusiness.push(entity);
  }
  const reviewers: EntityReference[] = [];
  for (const _ of Array(100).keys()) {
    const {
      entity: { id },
    } = await createReviewer(client);
    reviewers.push({ id });
  }
  for (const _ of Array(100).keys()) {
    await createReview(
      client,
      faker.helpers.arrayElement(placesOfBusiness),
      faker.helpers.arrayElement(reviewers),
    );
  }

  for (const _ of Array(5).keys()) {
    await createPersonalNote(client, faker.helpers.arrayElement(placesOfBusiness), 'Alice');
  }
  for (const _ of Array(2).keys()) {
    await createPersonalNote(bobDossierClient, faker.helpers.arrayElement(placesOfBusiness), 'Bob');
  }

  await optimizeAndCloseDatabase(server);
}

main().catch((error) => {
  console.error(error);
  console.error((error as Error).stack);
});
