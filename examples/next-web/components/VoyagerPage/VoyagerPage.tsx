import { FullscreenContainer } from '@dossierhq/design';
import { Voyager, voyagerIntrospectionQuery } from 'graphql-voyager';
import Head from 'next/head';
import { NavBar } from '../NavBar/NavBar';

export default function VoyagerPage(): JSX.Element {
  return (
    <>
      <Head>
        <title>Voyager</title>
      </Head>
      <FullscreenContainer>
        <FullscreenContainer.Row fullWidth>
          <NavBar current="voyager" />
        </FullscreenContainer.Row>
        <Voyager introspection={introspection} />
      </FullscreenContainer>
    </>
  );
}

const introspection = introspectionProvider();

async function introspectionProvider() {
  const response = await fetch(window.location.origin + '/api/graphql', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: voyagerIntrospectionQuery }),
  });
  const json = await response.json();
  return json;
}
