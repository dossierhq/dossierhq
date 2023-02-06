import { FullscreenContainer } from '@dossierhq/design';
import { useContext, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NavBar } from '../components/NavBar.js';
import { LoginContext } from '../contexts/LoginContext.js';
import { UserContext } from '../contexts/UserContext.js';
import { ROUTE } from '../utils/RouteUtils.js';

export function LoginRoute() {
  const { userId, serverName } = useParams();
  const navigate = useNavigate();
  const { currentUserId } = useContext(UserContext);
  const login = useContext(LoginContext);
  const executedLoginRef = useRef(false);

  useEffect(() => {
    if (userId && !executedLoginRef.current) {
      executedLoginRef.current = true;
      login(userId);
    }
  }, [login, userId]);

  useEffect(() => {
    if (currentUserId === userId) {
      navigate(serverName ? ROUTE.server.url(serverName) : ROUTE.index.url);
    }
  }, [currentUserId, navigate, serverName, userId]);

  return (
    <FullscreenContainer>
      <FullscreenContainer.Row fullWidth>
        <NavBar current="home" />
      </FullscreenContainer.Row>
    </FullscreenContainer>
  );
}
