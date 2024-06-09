import { ThemeProvider } from '@dossierhq/react-components2';
import type { ReactNode } from 'react';
import { AppDossierProvider2 } from '../../../contexts/AppDossierProvider2';
import '@dossierhq/react-components2/main.css';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-US">
      <body>
        <ThemeProvider>
          <AppDossierProvider2>{children}</AppDossierProvider2>
        </ThemeProvider>
      </body>
    </html>
  );
}
