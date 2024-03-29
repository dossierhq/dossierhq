import type {
  AdminClient,
  AdminEntity,
  AdminExceptionClient,
  Component,
  EntityReference,
  RichText,
} from '@dossierhq/core';

export type AppAdminClient = AdminClient<
  AppAdminEntity,
  AppAdminComponent,
  AppAdminUniqueIndexes,
  AppAdminExceptionClient
>;

export type AppAdminExceptionClient = AdminExceptionClient<
  AppAdminEntity,
  AppAdminComponent,
  AppAdminUniqueIndexes
>;

export type AppAdminUniqueIndexes = 'slug';

export type AppAdminEntity = AdminBlogPost | AdminPerson;

export interface AdminBlogPostFields {
  title: string | null;
  slug: string | null;
  heroImage: AdminCloudinaryImage | null;
  description: RichText | null;
  body: RichText | null;
  authors: EntityReference[] | null;
  tags: string[] | null;
}

export type AdminBlogPost = AdminEntity<'BlogPost', AdminBlogPostFields, ''>;

export function isAdminBlogPost(entity: AdminEntity<string, object>): entity is AdminBlogPost {
  return entity.info.type === 'BlogPost';
}

export function assertIsAdminBlogPost(
  entity: AdminEntity<string, object>,
): asserts entity is AdminBlogPost {
  if (entity.info.type !== 'BlogPost') {
    throw new Error('Expected info.type = BlogPost (but was ' + entity.info.type + ')');
  }
}

export interface AdminPersonFields {
  title: string | null;
}

export type AdminPerson = AdminEntity<'Person', AdminPersonFields, ''>;

export function isAdminPerson(entity: AdminEntity<string, object>): entity is AdminPerson {
  return entity.info.type === 'Person';
}

export function assertIsAdminPerson(
  entity: AdminEntity<string, object>,
): asserts entity is AdminPerson {
  if (entity.info.type !== 'Person') {
    throw new Error('Expected info.type = Person (but was ' + entity.info.type + ')');
  }
}

export type AppAdminComponent = AdminCloudinaryImage;

export interface AdminCloudinaryImageFields {
  publicId: string | null;
  width: number | null;
  height: number | null;
  alt: string | null;
}

export type AdminCloudinaryImage = Component<'CloudinaryImage', AdminCloudinaryImageFields>;

export function isAdminCloudinaryImage(
  component: Component<string, object> | AdminCloudinaryImage,
): component is AdminCloudinaryImage {
  return component.type === 'CloudinaryImage';
}

export function assertIsAdminCloudinaryImage(
  component: Component<string, object> | AdminCloudinaryImage,
): asserts component is AdminCloudinaryImage {
  if (component.type !== 'CloudinaryImage') {
    throw new Error('Expected type = CloudinaryImage (but was ' + component.type + ')');
  }
}
