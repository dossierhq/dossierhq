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
    title: 'Dossier is an open source toolkit for building headless CMSs',
    description:
      'Build solutions where you’re in full control of the content. Bring your own auth, database and backend, to build a headless CMS and integrate it with your app.',
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
