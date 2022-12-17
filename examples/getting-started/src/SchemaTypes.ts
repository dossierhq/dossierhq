import type { AdminClient, AdminEntity, PublishedClient, PublishedEntity } from '@jonasb/datadata-core';

export type AppAdminClient = AdminClient<AllAdminEntities>;

export type AllAdminEntities = AdminMessage;

export interface AdminMessageFields {
  message: string | null;
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

export type AllAdminValueItems = never;

export type AppPublishedClient = PublishedClient<AllPublishedEntities>;

export type AllPublishedEntities = PublishedMessage;

export interface PublishedMessageFields {
  message: string;
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

export type AllPublishedValueItems = never;
