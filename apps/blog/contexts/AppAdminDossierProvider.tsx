import {
  CloudinaryImageFieldEditor,
  CloudinaryImageFieldEditorWithoutClear,
} from '@dossierhq/cloudinary';
import {
  convertJsonDossierClientResult,
  createBaseDossierClient,
  createConsoleLogger,
  FieldType,
  isComponentItemField,
  type ClientContext,
  type DossierClient,
  type DossierClientMiddleware,
  type DossierClientOperation,
  type ErrorType,
  type Result,
} from '@dossierhq/core';
import {
  DossierProvider,
  useCachingDossierMiddleware,
  type DossierContextAdapter,
  type FieldEditorProps,
  type RichTextComponentEditorProps,
} from '@dossierhq/react-components';
import { JSX, useMemo } from 'react';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../config/CloudinaryConfig';
import { BackendUrls } from '../utils/BackendUrls';
import { fetchJsonResult } from '../utils/BackendUtils';
import { isCloudinaryImage } from '../utils/SchemaTypes';

type BackendContext = ClientContext;

const logger = createConsoleLogger(console);

class AdminContextAdapter implements DossierContextAdapter {
  renderFieldEditor(props: FieldEditorProps): JSX.Element | null {
    const { fieldSpec, value } = props;
    if (
      fieldSpec.type === FieldType.Component &&
      isComponentItemField(fieldSpec, value) &&
      value &&
      isCloudinaryImage(value)
    ) {
      return (
        <CloudinaryImageFieldEditor
          {...{
            ...props,
            cloudName: CLOUDINARY_CLOUD_NAME,
            uploadPreset: CLOUDINARY_UPLOAD_PRESET,
            fieldSpec,
            value,
          }}
        />
      );
    }
    return null;
  }

  renderRichTextComponentEditor(props: RichTextComponentEditorProps): JSX.Element | null {
    const { value, validationIssues, onChange } = props;
    if (isCloudinaryImage(value)) {
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
  const cachingMiddleware = useCachingDossierMiddleware();

  const args = useMemo(
    () => ({
      client: createBackendDossierClient(cachingMiddleware),
      adapter: new AdminContextAdapter(),
    }),
    [cachingMiddleware],
  );

  const { client } = args;
  if (!client) {
    return null;
  }
  return (
    <DossierProvider {...args} client={client}>
      {children}
    </DossierProvider>
  );
}

function createBackendDossierClient(
  cachingMiddleware: DossierClientMiddleware<BackendContext>,
): DossierClient {
  const context: BackendContext = { logger };
  return createBaseDossierClient({
    context,
    pipeline: [cachingMiddleware, terminatingAdminMiddleware],
  });
}

async function terminatingAdminMiddleware(
  context: BackendContext,
  operation: DossierClientOperation,
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
  operation.resolve(convertJsonDossierClientResult(operation.name, result));
}
