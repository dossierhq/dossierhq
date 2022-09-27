import type { AdminEntity, EntityReference, RichText, ValueItem } from '@jonasb/datadata-core';

export interface AdminBlogPostFields {
  title: string | null;
  heroImage: AdminImage | null;
  description: RichText | null;
  body: RichText | null;
  authors: Array<EntityReference> | null;
  tags: Array<string> | null;
}

export type AdminBlogPost = AdminEntity<'BlogPost', AdminBlogPostFields>;

export function isAdminBlogPost(entity: AdminEntity | AdminBlogPost): entity is AdminBlogPost {
  return entity.info.type === 'BlogPost';
}

export function assertIsAdminBlogPost(
  entity: AdminEntity | AdminBlogPost
): asserts entity is AdminBlogPost {
  if (entity.info.type !== 'BlogPost') {
    throw new Error('Expected info.type = BlogPost (but was ' + entity.info.type + ')');
  }
}

export interface AdminPersonFields {
  title: string | null;
}

export type AdminPerson = AdminEntity<'Person', AdminPersonFields>;

export function isAdminPerson(entity: AdminEntity | AdminPerson): entity is AdminPerson {
  return entity.info.type === 'Person';
}

export function assertIsAdminPerson(
  entity: AdminEntity | AdminPerson
): asserts entity is AdminPerson {
  if (entity.info.type !== 'Person') {
    throw new Error('Expected info.type = Person (but was ' + entity.info.type + ')');
  }
}

export type AllAdminValueItems = AdminImage;

export interface AdminImageFields {
  publicId: string | null;
}

export type AdminImage = ValueItem<'Image', AdminImageFields>;

export function isAdminImage(
  valueItem: ValueItem<string, object> | AdminImage
): valueItem is AdminImage {
  return valueItem.type === 'Image';
}

export function assertIsAdminImage(
  valueItem: ValueItem<string, object> | AdminImage
): asserts valueItem is AdminImage {
  if (valueItem.type !== 'Image') {
    throw new Error('Expected type = Image (but was ' + valueItem.type + ')');
  }
}
