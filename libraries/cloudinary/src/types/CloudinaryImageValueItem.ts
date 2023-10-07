import type { AdminComponentTypeSpecificationUpdate, Component } from '@dossierhq/core';
import { FieldType } from '@dossierhq/core';

export interface AdminCloudinaryImageFields {
  publicId: string | null;
  width: number | null;
  height: number | null;
  alt: string | null;
}

export interface PublishedCloudinaryImageFields {
  publicId: string;
  width: number;
  height: number;
  alt: string | null;
}

export type AdminCloudinaryImage = Component<'CloudinaryImage', AdminCloudinaryImageFields>;
export type PublishedCloudinaryImage = Component<'CloudinaryImage', PublishedCloudinaryImageFields>;

export function isAdminCloudinaryImage(
  valueItem: Component<string, object> | AdminCloudinaryImage,
): valueItem is AdminCloudinaryImage {
  return valueItem.type === 'CloudinaryImage';
}

export function isPublishedCloudinaryImage(
  valueItem: Component<string, object> | PublishedCloudinaryImage,
): valueItem is PublishedCloudinaryImage {
  return valueItem.type === 'CloudinaryImage';
}

export const CLOUDINARY_IMAGE_VALUE_TYPE: AdminComponentTypeSpecificationUpdate = {
  name: 'CloudinaryImage',
  fields: [
    { name: 'publicId', type: FieldType.String, required: true },
    { name: 'width', type: FieldType.Number, integer: true, required: true },
    { name: 'height', type: FieldType.Number, integer: true, required: true },
    { name: 'alt', type: FieldType.String },
  ],
};
