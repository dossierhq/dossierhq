import { FieldType, type Component, type ComponentTypeSpecificationUpdate } from '@dossierhq/core';

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
  component: Component<string, object> | AdminCloudinaryImage,
): component is AdminCloudinaryImage {
  return component.type === 'CloudinaryImage';
}

export function isPublishedCloudinaryImage(
  component: Component<string, object> | PublishedCloudinaryImage,
): component is PublishedCloudinaryImage {
  return component.type === 'CloudinaryImage';
}

export const CLOUDINARY_IMAGE_COMPONENT_TYPE: ComponentTypeSpecificationUpdate = {
  name: 'CloudinaryImage',
  fields: [
    { name: 'publicId', type: FieldType.String, required: true },
    { name: 'width', type: FieldType.Number, integer: true, required: true },
    { name: 'height', type: FieldType.Number, integer: true, required: true },
    { name: 'alt', type: FieldType.String },
  ],
};
