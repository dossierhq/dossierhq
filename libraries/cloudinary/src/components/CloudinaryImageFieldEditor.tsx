import { Cloudinary } from '@cloudinary/url-gen';
import { name } from '@cloudinary/url-gen/actions/namedTransformation';
import type {
  PublishValidationError,
  SaveValidationError,
  ValueItemFieldSpecification,
} from '@dossierhq/core';
import { groupValidationErrorsByTopLevelPath } from '@dossierhq/core';
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
} from '@dossierhq/design';
import type { FieldEditorProps } from '@dossierhq/react-components';
import { useCallback, useMemo } from 'react';
import { useInitializeUploadWidget } from '../hooks/useInitializeUploadWidget.js';
import type { AdminCloudinaryImage } from '../types/CloudinaryImageValueItem.js';
import type { CloudinaryUploadResult } from '../types/CloudinaryUploadWidget.js';

type Props = FieldEditorProps<ValueItemFieldSpecification, AdminCloudinaryImage> & {
  cloudName: string;
  uploadPreset: string;
  value: AdminCloudinaryImage;
};

const NO_VALIDATION_ERRORS: (SaveValidationError | PublishValidationError)[] = [];

export function CloudinaryImageFieldEditor({
  cloudName,
  uploadPreset,
  value,
  validationErrors,
  onChange,
}: Props) {
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
        validationErrors={validationErrors}
        onChange={onChange}
      />
    </HoverRevealStack>
  );
}

export function CloudinaryImageFieldEditorWithoutClear({
  cloudName,
  uploadPreset,
  value,
  validationErrors,
  onChange,
}: {
  cloudName: string;
  uploadPreset: string;
  value: AdminCloudinaryImage;
  validationErrors: (SaveValidationError | PublishValidationError)[];
  onChange: (value: AdminCloudinaryImage) => void;
}) {
  const { publicId } = value;

  const { publicIdValidationErrors, altValidationErrors } = useMemo(() => {
    const { root: _, children } = groupValidationErrorsByTopLevelPath(validationErrors);
    const publicIdValidationErrors = children.get('publicId') ?? NO_VALIDATION_ERRORS;
    const altValidationErrors = children.get('alt') ?? NO_VALIDATION_ERRORS;
    return { publicIdValidationErrors, altValidationErrors };
  }, [validationErrors]);

  if (!publicId) {
    return (
      <>
        <UploadButton {...{ cloudName, uploadPreset, onChange }} />
        {publicIdValidationErrors.map((error, index) => (
          <Text key={index} textStyle="body2" marginTop={1} color="danger">
            {error.message}
          </Text>
        ))}
      </>
    );
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
            {altValidationErrors.length > 0 ? (
              <Field.Help color="danger">
                {altValidationErrors.map((it) => it.message).join(' ')}
              </Field.Help>
            ) : null}
          </Field>
        </Field.BodyColumn>
      </Field>
    </Column>
  );
}

function UploadButton({
  cloudName,
  uploadPreset,
  onChange,
}: {
  cloudName: string;
  uploadPreset: string;
  onChange: (value: AdminCloudinaryImage) => void;
}) {
  const uploadWidgetCallback = useCallback(
    (error: Error | undefined, result: CloudinaryUploadResult | undefined) =>
      handleUploadWidgetCallback(error, result, onChange),
    [onChange]
  );
  const uploadWidget = useInitializeUploadWidget(cloudName, uploadPreset, uploadWidgetCallback);

  return (
    <Button disabled={!uploadWidget} onClick={uploadWidget ? () => uploadWidget.open() : undefined}>
      Upload image
    </Button>
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
