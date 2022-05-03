import type { LegacyEntityEditorSelector } from '@jonasb/datadata-admin-react-components';
import Joi from 'joi';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import type { LegacyEntityEditorPageProps } from '../../components/LegacyEntityEditorPage/LegacyEntityEditorPage';
import { validateQuery } from '../../utils/PageUtils';

const LegacyEntityEditorPage = dynamic<LegacyEntityEditorPageProps>(
  () =>
    import('../../components/LegacyEntityEditorPage/LegacyEntityEditorPage').then(
      (mod) => mod.LegacyEntityEditorPage
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
  const entitySelectors: LegacyEntityEditorSelector[] = [];
  if (query.type) {
    entitySelectors.push({ newType: query.type as string });
  }
  for (const id of query.ids?.split(',') ?? []) {
    entitySelectors.push({ id });
  }

  return <LegacyEntityEditorPage entitySelectors={entitySelectors} />;
}
