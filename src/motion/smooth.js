import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// a única suavização da página
export function smooth({ reduced }) {
  if (reduced) return null;
  const lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  ScrollTrigger.addEventListener('refresh', () => lenis.resize());
  lenis.resize();
  return lenis;
}
