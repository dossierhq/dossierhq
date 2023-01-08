import { FullscreenContainer } from '@jonasb/datadata-design';
import { Voyager } from 'graphql-voyager';
import Head from 'next/head';
import { NavBar } from '../NavBar/NavBar';

export default function VoyagerPage(): JSX.Element {
  return (
    <>
      <Head>
        <title>Voyager | Blog</title>
      </Head>
      <FullscreenContainer>
        <FullscreenContainer.Row fullWidth>
          <NavBar current="voyager" />
        </FullscreenContainer.Row>
        <Voyager introspection={introspectionProvider} workerURI="/voyager.worker.js" />
      </FullscreenContainer>
    </>
  );
}

async function introspectionProvider(query: string) {
  const response = await fetch(window.location.origin + '/api/graphql', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: query }),
  });
  const json = await response.json();
  return json;
}
