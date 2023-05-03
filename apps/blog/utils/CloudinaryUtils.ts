import type { Cloudinary } from '@cloudinary/url-gen';
import { limitFill } from '@cloudinary/url-gen/actions/resize';

export function getResponsiveImageUrlsForLimitFit(
  cld: Cloudinary,
  publicId: string,
  width: number,
  height: number | null
) {
  const url1x = getImageUrlForLimitFill(cld, publicId, width, height);
  const url2x = getImageUrlForLimitFill(
    cld,
    publicId,
    2 * width,
    height === null ? null : 2 * height
  );

  const srcSet = `${url1x} ${width}w, ${url2x} ${2 * width}w`;
  return { src: url1x, srcSet };
}

export function getOpenGraphImageUrlForLimitFit(cld: Cloudinary, publicId: string) {
  return getImageUrlForLimitFill(cld, publicId, 1200, 630);
}

export function getJsonLdImageUrlsForLimitFit(cld: Cloudinary, publicId: string) {
  //  Google recommends 16x9, 4x3, 1x1 aspect ratios, with 50k pixels min
  return [
    getImageUrlForLimitFill(cld, publicId, 480, 480),
    getImageUrlForLimitFill(cld, publicId, 480, 480 / (4 / 3)),
    getImageUrlForLimitFill(cld, publicId, 480, 480 / (16 / 9)),
  ];
}

export function getImageUrlForLimitFill(
  cld: Cloudinary,
  publicId: string,
  width: number,
  height: number | null
) {
  return cld
    .image(publicId)
    .resize(limitFill(width, height ?? undefined))
    .toURL();
}
