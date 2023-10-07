import {
  CloudinaryImageFieldDisplay,
  CloudinaryImageFieldEditor,
  CloudinaryImageFieldEditorWithoutClear,
  isAdminCloudinaryImage,
  isPublishedCloudinaryImage,
} from '@dossierhq/cloudinary';
import { FieldType, isComponentItemField } from '@dossierhq/core';
import type {
  AdminDossierContextAdapter,
  FieldDisplayProps,
  FieldEditorProps,
  PublishedDossierContextAdapter,
  RichTextValueItemDisplayProps,
  RichTextValueItemEditorProps,
} from '@dossierhq/react-components';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from './CloudinaryConfig.js';

export class ContextAdapter implements AdminDossierContextAdapter, PublishedDossierContextAdapter {
  renderAdminFieldEditor(props: FieldEditorProps): JSX.Element | null {
    const { fieldSpec, value } = props;
    if (
      fieldSpec.type === FieldType.Component &&
      isComponentItemField(fieldSpec, value) &&
      value &&
      isAdminCloudinaryImage(value)
    ) {
      return CloudinaryImageFieldEditor({
        ...props,
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        fieldSpec,
        value,
      });
    }
    return null;
  }

  renderAdminRichTextValueItemEditor(props: RichTextValueItemEditorProps): JSX.Element | null {
    const { value, validationIssues, onChange } = props;
    if (isAdminCloudinaryImage(value)) {
      return CloudinaryImageFieldEditorWithoutClear({
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        value,
        validationIssues,
        onChange,
      });
    }
    return null;
  }

  renderPublishedFieldDisplay(props: FieldDisplayProps): JSX.Element | null {
    const { fieldSpec, value } = props;
    if (isComponentItemField(fieldSpec, value) && value && isPublishedCloudinaryImage(value)) {
      return CloudinaryImageFieldDisplay({
        cloudName: CLOUDINARY_CLOUD_NAME,
        value,
      });
    }
    return null;
  }

  renderPublishedRichTextValueItemDisplay({
    value,
  }: RichTextValueItemDisplayProps): JSX.Element | null {
    if (value && isPublishedCloudinaryImage(value)) {
      return CloudinaryImageFieldDisplay({
        cloudName: CLOUDINARY_CLOUD_NAME,
        value,
      });
    }
    return null;
  }
}
