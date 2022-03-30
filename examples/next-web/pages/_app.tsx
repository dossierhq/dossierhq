import '@jonasb/datadata-admin-react-components/main.css';
import '@jonasb/datadata-admin-react-components/icons.css';
import '@jonasb/datadata-design/main.css';
import 'graphql-voyager/dist/voyager.css';
import 'leaflet/dist/leaflet.css';
import { NotificationContainer } from '@jonasb/datadata-design';

function MyApp({
  Component,
  pageProps,
}: {
  Component: React.ComponentClass;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pageProps: any;
}): JSX.Element {
  return (
    <NotificationContainer>
      <Component {...pageProps} />
    </NotificationContainer>
  );
}

export default MyApp;
