import { FullscreenContainer } from '@dossierhq/design';
import Head from 'next/head';
import { NavBar } from '../../components/NavBar/NavBar';

export default function GraphiQLPage(): JSX.Element {
  const src = `<html>
    <head>
      <title>GraphiQL</title>
      <link href="https://unpkg.com/graphiql/graphiql.min.css" rel="stylesheet" />
    </head>
    <body style="margin: 0;">
      <div id="graphiql" style="height: 100vh;"></div>
      <script crossorigin src="https://unpkg.com/react/umd/react.production.min.js"></script>
      <script
        crossorigin
        src="https://unpkg.com/react-dom/umd/react-dom.production.min.js"
      ></script>
      <script crossorigin src="https://unpkg.com/graphiql/graphiql.min.js"></script>

      <script>
        const fetcher = GraphiQL.createFetcher({
          url: '${process.env.NEXT_PUBLIC_API_BASE_URL}/graphql',
        });

        localStorage.setItem('graphiql:theme', 'light');
        ReactDOM.render(
          React.createElement(GraphiQL, { fetcher }),
          document.getElementById('graphiql')
        );
      </script>
    </body>
  </html>`;
  const iframe = <iframe srcDoc={src} style={{ width: '100%', height: '100%' }} />;

  return (
    <>
      <Head>
        <title>GraphiQL</title>
      </Head>
      <FullscreenContainer>
        <FullscreenContainer.Row fullWidth>
          <NavBar current="graphiql" />
        </FullscreenContainer.Row>
        <FullscreenContainer.Row fullWidth fillHeight>
          {iframe}
        </FullscreenContainer.Row>
      </FullscreenContainer>
    </>
  );
}
