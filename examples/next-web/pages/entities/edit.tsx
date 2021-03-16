import type { EntityEditorSelector } from '@datadata/admin-react-components';
import Joi from 'joi';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import type { EntityEditorPageProps } from '../../components/EntityEditorPage/EntityEditorPage';
import { validateQuery } from '../../utils/PageUtils';

const EntityEditorPage = dynamic<EntityEditorPageProps>(
  () =>
    import('../../components/EntityEditorPage/EntityEditorPage').then(
      (mod) => mod.EntityEditorPage
    ),
  { ssr: false }
);

interface RouterQuery {
  ids?: string;
  type?: string;
}
const routerSchema = Joi.object<RouterQuery>({ ids: Joi.string(), type: Joi.string() });

export default function EntityPage(): JSX.Element | null {
  const router = useRouter();

  if (Object.keys(router.query).length === 0) {
    return null;
  }
  const query = validateQuery(router.query, routerSchema);
  const entitySelectors: EntityEditorSelector[] = [];
  if (query.type) {
    entitySelectors.push({ newType: query.type as string });
  }
  for (const id of query.ids?.split(',') ?? []) {
    entitySelectors.push({ id });
  }

  return <EntityEditorPage entitySelectors={entitySelectors} />;
}
