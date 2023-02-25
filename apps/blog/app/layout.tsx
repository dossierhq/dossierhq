import '@dossierhq/design/main.css';
import type { Metadata } from 'next';
import { canonicalUrl } from '../utils/BrowserUrls';

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
      'application/atom+xml': canonicalUrl('/atom.xml'),
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'Dossier',
    description: 'Dossier is an open source toolkit for building headless CMSs.',
    url: canonicalUrl('/'),
    images: canonicalUrl('/og-dossier.png'),
  },
};

export default function Layout({ children }: Props) {
  return (
    <html lang="en-US">
      <body>{children}</body>
    </html>
  );
}
