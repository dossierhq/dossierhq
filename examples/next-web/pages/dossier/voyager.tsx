import dynamic from 'next/dynamic';
import type { JSX } from 'react';

const VoyagerPage = dynamic(() => import('../../components/VoyagerPage/VoyagerPage'), {
  ssr: false,
});

export default function VoyagerIndexPage(): JSX.Element {
  return <VoyagerPage />;
}
