import { ThemeProvider } from '@dossierhq/react-components2';
import '@dossierhq/react-components2/main.css';
import '../styles/main.css';
import 'graphql-voyager/dist/voyager.css';
import type { JSX } from 'react';

function MyApp({
  Component,
  pageProps,
}: {
  Component: React.ComponentClass;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pageProps: any;
}): JSX.Element {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default MyApp;
