import type { DataDataContextValue } from '@datadata/admin-react-components';
import { Schema } from '@datadata/core';
import { useEffect, useMemo, useState } from 'react';
import type { SchemaResponse } from '../types/ResponseTypes';
import { fetchJsonAsync, urls } from '../utils/BackendUtils';

class ContextValue implements DataDataContextValue {
  schema: Schema;

  constructor(schema: Schema) {
    this.schema = schema;
  }
}

async function loadSchema() {
  //TODO swr?

  const schemaResponse = await fetchJsonAsync<SchemaResponse>(urls.schema);
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

  const contextValue = useMemo(() => (schema ? new ContextValue(schema) : null), [schema]);

  return { contextValue };
}
