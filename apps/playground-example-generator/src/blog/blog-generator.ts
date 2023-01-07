import 'dotenv/config';
//
import { faker } from '@faker-js/faker';
import {
  createRichTextParagraphNode,
  createRichTextRootNode,
  createRichTextTextNode,
  createRichTextValueItemNode,
} from '@jonasb/datadata-core';
import { listCloudinaryImages } from '../utils/cloudinary-repository.js';
import { createAdapterAndServer, createNewDatabase } from '../utils/shared-generator.js';
import type {
  AdminBlogPost,
  AdminCloudinaryImage,
  AdminPerson,
  AppAdminClient,
} from './schema-types.js';
import { SCHEMA } from './schema.js';

async function createPerson(adminClient: AppAdminClient) {
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
  adminClient: AppAdminClient,
  persons: AdminPerson[],
  images: AdminCloudinaryImage[]
) {
  const title = faker.company.catchPhrase();

  return (
    await adminClient.createEntity<AdminBlogPost>(
      {
        info: { type: 'BlogPost', authKey: 'none', name: title },
        fields: {
          title,
          slug: faker.helpers.slugify(title.toLowerCase()),
          heroImage: faker.helpers.arrayElement(images),
          authors: faker.helpers
            .arrayElements(persons, Math.random() < 0.2 ? 2 : 1)
            .map((it) => ({ id: it.id })),
          description: createRichTextRootNode([
            createRichTextParagraphNode([createRichTextTextNode(faker.lorem.paragraph())]),
          ]),
          body: createRichTextRootNode([
            createRichTextParagraphNode([createRichTextTextNode(faker.lorem.paragraph())]),
            createRichTextValueItemNode(faker.helpers.arrayElement(images)),
            createRichTextParagraphNode([createRichTextTextNode(faker.lorem.paragraph())]),
          ]),
        },
      },
      { publish: true }
    )
  ).valueOrThrow().entity;
}

async function main() {
  const database = await createNewDatabase('dist/blog.sqlite');
  const { adminClient, server } = await createAdapterAndServer<AppAdminClient>(database, SCHEMA);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const cloudinaryImages = await listCloudinaryImages(process.env.CLOUDINARY_BLOG_FOLDER!);
  const images = cloudinaryImages.map<AdminCloudinaryImage>((image) => ({
    type: 'CloudinaryImage',
    publicId: image.public_id,
    width: image.width,
    height: image.height,
    alt: null,
  }));

  const persons: AdminPerson[] = [];
  for (const _ of Array(20).keys()) {
    persons.push(await createPerson(adminClient));
  }

  for (const _ of Array(100).keys()) {
    await createBlogPost(adminClient, persons, images);
  }

  await server.shutdown();
}

main().catch((error) => {
  console.error(error);
  console.error((error as Error).stack);
});
