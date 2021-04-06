import { Voyager } from 'graphql-voyager';

export default function VoyagerPage(): JSX.Element {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Voyager introspection={introspectionProvider} />
    </div>
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
