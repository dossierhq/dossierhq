import type {
  AdminDataDataContextAdapter,
  FieldEditorProps,
  RichTextValueItemEditorProps,
} from '@jonasb/datadata-admin-react-components';
import {
  AdminDataDataProvider,
  useCachingAdminMiddleware,
} from '@jonasb/datadata-admin-react-components';
import {
  CloudinaryImageFieldEditor,
  CloudinaryImageFieldEditorWithoutClear,
} from '@jonasb/datadata-cloudinary';
import type {
  AdminClient,
  AdminClientMiddleware,
  AdminClientOperation,
  ClientContext,
  ErrorType,
  Result,
} from '@jonasb/datadata-core';
import {
  convertJsonAdminClientResult,
  createBaseAdminClient,
  createConsoleLogger,
  FieldType,
  isValueItemField,
} from '@jonasb/datadata-core';
import type { Server } from '@jonasb/datadata-server';
import { useContext, useMemo } from 'react';
import { AUTH_KEYS_HEADER, DISPLAY_AUTH_KEYS } from '../config/AuthKeyConfig';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../config/CloudinaryConfig';
import { SYSTEM_USERS } from '../config/SystemUsers';
import { BackendUrls } from '../utils/BackendUrls';
import { fetchJsonResult } from '../utils/BackendUtils';
import { isAdminCloudinaryImage } from '../utils/SchemaTypes';
import { InBrowserServerContext } from './InBrowserServerContext';

type BackendContext = ClientContext;

const logger = createConsoleLogger(console);

class AdminContextAdapter implements AdminDataDataContextAdapter {
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
    const { value, onChange } = props;
    if (isAdminCloudinaryImage(value)) {
      return CloudinaryImageFieldEditorWithoutClear({
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        value,
        onChange,
      });
    }
    return null;
  }
}

export function AppAdminDataDataProvider({ children }: { children: React.ReactNode }) {
  const inBrowserValue = useContext(InBrowserServerContext);
  const cachingMiddleware = useCachingAdminMiddleware();

  const args = useMemo(
    () => ({
      adminClient: inBrowserValue
        ? createInBrowserAdminClient(inBrowserValue.server, cachingMiddleware)
        : createBackendAdminClient(cachingMiddleware),
      adapter: new AdminContextAdapter(),
      authKeys: DISPLAY_AUTH_KEYS,
    }),
    [inBrowserValue, cachingMiddleware]
  );

  const { adminClient } = args;
  if (!adminClient) {
    return null;
  }
  return (
    <AdminDataDataProvider {...args} adminClient={adminClient}>
      {children}
    </AdminDataDataProvider>
  );
}

function createInBrowserAdminClient(
  server: Server | null,
  cachingMiddleware: AdminClientMiddleware<BackendContext>
) {
  if (!server) return null;

  const sessionResult = server.createSession(SYSTEM_USERS.editor);
  return server.createAdminClient(() => sessionResult, [cachingMiddleware]);
}

function createBackendAdminClient(
  cachingMiddleware: AdminClientMiddleware<BackendContext>
): AdminClient {
  const context: BackendContext = { logger };
  return createBaseAdminClient({
    context,
    pipeline: [cachingMiddleware, terminatingAdminMiddleware],
  });
}

async function terminatingAdminMiddleware(
  context: BackendContext,
  operation: AdminClientOperation
): Promise<void> {
  let result: Result<unknown, ErrorType>;
  if (operation.modifies) {
    result = await fetchJsonResult(context, BackendUrls.admin(operation.name), {
      method: 'PUT',
      headers: { ...AUTH_KEYS_HEADER, 'content-type': 'application/json' },
      body: JSON.stringify(operation.args),
    });
  } else {
    result = await fetchJsonResult(context, BackendUrls.admin(operation.name, operation.args), {
      method: 'GET',
      headers: AUTH_KEYS_HEADER,
    });
  }
  operation.resolve(convertJsonAdminClientResult(operation.name, result));
}
