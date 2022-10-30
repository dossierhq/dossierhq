import { FullscreenContainer } from '@jonasb/datadata-design';
import { NavBar } from '../components/NavBar/NavBar';

export default function Page() {
  return (
    <>
      <FullscreenContainer>
        <FullscreenContainer.Row fullWidth>
          <NavBar current="home" />
        </FullscreenContainer.Row>
        <FullscreenContainer.Row>
          <h1>Welcome to blog</h1>
        </FullscreenContainer.Row>
      </FullscreenContainer>
    </>
  );
}
