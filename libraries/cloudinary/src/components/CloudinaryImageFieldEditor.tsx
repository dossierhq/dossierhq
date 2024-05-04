import { Cloudinary } from '@cloudinary/url-gen';
import { name } from '@cloudinary/url-gen/actions/namedTransformation';
import {
  groupValidationIssuesByTopLevelPath,
  type ComponentFieldSpecification,
  type PublishValidationIssue,
  type SaveValidationIssue,
} from '@dossierhq/core';
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
import type { AdminCloudinaryImage } from '../types/CloudinaryImageComponent.js';
import type { CloudinaryUploadResult } from '../types/CloudinaryUploadWidget.js';

type Props = FieldEditorProps<ComponentFieldSpecification, AdminCloudinaryImage> & {
  cloudName: string;
  uploadPreset: string;
  value: AdminCloudinaryImage;
};

const NO_VALIDATION_ISSUES: (SaveValidationIssue | PublishValidationIssue)[] = [];

export function CloudinaryImageFieldEditor({
  cloudName,
  uploadPreset,
  value,
  validationIssues,
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
        validationIssues={validationIssues}
        onChange={onChange}
      />
    </HoverRevealStack>
  );
}

export function CloudinaryImageFieldEditorWithoutClear({
  cloudName,
  uploadPreset,
  value,
  validationIssues,
  onChange,
}: {
  cloudName: string;
  uploadPreset: string;
  value: AdminCloudinaryImage;
  validationIssues: (SaveValidationIssue | PublishValidationIssue)[];
  onChange: (value: AdminCloudinaryImage) => void;
}) {
  const { publicId } = value;

  const { publicIdValidationIssues, altValidationIssues } = useMemo(() => {
    const { root: _, children } = groupValidationIssuesByTopLevelPath(validationIssues);
    const publicIdValidationIssues = children.get('publicId') ?? NO_VALIDATION_ISSUES;
    const altValidationIssues = children.get('alt') ?? NO_VALIDATION_ISSUES;
    return { publicIdValidationIssues, altValidationIssues };
  }, [validationIssues]);

  if (!publicId) {
    return (
      <>
        <UploadButton {...{ cloudName, uploadPreset, onChange }} />
        {publicIdValidationIssues.map((error, index) => (
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
            {altValidationIssues.length > 0 ? (
              <Field.Help color="danger">
                {altValidationIssues.map((it) => it.message).join(' ')}
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
    [onChange],
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
  onChange: (value: AdminCloudinaryImage) => void,
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
