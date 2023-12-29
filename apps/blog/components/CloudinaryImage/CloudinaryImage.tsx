/* eslint-disable @next/next/no-img-element */
import { toSizeClassName } from '@dossierhq/design';
import { getCloudinaryConfig } from '../../config/CloudinaryConfig';
import { getResponsiveImageUrlsForLimitFit } from '../../utils/CloudinaryUtils';
import type { PublishedCloudinaryImage } from '../../utils/SchemaTypes';

type Props = {
  image: PublishedCloudinaryImage;
} & ({ height: 400 } | { aspectRatio: '16/9' });

export function CloudinaryImage(props: Props) {
  const { image } = props;
  const cld = getCloudinaryConfig();

  if ('height' in props) {
    const height = props.height;
    const width = Math.round((height * image.width) / image.height);

    const { src, srcSet } = getResponsiveImageUrlsForLimitFit(cld, image.publicId, width, height);

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
    const { src, srcSet } = getResponsiveImageUrlsForLimitFit(cld, image.publicId, 638, 359);
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
