import { Cloudinary } from '@cloudinary/url-gen';
import { name } from '@cloudinary/url-gen/actions/namedTransformation';
import type { FieldEditorProps } from '@jonasb/datadata-admin-react-components';
import type { ValueItem } from '@jonasb/datadata-core';
import { Button, Delete, HoverRevealContainer, IconButton } from '@jonasb/datadata-design';
import { useCallback, useLayoutEffect, useState } from 'react';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../config/CloudinaryConfig.js';
import { useRuntimeDependency } from '../hooks/useRuntimeDependency.js';
import type {
  CloudinaryUploadResult,
  CloudinaryUploadWidgetCallback,
  UploadWidget,
} from '../types/CloudinaryUploadWidget.js';

export interface AdminImageFields {
  publicId: string | null;
}

export type AdminImage = ValueItem<'Image', AdminImageFields>;

export function isAdminImage(
  valueItem: ValueItem<string, object> | AdminImage
): valueItem is AdminImage {
  return valueItem.type === 'Image';
}

export function CloudinaryImageFieldEditor({
  value,
  onChange,
}: FieldEditorProps<AdminImage> & { value: AdminImage }) {
  const uploadWidgetCallback = useCallback(
    (error: Error | undefined, result: CloudinaryUploadResult | undefined) =>
      handleUploadWidgetCallback(error, result, onChange),
    [onChange]
  );
  const uploadWidget = useInitializeUploadWidget(uploadWidgetCallback);

  if (!uploadWidget) {
    return null;
  }
  const { publicId } = value;

  if (!publicId) {
    return <Button onClick={() => uploadWidget.open()}>Upload image</Button>;
  }

  const cld = new Cloudinary({
    cloud: {
      cloudName: CLOUDINARY_CLOUD_NAME,
    },
  });

  const thumbnailImageUrl = cld
    .image(publicId)
    .namedTransformation(name('media_lib_thumb'))
    .toURL();
  const fullImageUrl = cld.image(publicId).toURL();

  return (
    <HoverRevealContainer>
      <HoverRevealContainer.Item forceVisible paddingRight={2}>
        <img src={thumbnailImageUrl} />
      </HoverRevealContainer.Item>
      <HoverRevealContainer.Item flexGrow={1} forceVisible>
        <IconButton icon="openInNewWindow" onClick={() => window.open(fullImageUrl, '_blank')} />
      </HoverRevealContainer.Item>
      <HoverRevealContainer.Item>
        <Delete onClick={() => onChange(null)} />
      </HoverRevealContainer.Item>
    </HoverRevealContainer>
  );
}

function useInitializeUploadWidget(callback: CloudinaryUploadWidgetCallback): UploadWidget | null {
  const { status } = useRuntimeDependency('cloudinary-upload-widget');
  const [uploadWidget, setUploadWidget] = useState<UploadWidget | null>(null);

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
        callback
      )
    );
  }, [callback, status]);

  return uploadWidget;
}

function handleUploadWidgetCallback(
  error: Error | undefined,
  result: CloudinaryUploadResult | undefined,
  onChange: (value: AdminImage | null) => void
) {
  if (result && result.event === 'success') {
    onChange({ type: 'Image', publicId: result.info.public_id });
  }
}
