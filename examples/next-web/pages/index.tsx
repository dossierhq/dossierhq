import { FullscreenContainer } from '@dossierhq/design';
import Head from 'next/head';
import { NavBar } from '../components/NavBar/NavBar';

export default function Home(): JSX.Element {
  return (
    <>
      <Head>
        <title>{process.env.NEXT_PUBLIC_SITE_NAME}</title>
      </Head>
      <FullscreenContainer>
        <FullscreenContainer.Row fullWidth>
          <NavBar current="home" />
        </FullscreenContainer.Row>
        <FullscreenContainer.Row>
          <h1>Welcome to {process.env.NEXT_PUBLIC_SITE_NAME}</h1>
        </FullscreenContainer.Row>
      </FullscreenContainer>
    </>
  );
}
