import { Voyager, voyagerIntrospectionQuery } from 'graphql-voyager';
import Head from 'next/head';
import type { JSX } from 'react';
import { NavBar } from '../NavBar/NavBar';

export default function VoyagerPage(): JSX.Element {
  return (
    <>
      <Head>
        <title>Voyager</title>
      </Head>
      <div className="flex h-screen flex-col">
        <div className="shrink-0">
          <NavBar current="voyager" />
        </div>
        <div className="flex-1 overflow-auto">
          <Voyager introspection={introspection} />
        </div>
      </div>
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
