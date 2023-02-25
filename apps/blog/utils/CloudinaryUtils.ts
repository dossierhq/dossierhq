import type { Cloudinary } from '@cloudinary/url-gen';
import { limitFit } from '@cloudinary/url-gen/actions/resize';

export function getResponsiveImageUrlsForLimitFit(
  cld: Cloudinary,
  publicId: string,
  width: number,
  height: number | null
) {
  const url1x = getImageUrlForLimitFit(cld, publicId, width, height);
  const url2x = getImageUrlForLimitFit(
    cld,
    publicId,
    2 * width,
    height === null ? null : 2 * height
  );

  const srcSet = `${url1x} ${width}w, ${url2x} ${2 * width}w`;
  return { src: url1x, srcSet };
}

export function getImageUrlForLimitFit(
  cld: Cloudinary,
  publicId: string,
  width: number,
  height: number | null
) {
  return cld
    .image(publicId)
    .resize(limitFit(width, height ?? undefined))
    .toURL();
}
