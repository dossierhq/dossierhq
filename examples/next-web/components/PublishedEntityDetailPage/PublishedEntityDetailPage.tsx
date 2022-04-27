import { PublishedEntityDetailScreen } from '@jonasb/datadata-admin-react-components';
import type { EntityReference } from '@jonasb/datadata-core';
import Head from 'next/head';
import { useState } from 'react';
import { PublishedDataDataSharedProvider } from '../../contexts/DataDataSharedProvider';
import { NavBar } from '../NavBar/NavBar';

export default function PublishedEntityDetailPage({
  reference,
}: {
  reference: EntityReference;
}): JSX.Element | null {
  const [title, setTitle] = useState('Entity');

  return (
    <PublishedDataDataSharedProvider>
      <Head>
        <title>{title}</title>
      </Head>
      <PublishedEntityDetailScreen
        header={<NavBar current="published-entities" />}
        reference={reference}
        onTitleChange={setTitle}
      />
    </PublishedDataDataSharedProvider>
  );
}
