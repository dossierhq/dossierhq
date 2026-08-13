import { useAuth0 } from '@auth0/auth0-react';

const buttonClassName =
  'bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-8 shrink-0 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors';

export function LogInOutButton() {
  const { loginWithRedirect, isAuthenticated, isLoading, logout } = useAuth0();

  if (isLoading) {
    return null;
  }
  if (isAuthenticated) {
    return (
      <button
        type="button"
        className={buttonClassName}
        onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      >
        Log out
      </button>
    );
  }
  return (
    <button type="button" className={buttonClassName} onClick={() => loginWithRedirect()}>
      Log in
    </button>
  );
}
