import { FullscreenContainer } from '@jonasb/datadata-design';
import { Link } from 'react-router-dom';
import { ROUTE } from '../utils/RouteUtils';

export function IndexRoute() {
  return (
    <FullscreenContainer>
      <FullscreenContainer.Row>
        <Link to={ROUTE.adminEntities.url}>Admin entities</Link>
      </FullscreenContainer.Row>
    </FullscreenContainer>
  );
}
