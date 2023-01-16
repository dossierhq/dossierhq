import '@jonasb/datadata-design/main.css';

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <html lang="en-US">
      <head>
        <meta name="viewport" content="width=device-width" />
        <title>Dossier – an open source, embeddable content platform</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
