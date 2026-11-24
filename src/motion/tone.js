// Cor de fundo das seções sem foto, presa ao scroll: abismo → verde-mar → areia → cal.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const C = { abismo: '#04202c', mar: '#1d5e66', areia: '#efe6d6', cal: '#f7f5f0', tinta: '#0b2129' };

export function tone() {
  const root = document.documentElement;
  const a = gsap.utils.interpolate([C.abismo, C.mar, C.areia]);
  const b = gsap.utils.interpolate(C.areia, C.cal);
  const fg = gsap.utils.interpolate(C.cal, C.tinta);
  let p1 = 0, p2 = 0, last = '';
  const paint = () => {
    const bg = p2 > 0 ? b(p2) : a(p1);
    const text = fg(gsap.utils.clamp(0, 1, (p1 - 0.42) / 0.16));
    const k = bg + text;
    if (k === last) return;
    last = k;
    root.style.setProperty('--bg', bg);
    root.style.setProperty('--fg', text);
  };
  ScrollTrigger.create({ trigger: '.routes', start: 'top 100%', end: 'top 25%', onUpdate: (s) => { p1 = s.progress; paint(); }, onRefresh: (s) => { p1 = s.progress; paint(); } });
  ScrollTrigger.create({ trigger: '.price', start: 'top 90%', end: 'top 35%', onUpdate: (s) => { p2 = s.progress; paint(); }, onRefresh: (s) => { p2 = s.progress; paint(); } });
}
