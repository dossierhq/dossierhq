import { Cloudinary } from '@cloudinary/url-gen';
import { name } from '@cloudinary/url-gen/actions/namedTransformation';
import { Button } from '@jonasb/datadata-design';
import { useLayoutEffect, useState } from 'react';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../config/CloudinaryConfig.js';
import { useRuntimeDependency } from '../hooks/useRuntimeDependency.js';
import type { CloudinaryAsset, UploadWidget } from '../types/CloudinaryUploadWidget.js';

export function CloudinaryTestRoute(): JSX.Element {
  const { status } = useRuntimeDependency('cloudinary-upload-widget');
  const [uploadWidget, setUploadWidget] = useState<UploadWidget | null>(null);
  const [asset, setAsset] = useState<CloudinaryAsset | null>(null);

  useLayoutEffect(() => {
    if (status !== 'ready') {
      return;
    }
    const { cloudinary } = window;
    setUploadWidget(
      cloudinary.createUploadWidget(
        {
          cloudName: CLOUDINARY_CLOUD_NAME,
          uploadPreset: CLOUDINARY_UPLOAD_PRESET,
          sources: ['local', 'url', 'camera'],
          multiple: false,
          resourceType: 'image',
        },
        (error, result) => {
          console.log('HEY', error, result);
          if (result?.event === 'success') {
            setAsset(result.info);
          }
        }
      )
    );
  }, [status]);

  const cld = new Cloudinary({
    cloud: {
      cloudName: CLOUDINARY_CLOUD_NAME,
    },
  });
  const image = cld.image(asset?.public_id).namedTransformation(name('media_lib_thumb'));

  return (
    <>
      <h1>Status: {status}</h1>
      <Button disabled={!uploadWidget} onClick={() => uploadWidget?.open()}>
        Upload image
      </Button>
      <img src={image.toURL()} />
    </>
  );
}
