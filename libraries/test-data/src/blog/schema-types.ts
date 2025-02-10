import type {
  Component,
  DossierClient,
  DossierExceptionClient,
  Entity,
  EntityReference,
  RichText,
} from '@dossierhq/core';

export type AppDossierClient = DossierClient<
  AppEntity,
  AppComponent,
  AppUniqueIndexes,
  AppDossierExceptionClient
>;

export type AppDossierExceptionClient = DossierExceptionClient<
  AppEntity,
  AppComponent,
  AppUniqueIndexes
>;

export type AppUniqueIndexes = 'slug';

export type AppEntity = BlogPost | Person;

export interface BlogPostFields {
  title: string | null;
  slug: string | null;
  heroImage: CloudinaryImage | null;
  description: RichText | null;
  body: RichText | null;
  authors: EntityReference[] | null;
  tags: string[] | null;
}

export type BlogPost = Entity<'BlogPost', BlogPostFields, ''>;

export function isBlogPost(entity: Entity<string, object>): entity is BlogPost {
  return entity.info.type === 'BlogPost';
}

export function assertIsBlogPost(entity: Entity<string, object>): asserts entity is BlogPost {
  if (entity.info.type !== 'BlogPost') {
    throw new Error('Expected info.type = BlogPost (but was ' + entity.info.type + ')');
  }
}

export interface PersonFields {
  title: string | null;
}

export type Person = Entity<'Person', PersonFields, ''>;

export function isPerson(entity: Entity<string, object>): entity is Person {
  return entity.info.type === 'Person';
}

export function assertIsPerson(entity: Entity<string, object>): asserts entity is Person {
  if (entity.info.type !== 'Person') {
    throw new Error('Expected info.type = Person (but was ' + entity.info.type + ')');
  }
}

export type AppComponent = CloudinaryImage;

export interface CloudinaryImageFields {
  publicId: string | null;
  width: number | null;
  height: number | null;
  alt: string | null;
}

export type CloudinaryImage = Component<'CloudinaryImage', CloudinaryImageFields>;

export function isCloudinaryImage(
  component: Component<string, object> | CloudinaryImage,
): component is CloudinaryImage {
  return component.type === 'CloudinaryImage';
}

export function assertIsCloudinaryImage(
  component: Component<string, object> | CloudinaryImage,
): asserts component is CloudinaryImage {
  if (component.type !== 'CloudinaryImage') {
    throw new Error('Expected type = CloudinaryImage (but was ' + component.type + ')');
  }
}
