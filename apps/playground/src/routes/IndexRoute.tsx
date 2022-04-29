import { FullscreenContainer } from '@jonasb/datadata-design';
import { Link } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { ROUTE } from '../utils/RouteUtils';

export function IndexRoute() {
  return (
    <FullscreenContainer>
      <FullscreenContainer.Row fullWidth>
        <NavBar current="home" />
      </FullscreenContainer.Row>
      <FullscreenContainer.Row>
        <Link to={ROUTE.adminEditEntities.url}>New editor</Link>
      </FullscreenContainer.Row>
    </FullscreenContainer>
  );
}
