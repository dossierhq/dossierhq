import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef } from 'react';

// Based on https://github.com/vercel/next.js/discussions/32231#discussioncomment-2421565

function throwFakeErrorToFoolNextRouter() {
  // Throwing an actual error class trips the Next.JS 500 Page, this string literal does not.
  throw 'Abort route change due to unsaved changes in form. Triggered by useWarningOnExit. Please ignore this error. See issue https://github.com/vercel/next.js/issues/2476';
}

function getWindow() {
  return typeof window !== 'undefined' ? window : null;
}

function getHistory() {
  return getWindow()?.history?.state;
}

export function useWarningOnExit(
  message: string,
  shouldWarn: boolean | ((fromUrl: string, toUrl: string) => boolean)
) {
  const router = useRouter();
  const lastHistory = useRef(getHistory());

  useEffect(() => {
    const storeLastHistoryState = () => {
      lastHistory.current = getHistory();
    };
    router.events.on('routeChangeComplete', storeLastHistoryState);
    return () => {
      router.events.off('routeChangeComplete', storeLastHistoryState);
    };
  }, [router]);

  /**
   * @experimental HACK - idx is not documented
   * Determines which direction to travel in history.
   */
  const revertTheChangeRouterJustMade = useCallback(() => {
    const state = lastHistory.current;
    if (state !== null && history.state !== null && state.idx !== history.state.idx) {
      const delta = lastHistory.current.idx < history.state.idx ? -1 : 1;
      history.go(delta);
    }
  }, []);

  const killRouterEvent = useCallback(() => {
    router.events.emit('routeChangeError');
    revertTheChangeRouterJustMade();
    throwFakeErrorToFoolNextRouter();
  }, [revertTheChangeRouterJustMade, router]);

  useEffect(() => {
    if (shouldWarn === false) {
      return;
    }

    const window = getWindow();
    let isWarned = false;

    const routeChangeStart = (url: string) => {
      if (router.asPath !== url && !isWarned) {
        const showConfirm =
          typeof shouldWarn === 'function' ? shouldWarn(router.asPath, url) : true;
        isWarned = true;
        if (!showConfirm || !window || window.confirm(message)) {
          router.push(url);
          return;
        }
        isWarned = false;
        killRouterEvent();
      }
    };

    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!isWarned) {
        event.returnValue = message;
      }
    };

    router.events.on('routeChangeStart', routeChangeStart);
    window?.addEventListener('beforeunload', beforeUnload);

    return () => {
      router.events.off('routeChangeStart', routeChangeStart);
      window?.removeEventListener('beforeunload', beforeUnload);
    };
  }, [message, shouldWarn, killRouterEvent, router]);
}
