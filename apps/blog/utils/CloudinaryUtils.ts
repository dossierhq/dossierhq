import type { Cloudinary } from '@cloudinary/url-gen';
import { limitFit } from '@cloudinary/url-gen/actions/resize';

export function getImageUrlsForLimitFit(
  cld: Cloudinary,
  publicId: string,
  width: number,
  height: number | null
) {
  const url1x = cld
    .image(publicId)
    .resize(limitFit(width, height ?? undefined))
    .toURL();
  const url2x = cld
    .image(publicId)
    .resize(limitFit(2 * width, height === null ? undefined : 2 * height))
    .toURL();

  const srcSet = `${url1x} ${width}w, ${url2x} ${2 * width}w`;
  return { src: url1x, srcSet };
}
