import { published } from '@jonasb/datadata-admin-react-components';
import type { EntityReference } from '@jonasb/datadata-core';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { PublishedDataDataSharedProvider } from '../../contexts/DataDataSharedProvider';
import { NavBar } from '../NavBar/NavBar';

const { EntityDetailScreen } = published;

export default function PublishedEntityDetailPage({
  reference,
}: {
  reference: EntityReference;
}): JSX.Element | null {
  const router = useRouter();

  return (
    <PublishedDataDataSharedProvider>
      <Head>
        <title>Entity</title>
      </Head>
      <EntityDetailScreen header={<NavBar current="published-entities" />} reference={reference} />
    </PublishedDataDataSharedProvider>
  );
}
