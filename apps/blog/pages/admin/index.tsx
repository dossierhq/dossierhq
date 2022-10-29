import { FullscreenContainer } from '@jonasb/datadata-design';
import Head from 'next/head';
import { NavBar } from '../../components/NavBar/NavBar';

export default function Home(): JSX.Element {
  return (
    <>
      <Head>
        <title>next-web</title>
      </Head>
      <FullscreenContainer>
        <FullscreenContainer.Row fullWidth>
          <NavBar current="home" />
        </FullscreenContainer.Row>
        <FullscreenContainer.Row>
          <h1>Welcome to next-web</h1>
        </FullscreenContainer.Row>
      </FullscreenContainer>
    </>
  );
}
