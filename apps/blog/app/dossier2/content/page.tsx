import { ContentListScreen } from '@dossierhq/react-components2';
import { AppDossierProvider2 } from '../../../contexts/AppDossierProvider2';

export default function Page() {
  return (
    <AppDossierProvider2>
      <ContentListScreen />
    </AppDossierProvider2>
  );
}
