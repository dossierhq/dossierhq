import type {
  DossierClient,
  AdminExceptionClient,
  Component,
  Entity,
  PublishedClient,
  PublishedEntity,
  PublishedExceptionClient,
} from '@dossierhq/core';

export type AppAdminClient = DossierClient<
  AppEntity,
  AppComponent,
  AppUniqueIndexes,
  AppAdminExceptionClient
>;

export type AppAdminExceptionClient = AdminExceptionClient<
  AppEntity,
  AppComponent,
  AppUniqueIndexes
>;

export type AppUniqueIndexes = never;

export type AppEntity = Message;

export interface MessageFields {
  message: string | null;
  image: CloudinaryImage | null;
}

export type Message = Entity<'Message', MessageFields, ''>;

export function isMessage(entity: Entity<string, object>): entity is Message {
  return entity.info.type === 'Message';
}

export function assertIsMessage(entity: Entity<string, object>): asserts entity is Message {
  if (entity.info.type !== 'Message') {
    throw new Error('Expected info.type = Message (but was ' + entity.info.type + ')');
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

export type AppPublishedClient = PublishedClient<
  AppPublishedEntity,
  AppPublishedComponent,
  AppPublishedUniqueIndexes,
  AppPublishedExceptionClient
>;

export type AppPublishedExceptionClient = PublishedExceptionClient<
  AppPublishedEntity,
  AppPublishedComponent,
  AppPublishedUniqueIndexes
>;

export type AppPublishedUniqueIndexes = never;

export type AppPublishedEntity = PublishedMessage;

export interface PublishedMessageFields {
  message: string;
  image: PublishedCloudinaryImage | null;
}

export type PublishedMessage = PublishedEntity<'Message', PublishedMessageFields, ''>;

export function isPublishedMessage(
  entity: PublishedEntity<string, object>,
): entity is PublishedMessage {
  return entity.info.type === 'Message';
}

export function assertIsPublishedMessage(
  entity: PublishedEntity<string, object>,
): asserts entity is PublishedMessage {
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

export function isPublishedCloudinaryImage(
  component: Component<string, object> | PublishedCloudinaryImage,
): component is PublishedCloudinaryImage {
  return component.type === 'CloudinaryImage';
}

export function assertIsPublishedCloudinaryImage(
  component: Component<string, object> | PublishedCloudinaryImage,
): asserts component is PublishedCloudinaryImage {
  if (component.type !== 'CloudinaryImage') {
    throw new Error('Expected type = CloudinaryImage (but was ' + component.type + ')');
  }
}
