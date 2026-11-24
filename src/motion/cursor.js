import { gsap } from 'gsap';

const HOT = 'a, button, select, .stop, .cal__day';

export function cursor() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const dot = document.createElement('div');
  const ring = document.createElement('div');
  dot.className = 'cursor';
  ring.className = 'cursor-ring';
  document.body.append(dot, ring);
  const dx = gsap.quickSetter(dot, 'x', 'px'), dy = gsap.quickSetter(dot, 'y', 'px');
  const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'proa.out' }), ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'proa.out' });
  let shown = false, state = '';
  addEventListener('pointermove', (e) => {
    dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    if (!shown) { shown = true; gsap.set(ring, { x: e.clientX, y: e.clientY }); }
    const t = e.target instanceof Element ? e.target : null;
    const next = t?.closest('input') ? 'off' : t?.closest(HOT) ? 'hot' : 'on';
    if (next === state) return;
    state = next;
    gsap.to(dot, { autoAlpha: next === 'off' ? 0 : 1, scale: next === 'hot' ? 0 : 1, duration: 0.3, ease: 'proa.out' });
    gsap.to(ring, { autoAlpha: next === 'off' ? 0 : 1, scale: next === 'hot' ? 1.7 : 1, duration: 0.5, ease: 'proa.out' });
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => { state = ''; gsap.to([dot, ring], { autoAlpha: 0, duration: 0.3 }); });
}
