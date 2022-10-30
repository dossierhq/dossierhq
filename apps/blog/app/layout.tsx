import '@jonasb/datadata-design/main.css';

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <html>
      <head>
        <title>Data data</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
