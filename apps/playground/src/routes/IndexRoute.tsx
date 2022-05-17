import { FullscreenContainer } from '@jonasb/datadata-design';
import { NavBar } from '../components/NavBar';

export function IndexRoute() {
  return (
    <FullscreenContainer>
      <FullscreenContainer.Row fullWidth>
        <NavBar current="home" />
      </FullscreenContainer.Row>
    </FullscreenContainer>
  );
}
