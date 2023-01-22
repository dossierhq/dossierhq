import { NotificationContainer } from '@dossierhq/design';
import '@dossierhq/design/main.css';
import '@dossierhq/leaflet/icons.css';
import '@dossierhq/leaflet/main.css';
import '@dossierhq/react-components/main.css';
import 'leaflet/dist/leaflet.css';

//TODO bundle CSS in ARC and remove need to add all css files here and to have direct dependencies to design/dossier-leaflet/leaflet

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
