import { EntityEditor } from '@datadata/admin-react-components';
import { AdminEntity, AdminEntityCreate, AdminEntityUpdate, Schema } from '@datadata/core';
import Joi from 'joi';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import type { EntityResponse, SchemaResponse } from '../../types/ResponseTypes';
import { fetchJsonAsync, urls } from '../../utils/BackendUtils';
import { validateQuery } from '../../utils/PageUtils';

interface RouterQuery {
  id: string;
}
const routerSchema = Joi.object<RouterQuery>({ id: Joi.string() });

export default function EntitiesIndexPage(): JSX.Element {
  const router = useRouter();
  const [schema, setSchema] = useState<Schema | null>(null);
  const [entity, setEntity] = useState<AdminEntity | null>(null);

  const { id } = validateQuery(router.query, routerSchema);

  useEffect(() => {
    (async () => {
      try {
        const schemaResponse = await fetchJsonAsync<SchemaResponse>(urls.schema);
        const entityResponse = await fetchJsonAsync<EntityResponse>(urls.entity(id));

        const schema = new Schema(schemaResponse.spec);
        setSchema(schema);

        setEntity(entityResponse.item);
      } catch (error) {
        console.warn(error);
      }
    })();
  }, [id]);

  const handleSubmit = useCallback(
    (entity: AdminEntityCreate | AdminEntityUpdate) => {
      (async () => {
        try {
          //TODO handle create
          //TODO entity includes id on update, so always POST?
          await fetchJsonAsync<EntityResponse>(urls.entity(id), {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ item: entity }),
          });
        } catch (error) {
          console.warn(error);
        }
      })();
    },
    [id]
  );

  return (
    <div>
      {schema && entity ? (
        <EntityEditor schema={schema} entity={entity} onSubmit={handleSubmit} />
      ) : null}
    </div>
  );
}
