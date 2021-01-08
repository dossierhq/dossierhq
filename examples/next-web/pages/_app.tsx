import '@datadata/admin-react-components/src/main.css';
import '../styles/globals.css';

function MyApp({
  Component,
  pageProps,
}: {
  Component: React.ComponentClass;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pageProps: any;
}): JSX.Element {
  return <Component {...pageProps} />;
}

export default MyApp;
