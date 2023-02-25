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

export function getOpenGraphImageUrlForLimitFit(cld: Cloudinary, publicId: string) {
  return getImageUrlForLimitFit(cld, publicId, 1200, 630);
}

export function getJsonLdImageUrlsForLimitFit(cld: Cloudinary, publicId: string) {
  //  Google recommends 16x9, 4x3, 1x1 aspect ratios, with 50k pixels min
  return [
    getImageUrlForLimitFit(cld, publicId, 480, 480),
    getImageUrlForLimitFit(cld, publicId, 480, 480 / (4 / 3)),
    getImageUrlForLimitFit(cld, publicId, 480, 480 / (16 / 9)),
  ];
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
