/* eslint-disable @next/next/no-img-element */
import { Cloudinary } from '@cloudinary/url-gen';
import { limitFit } from '@cloudinary/url-gen/actions/resize';
import { toSizeClassName } from '@dossierhq/design-ssr';
import { CLOUDINARY_CLOUD_NAME } from '../../config/CloudinaryConfig';
import type { PublishedCloudinaryImage } from '../../utils/SchemaTypes';

type Props = {
  image: PublishedCloudinaryImage;
} & ({ height: 400 } | { aspectRatio: '16/9' });

export function CloudinaryImage(props: Props) {
  const { image } = props;
  const cld = new Cloudinary({
    cloud: { cloudName: CLOUDINARY_CLOUD_NAME },
    url: { forceVersion: false, analytics: false },
  });

  if ('height' in props) {
    const height = props.height;
    const width = Math.round((height * image.width) / image.height);

    const { src, srcSet } = getImageUrlsForLimitFit(cld, image.publicId, width, height);

    return (
      <div style={{ textAlign: 'center' }}>
        <img
          alt={image.alt ?? ''}
          width={width}
          height={height}
          src={src}
          srcSet={srcSet}
          style={{
            border: '1px solid #ccc',
          }}
        />
      </div>
    );
  } else {
    const { src, srcSet } = getImageUrlsForLimitFit(cld, image.publicId, 638, 359);
    return (
      <img
        className={toSizeClassName({ aspectRatio: props.aspectRatio })}
        alt={image.alt ?? ''}
        src={src}
        srcSet={srcSet}
      />
    );
  }
}

function getImageUrlsForLimitFit(
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
