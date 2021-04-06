import dynamic from 'next/dynamic';

const VoyagerPage = dynamic(() => import('../components/VoyagerPage/VoyagerPage'), { ssr: false });

export default function EntitiesIndexPage(): JSX.Element {
  return <VoyagerPage />;
}
