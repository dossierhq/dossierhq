import type {
  DataDataContextAdapter,
  EditorJsToolSettings,
} from '@jonasb/datadata-admin-react-components';
import { DataDataContextValue } from '@jonasb/datadata-admin-react-components';
import type {
  AdminClient,
  AdminClientOperation,
  ClientContext,
  ErrorType,
  Logger,
  Result,
} from '@jonasb/datadata-core';
import {
  convertAdminClientOperationToJson,
  convertJsonAdminClientResult,
  createBaseAdminClient,
  Schema,
} from '@jonasb/datadata-core';
import { useEffect, useMemo, useState } from 'react';
import type { SchemaResponse } from '../types/ResponseTypes';
import { fetchJson, fetchJsonResult, urls } from '../utils/BackendUtils';
import { EditorJsTools } from './EditorJsTools';

type BackendContext = ClientContext;

const logger: Logger = {
  error(message, ...args) {
    console.error(`error: ${message}`, ...args);
  },
  warn(message, ...args) {
    console.warn(`warn: ${message}`, ...args);
  },
  info(message, ...args) {
    console.info(`info: ${message}`, ...args);
  },
  debug(message, ...args) {
    console.debug(`debug: ${message}`, ...args);
  },
};

class ContextAdapter implements DataDataContextAdapter {
  getEditorJSConfig: DataDataContextAdapter['getEditorJSConfig'] = (
    fieldSpec,
    standardBlockTools,
    standardInlineTools
  ) => {
    const defaultInlineToolbar = [
      ...standardInlineTools,
      ...Object.keys(EditorJsTools.inlineTools),
    ];

    const tools: { [toolName: string]: EditorJsToolSettings } = {};

    if (fieldSpec.richTextBlocks && fieldSpec.richTextBlocks.length > 0) {
      for (const { type, inlineTypes } of fieldSpec.richTextBlocks) {
        if (standardBlockTools[type]) {
          tools[type] = standardBlockTools[type];
        } else {
          const blockTool = EditorJsTools.blockTools[type];
          if (blockTool) {
            tools[type] = { class: blockTool, inlineToolbar: inlineTypes ?? true };
          } else {
            throw new Error(`No support for tool ${type}`);
          }
        }
      }
    } else {
      Object.entries(standardBlockTools).forEach(
        ([toolName, config]) => (tools[toolName] = config)
      );
      Object.entries(EditorJsTools.blockTools).forEach(
        ([toolName, constructable]) =>
          (tools[toolName] = {
            class: constructable,
            inlineToolbar: true,
          })
      );
    }

    Object.entries(EditorJsTools.inlineTools).forEach(
      ([toolName, constructable]) =>
        (tools[toolName] = {
          class: constructable,
        })
    );

    return { tools, inlineToolbar: defaultInlineToolbar };
  };
}

async function loadSchema() {
  //TODO swr? Move to adminClient

  const schemaResponse = await fetchJson<SchemaResponse>(urls.schema);
  const schema = new Schema(schemaResponse.spec);
  return schema;
}

export function useInitializeContext(): { contextValue: DataDataContextValue | null } {
  const [schema, setSchema] = useState<Schema | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await loadSchema();
        setSchema(s);
      } catch (error) {
        //TODO handle error, support retry
        console.warn(error);
      }
    })();
  }, []);

  const contextValue = useMemo(() => {
    return schema
      ? new DataDataContextValue(new ContextAdapter(), createBackendAdminClient(), schema)
      : null;
  }, [schema]);

  return { contextValue };
}

function createBackendAdminClient(): AdminClient {
  const context: BackendContext = { logger };
  return createBaseAdminClient({ context, pipeline: [terminatingMiddleware] });
}

async function terminatingMiddleware(
  _context: BackendContext,
  operation: AdminClientOperation
): Promise<void> {
  const jsonOperation = convertAdminClientOperationToJson(operation);

  let result: Result<unknown, ErrorType>;
  if (operation.modifies) {
    result = await fetchJsonResult(urls.admin(operation.name), {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(jsonOperation),
    });
  } else {
    result = await fetchJsonResult(urls.admin(operation.name, jsonOperation), {
      method: 'GET',
      headers: { 'content-type': 'application/json' },
    });
  }
  operation.resolve(convertJsonAdminClientResult(operation.name, result));
}
