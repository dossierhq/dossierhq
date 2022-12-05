import '@jonasb/datadata-admin-react-components/main.css';
import { NotificationContainer } from '@jonasb/datadata-design';
import '@jonasb/datadata-design/main.css';
import '@jonasb/datadata-leaflet/icons.css';
import '@jonasb/datadata-leaflet/main.css';
import 'graphql-voyager/dist/voyager.css';
import 'leaflet/dist/leaflet.css';
import { USE_IN_BROWSER_SERVER } from '../config/InBrowserServerConfig';
import { InBrowserServerProvider } from '../contexts/InBrowserServerContext';

//TODO bundle CSS in ARC and remove need to add all css files here and to have direct dependencies to design/dd-leaflet/leaflet

function MyApp({
  Component,
  pageProps,
}: {
  Component: React.ComponentClass;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pageProps: any;
}): JSX.Element {
  return (
    <InBrowserServerProvider enabled={USE_IN_BROWSER_SERVER}>
      <NotificationContainer>
        <Component {...pageProps} />
      </NotificationContainer>
    </InBrowserServerProvider>
  );
}

export default MyApp;
