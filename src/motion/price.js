// A diária: o barquinho navega pelo mostrador de 24 horas e deixa o arco como esteira.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { revealOnce, textItem } from './type.js';
import { lerp, span } from './ease.js';

export const PIN = 1.6;
const SWEEP = [0.08, 0.9];
const H0 = 10, H1 = 18; // diárias das 10:00 às 18:00 (post da Wave)
// de 2 em 2 horas: com 1 h de distância os rótulos se encostam no topo do mostrador
const ITEMS = [[10, 'embarque'], [12, 'primeiro mergulho'], [14, 'som na popa'], [16, 'fim de tarde'], [18, 'desembarque']];
const CX = 450, CY = 360, R = 250;
const NS = 'http://www.w3.org/2000/svg';
const pt = (h, r) => { const a = (h / 24) * Math.PI * 2; return [CX - Math.sin(a) * r, CY + Math.cos(a) * r]; };
const make = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent?.appendChild(e); return e; };
const hh = (h) => `${String(h).padStart(2, '0')}h`;

export function price({ reduced }) {
  const section = document.querySelector('.price');
  const pinEl = section.querySelector('.price__pin');
  const svg = section.querySelector('.price__dial > svg');
  const nowEl = section.querySelector('.dial__now');
  const C = 2 * Math.PI * R;
  if (innerWidth < 760) svg.setAttribute('viewBox', `${CX - 300} ${CY - 300} 600 600`);

  make('circle', { class: 'dial__track', cx: CX, cy: CY, r: R }, svg);
  const arc = make('circle', { class: 'dial__arc', cx: CX, cy: CY, r: R }, svg);
  arc.style.strokeDashoffset = `${(-H0 / 24) * C}`;
  const ticks = [];
  for (let h = 0; h < 24; h++) {
    const big = h % 6 === 0;
    const [x1, y1] = pt(h, R - 24), [x2, y2] = pt(h, R - (big ? 50 : 38));
    ticks.push({ h, el: make('line', { class: `dial__tick${big ? ' big' : ''}`, x1, y1, x2, y2 }, svg) });
    const [tx, ty] = pt(h, R - (big ? 68 : 56));
    const n = make('text', { class: 'dial__num', x: tx, y: ty }, svg);
    n.textContent = h;
    ticks.push({ h, el: n });
  }
  const items = ITEMS.map(([h, name]) => {
    const g = make('g', { class: 'dial__item' }, svg);
    const [px, py] = pt(h, R), [lx, ly] = pt(h, R + 34);
    const right = px >= CX;
    make('line', { x1: px, y1: py, x2: lx, y2: ly }, g);
    make('line', { x1: lx, y1: ly, x2: lx + (right ? 18 : -18), y2: ly }, g);
    make('circle', { cx: px, cy: py, r: 7 }, g);
    const t = make('text', { x: lx + (right ? 25 : -25), y: ly, 'text-anchor': right ? 'start' : 'end' }, g);
    const b = make('tspan', {}, t); b.textContent = hh(h);
    t.appendChild(document.createTextNode(` ${name}`));
    return { h, name, g };
  });
  const boatEl = make('path', { class: 'dial__boat', d: 'M0,-20 C9,-10 10,0 10,14 L-10,14 C-10,0 -9,-10 0,-20Z' }, svg);

  let curNow = -1, tw;
  function setNow(i) {
    if (i === curNow) return;
    const first = curNow < 0;
    curNow = i;
    const label = `${hh(ITEMS[i][0])} ${ITEMS[i][1]}`;
    // fecha a troca anterior e deixa só a legenda atual antes de trazer a nova (scroll rápido empilhava textos)
    tw?.kill();
    while (nowEl.children.length > 1) nowEl.firstElementChild.remove();
    const old = nowEl.firstElementChild;
    if (old) gsap.set(old, { yPercent: 0 });
    const span2 = document.createElement('span');
    span2.textContent = label;
    nowEl.appendChild(span2);
    if (first || reduced) { old?.remove(); return; }
    tw = gsap.timeline({ onComplete: () => old?.remove() })
      .to(old, { yPercent: -110, duration: 0.3, ease: 'proa.in' }, 0)
      .fromTo(span2, { yPercent: 110 }, { yPercent: 0, duration: 0.5, ease: 'proa.out' }, 0.12);
  }

  let last = -1;
  function draw(p) {
    const q = reduced ? 1 : span(p, SWEEP[0], SWEEP[1]);
    if (q === last) return;
    last = q;
    const h = lerp(H0, H1, q);
    arc.style.strokeDasharray = `${((h - H0) / 24) * C} ${C}`;
    const [x, y] = pt(h, R);
    const ang = (h / 24) * 360 + 270;
    boatEl.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)})`);
    let cur = 0;
    items.forEach((it, i) => { if (h >= it.h - 0.02) cur = i; });
    items.forEach((it, i) => {
      it.g.classList.toggle('is-past', i < cur);
      it.g.classList.toggle('is-now', i === cur);
    });
    setNow(cur);
  }
  draw(0);

  ScrollTrigger.create({
    trigger: pinEl, start: 'top top', end: () => `+=${PIN * innerHeight}`, pin: true, anticipatePin: 1,
    onUpdate: (s) => draw(s.progress),
    onRefresh: (s) => draw(s.progress),
  });

  // as marcas correm a partir das 10h quando a seção chega
  const order = [...ticks].sort((a, b) => ((a.h - H0 + 24) % 24) - ((b.h - H0 + 24) % 24));
  if (reduced) order.forEach((t) => (t.el.style.opacity = 0.75));
  else ScrollTrigger.create({ trigger: section, start: 'top 62%', once: true, onEnter: () => gsap.to(order.map((t) => t.el), { opacity: 0.75, duration: 0.5, ease: 'proa.out', stagger: 0.018 }) });

  revealOnce(section.querySelector('.duo'), { reduced, start: 'top 76%', ScrollTrigger });
  const side = textItem(section.querySelector('.price__side'), { reduced });
  side.hide();
  gsap.set(section.querySelector('.btn-sol'), { autoAlpha: 0, y: 12 });
  ScrollTrigger.create({ trigger: section, start: 'top 58%', once: true, onEnter: () => { side.in({ delay: 0.15 }); gsap.to(section.querySelector('.btn-sol'), { autoAlpha: 1, y: 0, duration: 0.9, delay: 0.5, ease: 'proa.out' }); } });
}
