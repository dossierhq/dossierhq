import { Cloudinary } from '@cloudinary/url-gen';
import { name } from '@cloudinary/url-gen/actions/namedTransformation';
import type { FieldEditorProps } from '@jonasb/datadata-admin-react-components';
import type { ValueItem, ValueItemFieldSpecification } from '@jonasb/datadata-core';
import {
  Button,
  Column,
  Delete,
  Field,
  HoverRevealStack,
  IconButton,
  Input,
  Row,
  Text,
} from '@jonasb/datadata-design';
import { useCallback, useLayoutEffect, useState } from 'react';
import { useRuntimeDependency } from '../hooks/useRuntimeDependency.js';
import type {
  CloudinaryUploadResult,
  CloudinaryUploadWidgetCallback,
  UploadWidget,
} from '../types/CloudinaryUploadWidget.js';

export interface AdminCloudinaryImageFields {
  publicId: string | null;
  width: number | null;
  height: number | null;
  alt: string | null;
}

export interface PublishedCloudinaryImageFields {
  publicId: string;
  width: number;
  height: number;
  alt: string | null;
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
  cloudName,
  uploadPreset,
  value,
  onChange,
}: FieldEditorProps<ValueItemFieldSpecification, AdminCloudinaryImage> & {
  cloudName: string;
  uploadPreset: string;
  value: AdminCloudinaryImage;
}) {
  const handleDeleteClick = useCallback(() => onChange(null), [onChange]);
  return (
    <HoverRevealStack>
      <HoverRevealStack.Item top right>
        <Delete onClick={handleDeleteClick} />
      </HoverRevealStack.Item>
      <CloudinaryImageFieldEditorWithoutClear
        cloudName={cloudName}
        uploadPreset={uploadPreset}
        value={value}
        onChange={onChange}
      />
    </HoverRevealStack>
  );
}

export function CloudinaryImageFieldEditorWithoutClear({
  cloudName,
  uploadPreset,
  value,
  onChange,
}: {
  cloudName: string;
  uploadPreset: string;
  value: AdminCloudinaryImage;
  onChange: (value: AdminCloudinaryImage) => void;
}) {
  const uploadWidgetCallback = useCallback(
    (error: Error | undefined, result: CloudinaryUploadResult | undefined) =>
      handleUploadWidgetCallback(error, result, onChange),
    [onChange]
  );
  const uploadWidget = useInitializeUploadWidget(cloudName, uploadPreset, uploadWidgetCallback);

  if (!uploadWidget) {
    return null;
  }
  const { publicId } = value;

  if (!publicId) {
    return <Button onClick={() => uploadWidget.open()}>Upload image</Button>;
  }

  const cld = new Cloudinary({ cloud: { cloudName } });

  const thumbnailImageUrl = cld
    .image(publicId)
    .namedTransformation(name('media_lib_thumb'))
    .toURL();
  const fullImageUrl = cld.image(publicId).toURL();

  return (
    <Column>
      <Field horizontal>
        <Field.LabelColumn />
        <Field.BodyColumn>
          <Field>
            <Field.Control>
              <Row gap={2}>
                <img src={thumbnailImageUrl} />
                <IconButton
                  icon="openInNewWindow"
                  onClick={() => window.open(fullImageUrl, '_blank')}
                />
              </Row>
            </Field.Control>
          </Field>
        </Field.BodyColumn>
      </Field>
      <Field horizontal>
        <Field.LabelColumn>
          <Field.Label>Size</Field.Label>
        </Field.LabelColumn>
        <Field.BodyColumn>
          <Field>
            <Field.Control>
              <Input readOnly value={`${value.width} × ${value.height} px`} />
            </Field.Control>
          </Field>
        </Field.BodyColumn>
      </Field>
      <Field horizontal>
        <Field.LabelColumn>
          <Field.Label>Alt</Field.Label>
        </Field.LabelColumn>
        <Field.BodyColumn>
          <Field>
            <Field.Control>
              <Input
                value={value.alt ?? ''}
                onChange={(event) => {
                  onChange({ ...value, alt: event.target.value });
                }}
              />
            </Field.Control>
          </Field>
        </Field.BodyColumn>
      </Field>
    </Column>
  );
}

export function CloudinaryImageFieldDisplay({
  cloudName,
  value,
}: {
  cloudName: string;
  value: PublishedCloudinaryImage;
}) {
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

function useInitializeUploadWidget(
  cloudName: string,
  uploadPreset: string,
  callback: CloudinaryUploadWidgetCallback
): UploadWidget | null {
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
          cloudName,
          uploadPreset,
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
    const asset = result.info;
    onChange({
      type: 'CloudinaryImage',
      publicId: asset.public_id,
      width: asset.width,
      height: asset.height,
      alt: null,
    });
  }
}
