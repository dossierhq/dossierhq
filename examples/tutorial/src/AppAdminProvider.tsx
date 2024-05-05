import {
  CloudinaryImageFieldEditor,
  CloudinaryImageFieldEditorWithoutClear,
} from '@dossierhq/cloudinary';
import { FieldType, isComponentItemField } from '@dossierhq/core';
import {
  DossierProvider,
  type AdminDossierContextAdapter,
  type FieldEditorProps,
  type RichTextComponentEditorProps,
} from '@dossierhq/react-components';
import { useMemo } from 'react';
import { useDossierClient } from './ClientUtils.js';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from './CloudinaryConfig.js';
import { isCloudinaryImage } from './SchemaTypes.js';

interface Props {
  children: React.ReactNode;
}

export function AppAdminProvider({ children }: Props) {
  const client = useDossierClient();
  const args = useMemo(
    () => ({
      adapter: new AdminAdapter(),
    }),
    [],
  );

  if (!client) return null;

  return (
    <DossierProvider {...args} client={client}>
      {children}
    </DossierProvider>
  );
}

class AdminAdapter implements AdminDossierContextAdapter {
  renderAdminFieldEditor(props: FieldEditorProps): JSX.Element | null {
    const { fieldSpec, value } = props;
    if (
      fieldSpec.type === FieldType.Component &&
      isComponentItemField(fieldSpec, value) &&
      value &&
      isCloudinaryImage(value)
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

  renderAdminRichTextComponentEditor(props: RichTextComponentEditorProps): JSX.Element | null {
    const { value, validationIssues, onChange } = props;
    if (isCloudinaryImage(value)) {
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
