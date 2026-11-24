// Carta náutica: a rota se desenha com o scroll e as paradas acendem quando o barco chega nelas.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { revealOnce } from './type.js';

export const ROUTES = [
  { stops: [['10:00', 'Embarque combinado', 530, 285], ['', "Praia do Caixa d'Aço", 770, 405]] },
  { stops: [['10:00', 'Embarque combinado', 530, 285], ['', "Praia do Caixa d'Aço", 770, 405], ['', 'Ilha de Porto Belo', 1105, 318]] },
  { stops: [['10:00', 'Embarque combinado', 530, 285], ['', 'Praia do Estaleirinho', 440, 120]] },
];

// curva suave (Catmull-Rom) que passa por todas as paradas
function pathOf(pts) {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  const prefixes = [d];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
    prefixes.push(d);
  }
  return { d, prefixes };
}

export function routes({ reduced }) {
  const section = document.querySelector('.routes');
  const chart = section.querySelector('.chart');
  const img = section.querySelector('.chart__img');
  const route = section.querySelector('.route');
  const mask = section.querySelector('.route-mask');
  const marks = section.querySelector('.marks');
  const boatEl = section.querySelector('.chart__boat');
  const list = section.querySelector('.stops');
  const meta = section.querySelector('.routes__meta');
  const tabs = [...section.querySelectorAll('.rtabs button')];
  const NS = 'http://www.w3.org/2000/svg';
  const probe = document.createElementNS(NS, 'path');

  let idx = 0, len = 1, at = [], stopEls = [], markEls = [];
  const state = { scroll: reduced ? 1 : 0, show: 1 };

  function build(k) {
    idx = k;
    const r = ROUTES[k];
    const { d, prefixes } = pathOf(r.stops.map((s) => [s[2], s[3]]));
    route.setAttribute('d', d);
    mask.setAttribute('d', d);
    len = route.getTotalLength();
    mask.style.strokeDasharray = `${len} ${len}`;
    at = prefixes.map((p, i) => { if (!i) return 0; probe.setAttribute('d', p); return probe.getTotalLength(); });
    list.innerHTML = r.stops.map((s) => `<li class="stop"><time>${s[0]}</time><span>${s[1]}</span></li>`).join('');
    marks.innerHTML = r.stops.map((s, i) => `<g class="mark"><circle cx="${s[2]}" cy="${s[3]}" r="20"/><text x="${s[2]}" y="${s[3]}">${i + 1}</text></g>`).join('');
    stopEls = [...list.children];
    markEls = [...marks.children];
    stopEls.forEach((el, i) => {
      el.addEventListener('pointerenter', () => { el.classList.add('is-hover'); markEls[i].classList.add('is-hover'); });
      el.addEventListener('pointerleave', () => { el.classList.remove('is-hover'); markEls[i].classList.remove('is-hover'); });
    });
    meta.textContent = `DIÁRIA DAS 10:00 ÀS 18:00 · ROTEIRO COMBINADO NO WHATSAPP`;
    tabs.forEach((t, i) => { t.classList.toggle('is-on', i === k); t.setAttribute('aria-pressed', i === k); });
  }

  function draw() {
    const L = len * state.scroll * state.show;
    mask.style.strokeDashoffset = (len - L).toFixed(1);
    at.forEach((a, i) => {
      const on = L >= a - 0.5 && state.scroll * state.show > 0.001;
      markEls[i].classList.toggle('is-on', on);
      stopEls[i].classList.toggle('is-on', on);
    });
    const p = route.getPointAtLength(L);
    const q = route.getPointAtLength(Math.min(len, L + 2));
    const b = L > 1 ? route.getPointAtLength(L - 2) : p;
    const ang = (Math.atan2(q.y - b.y, q.x - b.x) * 180) / Math.PI + 90;
    boatEl.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${ang.toFixed(1)})`);
    boatEl.style.opacity = state.scroll * state.show > 0.001 ? 1 : 0;
  }

  build(0);
  draw();

  if (!reduced) {
    ScrollTrigger.create({
      trigger: chart,
      start: 'top 95%',
      end: () => `bottom ${innerWidth < 760 ? 60 : 92}%`,
      onUpdate: (s) => { state.scroll = s.progress; draw(); },
      onRefresh: (s) => { state.scroll = s.progress; draw(); },
    });
    gsap.fromTo(img, { scale: 1.08, yPercent: -4 }, { scale: 1, yPercent: 4, ease: 'none', scrollTrigger: { trigger: chart, start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  let tl;
  tabs.forEach((t, k) => t.addEventListener('click', () => {
    if (k === idx) return;
    tl?.kill();
    if (reduced) { build(k); draw(); return; }
    tl = gsap.timeline()
      .to(state, { show: 0, duration: 0.45, ease: 'proa.in', onUpdate: draw })
      .add(() => { build(k); draw(); })
      .to(state, { show: 1, duration: 1.6, ease: 'proa.inOut', onUpdate: draw });
  }));

  revealOnce(section.querySelector('.duo'), { reduced, start: 'top 84%', ScrollTrigger });
}
