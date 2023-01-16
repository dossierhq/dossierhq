import { Cloudinary } from '@cloudinary/url-gen';
import { name } from '@cloudinary/url-gen/actions/namedTransformation';
import type { FieldEditorProps } from '@dossierhq/react-components';
import type { ValueItemFieldSpecification } from '@dossierhq/core';
import {
  Button,
  Column,
  Delete,
  Field,
  HoverRevealStack,
  IconButton,
  Input,
  Row,
} from '@dossierhq/design';
import { useCallback } from 'react';
import { useInitializeUploadWidget } from '../hooks/useInitializeUploadWidget.js';
import type { AdminCloudinaryImage } from '../types/CloudinaryImageValueItem.js';
import type { CloudinaryUploadResult } from '../types/CloudinaryUploadWidget.js';

type Props = FieldEditorProps<ValueItemFieldSpecification, AdminCloudinaryImage> & {
  cloudName: string;
  uploadPreset: string;
  value: AdminCloudinaryImage;
};

export function CloudinaryImageFieldEditor({ cloudName, uploadPreset, value, onChange }: Props) {
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
