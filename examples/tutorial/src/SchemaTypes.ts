import type { AdminClient, AdminEntity, AdminExceptionClient, PublishedClient, PublishedEntity, PublishedExceptionClient, ValueItem } from '@dossierhq/core';

export type AppAdminClient = AdminClient<AppAdminEntity, AppAdminUniqueIndexes, AppAdminExceptionClient>;

export type AppAdminExceptionClient = AdminExceptionClient<AppAdminEntity, AppAdminUniqueIndexes>;

export type AppAdminUniqueIndexes = never;

export type AppAdminEntity = AdminMessage;

export interface AdminMessageFields {
  message: string | null;
  image: AdminCloudinaryImage | null;
}

export type AdminMessage = AdminEntity<'Message', AdminMessageFields, 'none' | 'subject'>;

export function isAdminMessage(entity: AdminEntity<string, object>): entity is AdminMessage {
  return entity.info.type === 'Message';
}

export function assertIsAdminMessage(entity: AdminEntity<string, object>): asserts entity is AdminMessage {
  if (entity.info.type !== 'Message') {
    throw new Error('Expected info.type = Message (but was ' + entity.info.type + ')');
  }
}

export type AppAdminValueItem = AdminCloudinaryImage;

export interface AdminCloudinaryImageFields {
  publicId: string | null;
  width: number | null;
  height: number | null;
  alt: string | null;
}

export type AdminCloudinaryImage = ValueItem<'CloudinaryImage', AdminCloudinaryImageFields>;

export function isAdminCloudinaryImage(valueItem: ValueItem<string, object> | AdminCloudinaryImage): valueItem is AdminCloudinaryImage {
  return valueItem.type === 'CloudinaryImage';
}

export function assertIsAdminCloudinaryImage(valueItem: ValueItem<string, object> | AdminCloudinaryImage): asserts valueItem is AdminCloudinaryImage {
  if (valueItem.type !== 'CloudinaryImage') {
    throw new Error('Expected type = CloudinaryImage (but was ' + valueItem.type + ')');
  }
}

export type AppPublishedClient = PublishedClient<AppPublishedEntity, AppPublishedUniqueIndexes, AppPublishedExceptionClient>;

export type AppPublishedExceptionClient = PublishedExceptionClient<AppPublishedEntity, AppPublishedUniqueIndexes>;

export type AppPublishedUniqueIndexes = never;

export type AppPublishedEntity = PublishedMessage;

export interface PublishedMessageFields {
  message: string;
  image: PublishedCloudinaryImage | null;
}

export type PublishedMessage = PublishedEntity<'Message', PublishedMessageFields, 'none' | 'subject'>;

export function isPublishedMessage(entity: PublishedEntity<string, object>): entity is PublishedMessage {
  return entity.info.type === 'Message';
}

export function assertIsPublishedMessage(entity: PublishedEntity<string, object>): asserts entity is PublishedMessage {
  if (entity.info.type !== 'Message') {
    throw new Error('Expected info.type = Message (but was ' + entity.info.type + ')');
  }
}

export type AppPublishedValueItem = PublishedCloudinaryImage;

export interface PublishedCloudinaryImageFields {
  publicId: string;
  width: number;
  height: number;
  alt: string | null;
}

export type PublishedCloudinaryImage = ValueItem<'CloudinaryImage', PublishedCloudinaryImageFields>;

export function isPublishedCloudinaryImage(valueItem: ValueItem<string, object> | PublishedCloudinaryImage): valueItem is PublishedCloudinaryImage {
  return valueItem.type === 'CloudinaryImage';
}

export function assertIsPublishedCloudinaryImage(valueItem: ValueItem<string, object> | PublishedCloudinaryImage): asserts valueItem is PublishedCloudinaryImage {
  if (valueItem.type !== 'CloudinaryImage') {
    throw new Error('Expected type = CloudinaryImage (but was ' + valueItem.type + ')');
  }
}
