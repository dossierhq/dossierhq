import { ThemeProvider } from '@dossierhq/react-components2';
import type { ReactNode } from 'react';
import '@dossierhq/react-components2/main.css';
import '@dossierhq/cloudinary/main.css';
import '../../style/dossier.css';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-US">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
