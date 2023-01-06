/* eslint-disable @next/next/no-img-element */
import { Cloudinary } from '@cloudinary/url-gen';
import { CLOUDINARY_CLOUD_NAME } from '../../config/CloudinaryConfig';
import type { PublishedCloudinaryImage } from '../../utils/SchemaTypes';

interface Props {
  image: PublishedCloudinaryImage;
}

export function CloudinaryImage({ image }: Props) {
  const cld = new Cloudinary({ cloud: { cloudName: CLOUDINARY_CLOUD_NAME } });
  const fullImageUrl = cld.image(image.publicId).toURL();
  //TODO resize image on Cloudinary
  //TODO get alt from editor
  //TODO get width/height from Cloudinary/editor
  return (
    <div style={{ textAlign: 'center' }}>
      <img
        alt=""
        src={fullImageUrl}
        style={{
          maxHeight: '400px',
          border: '1px solid #ccc',
        }}
      />
    </div>
  );
}
