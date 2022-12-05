import { PublishedEntityDisplayScreen } from '@jonasb/datadata-admin-react-components';
import Head from 'next/head';
import { AppPublishedDataDataProvider } from '../../contexts/AppPublishedDataDataProvider';
import { useUrlSearchParams } from '../../hooks/useUrlSearchParams';
import { NavBar } from '../NavBar/NavBar';

export default function PublishedEntityDetailPage(): JSX.Element | null {
  const { onUrlSearchParamsChange, urlSearchParams } = useUrlSearchParams();

  return (
    <AppPublishedDataDataProvider>
      <Head>
        <title>Published entities</title>
      </Head>
      <PublishedEntityDisplayScreen
        header={<NavBar current="published-entities" />}
        urlSearchParams={urlSearchParams}
        onUrlSearchParamsChange={onUrlSearchParamsChange}
      />
    </AppPublishedDataDataProvider>
  );
}
