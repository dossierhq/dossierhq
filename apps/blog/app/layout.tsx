import '@dossierhq/design/main.css';
import type { Metadata } from 'next';

interface Props {
  children: React.ReactNode;
}

export const metadata: Metadata = {
  title: {
    default: 'Dossier – the open source headless CMS toolkit',
    template: '%s | Dossier',
  },
  icons: '/favicon.svg',
  alternates: {
    types: {
      'application/atom+xml': 'https://www.dossierhq.dev/atom.xml',
    },
  },
};

export default function Layout({ children }: Props) {
  return (
    <html lang="en-US">
      <body>{children}</body>
    </html>
  );
}
