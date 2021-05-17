import '@datadata/admin-react-components/main.css';
import '@datadata/admin-react-components/icons.css';
import 'graphql-voyager/dist/voyager.css';
import 'leaflet/dist/leaflet.css';
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
