import '@dossierhq/design/main.css';

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <html lang="en-US">
      <head>
        <meta name="viewport" content="width=device-width" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link
          href="https://www.dossierhq.dev/atom.xml"
          rel="alternate"
          title="Dossier blog"
          type="application/atom+xml"
        />
        <title>Dossier – the open source headless CMS toolkit</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
