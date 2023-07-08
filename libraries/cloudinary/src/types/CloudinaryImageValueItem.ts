import type { AdminValueTypeSpecificationUpdate, ValueItem } from '@dossierhq/core';
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

export type AdminCloudinaryImage = ValueItem<'CloudinaryImage', AdminCloudinaryImageFields>;
export type PublishedCloudinaryImage = ValueItem<'CloudinaryImage', PublishedCloudinaryImageFields>;

export function isAdminCloudinaryImage(
  valueItem: ValueItem<string, object> | AdminCloudinaryImage,
): valueItem is AdminCloudinaryImage {
  return valueItem.type === 'CloudinaryImage';
}

export function isPublishedCloudinaryImage(
  valueItem: ValueItem<string, object> | PublishedCloudinaryImage,
): valueItem is PublishedCloudinaryImage {
  return valueItem.type === 'CloudinaryImage';
}

export const CLOUDINARY_IMAGE_VALUE_TYPE: AdminValueTypeSpecificationUpdate = {
  name: 'CloudinaryImage',
  fields: [
    { name: 'publicId', type: FieldType.String, required: true },
    { name: 'width', type: FieldType.Number, integer: true, required: true },
    { name: 'height', type: FieldType.Number, integer: true, required: true },
    { name: 'alt', type: FieldType.String },
  ],
};
