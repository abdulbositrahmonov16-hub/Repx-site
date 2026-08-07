import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getLenis } from '@/hooks/useSmoothScroll';

/**
 * Resets scroll to the top on every route change.
 *
 * Because Lenis intercepts native scroll, calling `window.scrollTo`
 * alone is unreliable — we ask Lenis to jump to 0 immediately, and
 * fall back to the native call if the instance is not (yet) available.
 *
 * Must be rendered inside <BrowserRouter> to have access to useLocation().
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Disable native browser scroll restoration so back-nav also lands at top.
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    const lenis = getLenis();
    if (lenis && typeof lenis.scrollTo === 'function') {
      lenis.scrollTo(0, { immediate: true, force: true });
    }
    // Always fire native scrollTo too — belt & braces when Lenis is
    // stopped/destroyed or the browser tries to restore a previous offset.
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
