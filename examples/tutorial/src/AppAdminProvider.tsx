import {
  CloudinaryImageFieldEditor,
  CloudinaryImageFieldEditorWithoutClear,
} from '@dossierhq/cloudinary';
import { FieldType, isValueItemField } from '@dossierhq/core';
import {
  AdminDossierProvider,
  type AdminDossierContextAdapter,
  type FieldEditorProps,
  type RichTextValueItemEditorProps,
} from '@dossierhq/react-components';
import { useMemo } from 'react';
import { DISPLAY_AUTH_KEYS } from './AuthConfig.js';
import { useAdminClient } from './ClientUtils.js';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from './CloudinaryConfig.js';
import { isAdminCloudinaryImage } from './SchemaTypes.js';

interface Props {
  children: React.ReactNode;
}

export function AppAdminProvider({ children }: Props) {
  const adminClient = useAdminClient();
  const args = useMemo(
    () => ({
      adapter: new AdminAdapter(),
      authKeys: DISPLAY_AUTH_KEYS,
    }),
    []
  );

  if (!adminClient) return null;

  return (
    <AdminDossierProvider {...args} adminClient={adminClient}>
      {children}
    </AdminDossierProvider>
  );
}

class AdminAdapter implements AdminDossierContextAdapter {
  renderAdminFieldEditor(props: FieldEditorProps): JSX.Element | null {
    const { fieldSpec, value } = props;
    if (
      fieldSpec.type === FieldType.ValueItem &&
      isValueItemField(fieldSpec, value) &&
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
        validationIssues,
        value,
        onChange,
      });
    }
    return null;
  }
}
