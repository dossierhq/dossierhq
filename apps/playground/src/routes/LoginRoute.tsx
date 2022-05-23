import { FullscreenContainer } from '@jonasb/datadata-design';
import { useContext, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { LoginContext } from '../contexts/LoginContext';
import { UserContext } from '../contexts/UserContext';
import { ROUTE } from '../utils/RouteUtils';

export function LoginRoute() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUserId } = useContext(UserContext);
  const login = useContext(LoginContext);
  const executedLoginRef = useRef(false);

  useEffect(() => {
    if (userId && !executedLoginRef.current) {
      executedLoginRef.current = true;
      login(userId);
    }
  }, []);

  useEffect(() => {
    if (currentUserId === userId) {
      navigate(ROUTE.index.url);
    }
  }, [currentUserId]);

  return (
    <FullscreenContainer>
      <FullscreenContainer.Row fullWidth>
        <NavBar current="home" />
      </FullscreenContainer.Row>
    </FullscreenContainer>
  );
}
