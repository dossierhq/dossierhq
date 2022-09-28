import { Cloudinary } from '@cloudinary/url-gen';
import { name } from '@cloudinary/url-gen/actions/namedTransformation';
import type { FieldEditorProps } from '@jonasb/datadata-admin-react-components';
import type { ValueItem } from '@jonasb/datadata-core';
import { Button, Delete, HoverRevealStack, IconButton, Row } from '@jonasb/datadata-design';
import { useCallback, useLayoutEffect, useState } from 'react';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../config/CloudinaryConfig.js';
import { useRuntimeDependency } from '../hooks/useRuntimeDependency.js';
import type {
  CloudinaryUploadResult,
  CloudinaryUploadWidgetCallback,
  UploadWidget,
} from '../types/CloudinaryUploadWidget.js';

export interface AdminCloudinaryImageFields {
  publicId: string | null;
}

export interface PublishedCloudinaryImageFields {
  publicId: string;
}

export type AdminCloudinaryImage = ValueItem<'CloudinaryImage', AdminCloudinaryImageFields>;
export type PublishedCloudinaryImage = ValueItem<'CloudinaryImage', PublishedCloudinaryImageFields>;

export function isAdminCloudinaryImage(
  valueItem: ValueItem<string, object> | AdminCloudinaryImage
): valueItem is AdminCloudinaryImage {
  return valueItem.type === 'CloudinaryImage';
}

export function isPublishedCloudinaryImage(
  valueItem: ValueItem<string, object> | PublishedCloudinaryImage
): valueItem is PublishedCloudinaryImage {
  return valueItem.type === 'CloudinaryImage';
}

export function CloudinaryImageFieldEditor({
  value,
  onChange,
}: FieldEditorProps<AdminCloudinaryImage> & { value: AdminCloudinaryImage }) {
  const handleDeleteClick = useCallback(() => onChange(null), [onChange]);
  return (
    <HoverRevealStack>
      <HoverRevealStack.Item top right>
        <Delete onClick={handleDeleteClick} />
      </HoverRevealStack.Item>
      <CloudinaryImageFieldEditorWithoutClear value={value} onChange={onChange} />
    </HoverRevealStack>
  );
}

export function CloudinaryImageFieldEditorWithoutClear({
  value,
  onChange,
}: {
  value: AdminCloudinaryImage;
  onChange: (value: AdminCloudinaryImage) => void;
}) {
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
    <Row gap={2}>
      <img src={thumbnailImageUrl} />
      <IconButton icon="openInNewWindow" onClick={() => window.open(fullImageUrl, '_blank')} />
    </Row>
  );
}

export function CloudinaryImageFieldDisplay({ value }: { value: PublishedCloudinaryImage }) {
  const { publicId } = value;

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
    <Row gap={2}>
      <img src={thumbnailImageUrl} />
      <IconButton icon="openInNewWindow" onClick={() => window.open(fullImageUrl, '_blank')} />
    </Row>
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
  onChange: (value: AdminCloudinaryImage) => void
) {
  if (result && result.event === 'success') {
    onChange({ type: 'CloudinaryImage', publicId: result.info.public_id });
  }
}
