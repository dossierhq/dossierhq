import { Cloudinary } from '@cloudinary/url-gen';

export const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
export const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '';

export function getCloudinaryConfig() {
  return new Cloudinary({
    cloud: { cloudName: CLOUDINARY_CLOUD_NAME },
    url: { forceVersion: false, analytics: false },
  });
}
