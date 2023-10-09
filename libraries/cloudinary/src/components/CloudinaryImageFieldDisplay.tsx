import { Cloudinary } from '@cloudinary/url-gen';
import { name } from '@cloudinary/url-gen/actions/namedTransformation';
import { Column, IconButton, Row, Text } from '@dossierhq/design';
import type { PublishedCloudinaryImage } from '../types/CloudinaryImageComponent.js';

interface Props {
  cloudName: string;
  value: PublishedCloudinaryImage;
}

export function CloudinaryImageFieldDisplay({ cloudName, value }: Props) {
  const { publicId } = value;

  const cld = new Cloudinary({ cloud: { cloudName } });
  const thumbnailImageUrl = cld
    .image(publicId)
    .namedTransformation(name('media_lib_thumb'))
    .toURL();
  const fullImageUrl = cld.image(publicId).toURL();

  return (
    <Column>
      <Row gap={2}>
        <img src={thumbnailImageUrl} alt={value.alt ?? ''} />
        <IconButton icon="openInNewWindow" onClick={() => window.open(fullImageUrl, '_blank')} />
      </Row>
      <Text textStyle="subtitle2">{`${value.width} × ${value.height} px`}</Text>
    </Column>
  );
}
