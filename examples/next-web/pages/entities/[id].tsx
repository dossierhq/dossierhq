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
const routerSchema = Joi.object<RouterQuery>({ id: Joi.string().required() });

function PageContent({ query }: { query: RouterQuery }) {
  const [schema, setSchema] = useState<Schema | null>(null);
  const [entity, setEntity] = useState<AdminEntity | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const schemaResponse = await fetchJsonAsync<SchemaResponse>(urls.schema);
        const entityResponse = await fetchJsonAsync<EntityResponse>(urls.entity(query.id));

        const schema = new Schema(schemaResponse.spec);
        setSchema(schema);

        setEntity(entityResponse.item);
      } catch (error) {
        console.warn(error);
      }
    })();
  }, [query.id]);

  const handleSubmit = useCallback(
    (entity: AdminEntityCreate | AdminEntityUpdate) => {
      (async () => {
        try {
          //TODO handle create
          //TODO entity includes id on update, so always POST?
          await fetchJsonAsync<EntityResponse>(urls.entity(query.id), {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ item: entity }),
          });
        } catch (error) {
          console.warn(error);
        }
      })();
    },
    [query.id]
  );

  return (
    <div>
      {schema && entity ? (
        <EntityEditor schema={schema} entity={entity} onSubmit={handleSubmit} />
      ) : null}
    </div>
  );
}

export default function EntitiesIndexPage(): JSX.Element | null {
  const router = useRouter();

  if (Object.keys(router.query).length === 0) {
    return null;
  }
  const query = validateQuery(router.query, routerSchema);

  return <PageContent query={query} />;
}
