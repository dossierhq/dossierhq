import {
  CloudinaryImageFieldEditor,
  CloudinaryImageFieldEditorWithoutClear,
} from '@dossierhq/cloudinary';
import type {
  AdminClient,
  AdminClientMiddleware,
  AdminClientOperation,
  ClientContext,
  ErrorType,
  Result,
} from '@dossierhq/core';
import {
  FieldType,
  convertJsonAdminClientResult,
  createBaseAdminClient,
  createConsoleLogger,
  isValueItemField,
} from '@dossierhq/core';
import type {
  AdminDossierContextAdapter,
  FieldEditorProps,
  RichTextValueItemEditorProps,
} from '@dossierhq/react-components';
import { AdminDossierProvider, useCachingAdminMiddleware } from '@dossierhq/react-components';
import { useMemo } from 'react';
import { DISPLAY_AUTH_KEYS } from '../config/AuthKeyConfig';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../config/CloudinaryConfig';
import { BackendUrls } from '../utils/BackendUrls';
import { fetchJsonResult } from '../utils/BackendUtils';
import { isAdminCloudinaryImage } from '../utils/SchemaTypes';

type BackendContext = ClientContext;

const logger = createConsoleLogger(console);

class AdminContextAdapter implements AdminDossierContextAdapter {
  renderAdminFieldEditor(props: FieldEditorProps): JSX.Element | null {
    const { fieldSpec, value } = props;
    if (
      fieldSpec.type === FieldType.Component &&
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
        value,
        validationIssues,
        onChange,
      });
    }
    return null;
  }
}

export function AppAdminDossierProvider({ children }: { children: React.ReactNode }) {
  const cachingMiddleware = useCachingAdminMiddleware();

  const args = useMemo(
    () => ({
      adminClient: createBackendAdminClient(cachingMiddleware),
      adapter: new AdminContextAdapter(),
      authKeys: DISPLAY_AUTH_KEYS,
    }),
    [cachingMiddleware],
  );

  const { adminClient } = args;
  if (!adminClient) {
    return null;
  }
  return (
    <AdminDossierProvider {...args} adminClient={adminClient}>
      {children}
    </AdminDossierProvider>
  );
}

function createBackendAdminClient(
  cachingMiddleware: AdminClientMiddleware<BackendContext>,
): AdminClient {
  const context: BackendContext = { logger };
  return createBaseAdminClient({
    context,
    pipeline: [cachingMiddleware, terminatingAdminMiddleware],
  });
}

async function terminatingAdminMiddleware(
  context: BackendContext,
  operation: AdminClientOperation,
): Promise<void> {
  let result: Result<unknown, ErrorType>;
  if (operation.modifies) {
    result = await fetchJsonResult(context, BackendUrls.admin(operation.name), {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(operation.args),
    });
  } else {
    result = await fetchJsonResult(context, BackendUrls.admin(operation.name, operation.args));
  }
  operation.resolve(convertJsonAdminClientResult(operation.name, result));
}
