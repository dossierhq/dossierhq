import { useAuth0 } from '@auth0/auth0-react';
import { Button } from '@dossierhq/design';

export function LogInOutButton() {
  const { loginWithRedirect, isAuthenticated, isLoading, logout } = useAuth0();

  if (isLoading) {
    return null;
  }
  if (isAuthenticated) {
    return <Button onClick={() => logout({ returnTo: window.location.origin })}>Log out</Button>;
  }
  return <Button onClick={() => loginWithRedirect()}>Log in</Button>;
}
