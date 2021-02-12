import { DataDataContext, EntityEditor } from '@datadata/admin-react-components';
import type { AdminEntity, AdminEntityCreate, AdminEntityUpdate } from '@datadata/core';
import Joi from 'joi';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { useInitializeContext } from '../../contexts/DataDataContext';
import type { EntityResponse } from '../../types/ResponseTypes';
import { fetchJsonAsync, urls } from '../../utils/BackendUtils';
import { validateQuery } from '../../utils/PageUtils';

interface NewEntity {
  _type: string;
}

interface RouterQuery {
  id: 'new' | string;
  type?: string;
}
const routerSchema = Joi.object<RouterQuery>({ id: Joi.string().required(), type: Joi.string() });

function PageContent({ query }: { query: RouterQuery }) {
  const { contextValue } = useInitializeContext();
  const [entity, setEntity] = useState<NewEntity | AdminEntity | null>(null);

  useEffect(() => {
    if (query.id === 'new' && query.type) {
      setEntity({ _type: query.type });
      return;
    }
    (async () => {
      try {
        const entityResponse = await fetchJsonAsync<EntityResponse>(urls.getEntity(query.id, {}));
        setEntity(entityResponse.item);
      } catch (error) {
        console.warn(error);
      }
    })();
  }, [query.id, query.type]);

  const handleSubmit = useCallback(
    (entity: AdminEntityCreate | AdminEntityUpdate) => {
      (async () => {
        try {
          //TODO entity includes id on update, so always POST?
          //TODO version
          //TODO use context
          if (query.id === 'new') {
            const response = await fetchJsonAsync<EntityResponse>(urls.createEntity, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ item: entity }),
            });
            setEntity(response.item);
          } else {
            const response = await fetchJsonAsync<EntityResponse>(urls.getEntity(query.id, {}), {
              method: 'PUT',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ item: entity }),
            });
            setEntity(response.item);
          }
        } catch (error) {
          console.warn(error);
        }
      })();
    },
    [query.id]
  );

  return (
    <DataDataContext.Provider value={contextValue}>
      <div>{entity ? <EntityEditor entity={entity} onSubmit={handleSubmit} /> : null}</div>
    </DataDataContext.Provider>
  );
}

export default function EntityPage(): JSX.Element | null {
  const router = useRouter();

  if (Object.keys(router.query).length === 0) {
    return null;
  }
  const query = validateQuery(router.query, routerSchema);

  return <PageContent query={query} />;
}
