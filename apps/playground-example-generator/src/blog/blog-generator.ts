import 'dotenv/config';
//
import {
  createRichTextParagraphNode,
  createRichText,
  createRichTextTextNode,
  createRichTextComponentNode,
} from '@dossierhq/core';
import { faker } from '@faker-js/faker';
import { listCloudinaryImages } from '../utils/cloudinary-repository.js';
import {
  createAdapterAndServer,
  createNewDatabase,
  optimizeAndCloseDatabase,
} from '../utils/shared-generator.js';
import type { BlogPost, CloudinaryImage, Person, AppDossierClient } from './schema-types.js';
import { SCHEMA } from './schema.js';

async function createPerson(client: AppDossierClient) {
  const name = faker.person.fullName();

  return (
    await client.createEntity<Person>(
      {
        info: { type: 'Person', name },
        fields: { title: name },
      },
      { publish: true },
    )
  ).valueOrThrow().entity;
}

async function createBlogPost(
  client: AppDossierClient,
  persons: Person[],
  images: CloudinaryImage[],
) {
  const title = faker.company.catchPhrase();

  return (
    await client.createEntity<BlogPost>(
      {
        info: { type: 'BlogPost', name: title },
        fields: {
          title,
          slug: faker.helpers.slugify(title.toLowerCase()),
          heroImage: faker.helpers.arrayElement(images),
          authors: faker.helpers
            .arrayElements(persons, Math.random() < 0.2 ? 2 : 1)
            .map((it) => ({ id: it.id })),
          description: createRichText([
            createRichTextParagraphNode([createRichTextTextNode(faker.lorem.paragraph())]),
          ]),
          body: createRichText([
            createRichTextParagraphNode([createRichTextTextNode(faker.lorem.paragraph())]),
            createRichTextComponentNode(faker.helpers.arrayElement(images)),
            createRichTextParagraphNode([createRichTextTextNode(faker.lorem.paragraph())]),
          ]),
        },
      },
      { publish: true },
    )
  ).valueOrThrow().entity;
}

async function main() {
  const database = await createNewDatabase('dist/blog.sqlite');
  const { client, server } = await createAdapterAndServer<AppDossierClient>(database, SCHEMA);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const cloudinaryImages = await listCloudinaryImages(process.env.CLOUDINARY_BLOG_FOLDER!);
  const images = cloudinaryImages.map<CloudinaryImage>((image) => ({
    type: 'CloudinaryImage',
    publicId: image.public_id,
    width: image.width,
    height: image.height,
    alt: null,
  }));

  const persons: Person[] = [];
  for (const _ of Array(20).keys()) {
    persons.push(await createPerson(client));
  }

  for (const _ of Array(100).keys()) {
    await createBlogPost(client, persons, images);
  }

  await optimizeAndCloseDatabase(server);
}

main().catch((error) => {
  console.error(error);
  console.error((error as Error).stack);
});
