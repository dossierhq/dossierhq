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
  id: 'new' | string;
  type?: string;
}
const routerSchema = Joi.object<RouterQuery>({ id: Joi.string().required(), type: Joi.string() });

export default function EntityPage(): JSX.Element | null {
  const router = useRouter();

  if (Object.keys(router.query).length === 0) {
    return null;
  }
  const query = validateQuery(router.query, routerSchema);

  return <EntityEditorPage entityId={query.id} entityType={query.type} />;
}
