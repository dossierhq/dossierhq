import { FullscreenContainer } from '@dossierhq/design';
import Head from 'next/head';
import type { JSX } from 'react';
import { NavBar } from '../../components/NavBar/NavBar';

export default function GraphiQLPage(): JSX.Element {
  const src = `<html>
    <head>
      <title>GraphiQL</title>
      <link href="https://esm.sh/graphiql@4.0.0/dist/style.css" rel="stylesheet" />
      <script type="importmap">
      {
        "imports": {
          "react": "https://esm.sh/react@19.1.0",
          "react/jsx-runtime": "https://esm.sh/react@19.1.0/jsx-runtime",

          "react-dom": "https://esm.sh/react-dom@19.1.0",
          "react-dom/client": "https://esm.sh/react-dom@19.1.0/client",

          "graphiql": "https://esm.sh/graphiql@4.0.0?standalone&external=react,react/jsx-runtime,react-dom,@graphiql/react",
          "@graphiql/plugin-explorer": "https://esm.sh/@graphiql/plugin-explorer@4.0.0?standalone&external=react,react/jsx-runtime,react-dom,@graphiql/react,graphql",
          "@graphiql/react": "https://esm.sh/@graphiql/react@0.30.0?standalone&external=react,react/jsx-runtime,react-dom,graphql,@graphiql/toolkit",

          "@graphiql/toolkit": "https://esm.sh/@graphiql/toolkit@0.11.2?standalone&external=graphql",
          "graphql": "https://esm.sh/graphql@16.11.0"
        }
      }
    </script>
     <script type="module">
      // Import React and ReactDOM
      import React from 'react';
      import ReactDOM from 'react-dom/client';
      // Import GraphiQL and the Explorer plugin
      import { GraphiQL } from 'graphiql';
      import { createGraphiQLFetcher } from '@graphiql/toolkit';
      import { explorerPlugin } from '@graphiql/plugin-explorer';

      const fetcher = createGraphiQLFetcher({
        url: '${process.env.NEXT_PUBLIC_API_BASE_URL}/graphql',
      });
      localStorage.setItem('graphiql:theme', 'light');
      const explorer = explorerPlugin();

      function App() {
        return React.createElement(GraphiQL, {
          fetcher,
          plugins: [explorer],
        });
      }

      const container = document.getElementById('graphiql');
      const root = ReactDOM.createRoot(container);
      root.render(React.createElement(App));
    </script>
    </head>
    <body style="margin: 0;">
      <div id="graphiql" style="height: 100vh;"></div>
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
