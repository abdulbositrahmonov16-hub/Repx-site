import { useEffect, useRef } from 'react';
import Lenis from '@studio-freight/lenis';

// Singleton reference so ScrollToTop (or any other component) can control
// the same Lenis instance that useSmoothScroll created.
let lenisSingleton = null;

export const getLenis = () => lenisSingleton;

export const useSmoothScroll = () => {
  const lenisRef = useRef(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    lenisRef.current = lenis;
    lenisSingleton = lenis;

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
      lenisSingleton = null;
    };
  }, []);

  return lenisRef;
};
