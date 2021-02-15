import { DataDataContext, EntityEditor } from '@datadata/admin-react-components';
import type { EntityEditorProps } from '@datadata/admin-react-components';
import Joi from 'joi';
import { useRouter } from 'next/router';
import { useInitializeContext } from '../../contexts/DataDataContext';
import { validateQuery } from '../../utils/PageUtils';

interface RouterQuery {
  id: 'new' | string;
  type?: string;
}
const routerSchema = Joi.object<RouterQuery>({ id: Joi.string().required(), type: Joi.string() });

function PageContent({ query }: { query: RouterQuery }) {
  const { contextValue } = useInitializeContext();
  const { type } = query;
  const entity: EntityEditorProps['entity'] =
    query.id === 'new' && type ? { type, isNew: true } : { id: query.id };

  return (
    <DataDataContext.Provider value={contextValue}>
      <EntityEditor entity={entity} />
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
