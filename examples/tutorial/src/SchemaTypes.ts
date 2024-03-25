import type { AdminClient, AdminEntity, AdminExceptionClient, Component, PublishedClient, PublishedEntity, PublishedExceptionClient } from '@dossierhq/core';

export type AppAdminClient = AdminClient<AppAdminEntity, AppAdminComponent, AppAdminUniqueIndexes, AppAdminExceptionClient>;

export type AppAdminExceptionClient = AdminExceptionClient<AppAdminEntity, AppAdminComponent, AppAdminUniqueIndexes>;

export type AppAdminUniqueIndexes = never;

export type AppAdminEntity = AdminMessage;

export interface AdminMessageFields {
  message: string | null;
  image: AdminCloudinaryImage | null;
}

export type AdminMessage = AdminEntity<'Message', AdminMessageFields, '' | 'subject'>;

export function isAdminMessage(entity: AdminEntity<string, object>): entity is AdminMessage {
  return entity.info.type === 'Message';
}

export function assertIsAdminMessage(entity: AdminEntity<string, object>): asserts entity is AdminMessage {
  if (entity.info.type !== 'Message') {
    throw new Error('Expected info.type = Message (but was ' + entity.info.type + ')');
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

export function isAdminCloudinaryImage(component: Component<string, object> | AdminCloudinaryImage): component is AdminCloudinaryImage {
  return component.type === 'CloudinaryImage';
}

export function assertIsAdminCloudinaryImage(component: Component<string, object> | AdminCloudinaryImage): asserts component is AdminCloudinaryImage {
  if (component.type !== 'CloudinaryImage') {
    throw new Error('Expected type = CloudinaryImage (but was ' + component.type + ')');
  }
}

export type AppPublishedClient = PublishedClient<AppPublishedEntity, AppPublishedComponent, AppPublishedUniqueIndexes, AppPublishedExceptionClient>;

export type AppPublishedExceptionClient = PublishedExceptionClient<AppPublishedEntity, AppPublishedComponent, AppPublishedUniqueIndexes>;

export type AppPublishedUniqueIndexes = never;

export type AppPublishedEntity = PublishedMessage;

export interface PublishedMessageFields {
  message: string;
  image: PublishedCloudinaryImage | null;
}

export type PublishedMessage = PublishedEntity<'Message', PublishedMessageFields, '' | 'subject'>;

export function isPublishedMessage(entity: PublishedEntity<string, object>): entity is PublishedMessage {
  return entity.info.type === 'Message';
}

export function assertIsPublishedMessage(entity: PublishedEntity<string, object>): asserts entity is PublishedMessage {
  if (entity.info.type !== 'Message') {
    throw new Error('Expected info.type = Message (but was ' + entity.info.type + ')');
  }
}

export type AppPublishedComponent = PublishedCloudinaryImage;

export interface PublishedCloudinaryImageFields {
  publicId: string;
  width: number;
  height: number;
  alt: string | null;
}

export type PublishedCloudinaryImage = Component<'CloudinaryImage', PublishedCloudinaryImageFields>;

export function isPublishedCloudinaryImage(component: Component<string, object> | PublishedCloudinaryImage): component is PublishedCloudinaryImage {
  return component.type === 'CloudinaryImage';
}

export function assertIsPublishedCloudinaryImage(component: Component<string, object> | PublishedCloudinaryImage): asserts component is PublishedCloudinaryImage {
  if (component.type !== 'CloudinaryImage') {
    throw new Error('Expected type = CloudinaryImage (but was ' + component.type + ')');
  }
}
