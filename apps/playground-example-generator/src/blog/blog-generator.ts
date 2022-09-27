import 'dotenv/config';
//
import { faker } from '@faker-js/faker';
import type { AdminClient } from '@jonasb/datadata-core';
import {
  createRichTextParagraphNode,
  createRichTextRootNode,
  createRichTextTextNode,
} from '@jonasb/datadata-core';
import { listCloudinaryImages } from '../utils/cloudinary-repository.js';
import {
  createAdapterAndServer,
  createDatabase,
  exportDatabase,
} from '../utils/shared-generator.js';
import type { AdminBlogPost, AdminImage, AdminPerson } from './schema-types.js';
import { SCHEMA } from './schema.js';

async function createPerson(adminClient: AdminClient) {
  const name = faker.name.fullName();

  return (
    await adminClient.createEntity<AdminPerson>(
      {
        info: { type: 'Person', authKey: 'none', name },
        fields: { title: name },
      },
      { publish: true }
    )
  ).valueOrThrow().entity;
}

async function createBlogPost(
  adminClient: AdminClient,
  persons: AdminPerson[],
  images: AdminImage[]
) {
  const title = faker.company.catchPhrase();

  return (
    await adminClient.createEntity<AdminBlogPost>(
      {
        info: { type: 'BlogPost', authKey: 'none', name: title },
        fields: {
          title,
          heroImage: faker.helpers.arrayElement(images),
          authors: faker.helpers
            .arrayElements(persons, Math.random() < 0.2 ? 2 : 1)
            .map((it) => ({ id: it.id })),
          description: createRichTextRootNode([
            createRichTextParagraphNode([createRichTextTextNode(faker.lorem.paragraph())]),
          ]),
          body: createRichTextRootNode([
            createRichTextParagraphNode([createRichTextTextNode(faker.lorem.paragraph())]),
          ]),
        },
      },
      { publish: true }
    )
  ).valueOrThrow().entity;
}

async function main() {
  const database = await createDatabase();
  const { adminClient } = await createAdapterAndServer(database, SCHEMA);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const cloudinaryImages = await listCloudinaryImages(process.env.CLOUDINARY_BLOG_FOLDER!);
  const images = cloudinaryImages.map<AdminImage>((image) => ({
    type: 'Image',
    publicId: image.public_id,
  }));

  const persons: AdminPerson[] = [];
  for (const _ of Array(100).keys()) {
    persons.push(await createPerson(adminClient));
  }

  for (const _ of Array(100).keys()) {
    await createBlogPost(adminClient, persons, images);
  }

  await exportDatabase(database, 'dist/blog.sqlite');
  database.close();
}

main().catch((error) => {
  console.error(error);
  console.error((error as Error).stack);
});
