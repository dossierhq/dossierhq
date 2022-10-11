import type { AdminEntity, EntityReference, RichText, ValueItem } from '@jonasb/datadata-core';

export interface AdminBlogPostFields {
  title: string | null;
  heroImage: AdminCloudinaryImage | null;
  description: RichText | null;
  body: RichText | null;
  authors: EntityReference[] | null;
  tags: string[] | null;
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

export type AllAdminValueItems = AdminCloudinaryImage;

export interface AdminCloudinaryImageFields {
  publicId: string | null;
}

export type AdminCloudinaryImage = ValueItem<'CloudinaryImage', AdminCloudinaryImageFields>;

export function isAdminCloudinaryImage(
  valueItem: ValueItem<string, object> | AdminCloudinaryImage
): valueItem is AdminCloudinaryImage {
  return valueItem.type === 'CloudinaryImage';
}

export function assertIsAdminCloudinaryImage(
  valueItem: ValueItem<string, object> | AdminCloudinaryImage
): asserts valueItem is AdminCloudinaryImage {
  if (valueItem.type !== 'CloudinaryImage') {
    throw new Error('Expected type = CloudinaryImage (but was ' + valueItem.type + ')');
  }
}
