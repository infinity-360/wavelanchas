// A planta plotada: uma linha atravessa a planta e troca o andar, na ordem física.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { revealOnce } from './type.js';
import { span } from './ease.js';

export const PIN = 2.4; // telas presas
const PRE = 0.4; // o trecho começa com o topo da seção a 40% da tela
const SCAN = [[0.06, 0.34], [0.43, 0.67], [0.75, 0.97]];
const DIR = [1, -1, 1]; // popa → proa, proa → popa, popa → proa
const NAMES = ['SOM E CHURRASCO', 'CONVÉS E EQUIPE', 'PARA DESCANSAR'];
// itens confirmados da Tecnomarine 50 no Instagram; a planta é ilustrativa
const PINS = [
  [['Som muito potente', 0.205, 0.5], ['Churrasqueira', 0.51, 0.4], ['Internet Starlink', 0.81, 0.5]],
  [['Auxiliar a bordo', 0.18, 0.47], ['Smart TV', 0.41, 0.4], ['Cozinha, geladeira e fogão', 0.46, 0.68], ['Marinheiro', 0.61, 0.43]],
  [['Dois quartos', 0.465, 0.36], ['Dois banheiros', 0.6, 0.55]],
];

export function boat({ app, reduced }) {
  const section = document.querySelector('.boat');
  const pinEl = section.querySelector('.boat__pin');
  const box = section.querySelector('.plan__box');
  const imgs = [...box.querySelectorAll('img')];
  const scan = box.querySelector('.plan__scan');
  const pinsEl = box.querySelector('.plan__pins');
  const legend = section.querySelector('.plan__legend');
  const tabs = [...section.querySelectorAll('.tabs button')];
  const tabLine = section.querySelector('.tabs__line');
  const floorName = section.querySelector('.boat__floor');
  const mini = [...section.querySelectorAll('.boat__mini path')];
  const mobile = () => innerWidth < 760;

  const nodes = PINS.map((list, k) => list.map(([name, x, y], i) => {
    const up = i % 2 === 0;
    const el = document.createElement('div');
    el.className = `pin ${up ? 'pin--up' : 'pin--down'} ${x < 0.55 ? 'pin--l' : 'pin--r'}`;
    el.style.left = `${x * 100}%`;
    el.style.top = `${y * 100}%`;
    el.style.setProperty('--f', up ? y + 0.02 : 1.02 - y);
    el.innerHTML = `<i class="pin__dot"><b>${i + 1}</b></i><i class="pin__wire"></i><span class="pin__label"><span>${name}</span></span>`;
    pinsEl.appendChild(el);
    return { el, x, k, i, name, on: false };
  }));

  let W = 0, H = 0, vw = innerWidth;
  function measure() {
    vw = innerWidth;
    if (mobile()) { H = innerHeight * 0.34; W = H * 2.625; box.style.width = `${W}px`; }
    else { box.style.width = ''; box.style.transform = ''; W = box.offsetWidth; H = box.offsetHeight; }
    nodes.flat().forEach((n) => n.el.style.setProperty('--h', `${parseFloat(n.el.style.getPropertyValue('--f')) * H}px`));
    positionTab(); last = '';
    draw(cur);
  }

  let floor = -1;
  function positionTab() {
    const t = tabs[Math.max(floor, 0)];
    tabLine.style.width = `${t.offsetWidth}px`;
    tabLine.style.transform = `translateX(${t.offsetLeft}px)`;
  }
  function setFloor(k) {
    if (k === floor) return;
    floor = k;
    tabs.forEach((t, i) => { t.classList.toggle('is-on', i === k); t.setAttribute('aria-pressed', i === k); });
    mini.forEach((m, i) => m.classList.toggle('is-on', i === k));
    floorName.textContent = NAMES[k];
    positionTab();
    legend.innerHTML = PINS[k].map(([n], i) => `<li><b>${i + 1}</b>${n}</li>`).join('');
    nodes[k].forEach((n) => legend.children[n.i].classList.toggle('is-on', n.on));
  }

  let cur = 0, last = '';
  function draw(p) {
    cur = p;
    let lineX = null;
    for (let k = 0; k < 3; k++) {
      const t = span(p, SCAN[k][0], SCAN[k][1]);
      let L = 0, R = 0;
      if (t <= 0) R = 1;
      else if (DIR[k] > 0) R = 1 - t;
      else L = 1 - t;
      if (t > 0 && t < 1) lineX = DIR[k] > 0 ? t : 1 - t;
      if (k < 2) {
        const h = span(p, SCAN[k + 1][0], SCAN[k + 1][1]);
        if (h > 0) {
          const x = DIR[k + 1] > 0 ? h : 1 - h;
          if (h < 1) lineX = x;
          if (DIR[k + 1] > 0) L = Math.max(L, x); else R = Math.max(R, 1 - x);
          if (h >= 1) { L = 1; R = 0; }
        }
      }
      const clip = `inset(0 ${(R * 100).toFixed(2)}% 0 ${(L * 100).toFixed(2)}%)`;
      if (imgs[k]._c !== clip) imgs[k].style.clipPath = imgs[k]._c = clip;
      nodes[k].forEach((n) => {
        const on = t > 0 && n.x >= L && n.x <= 1 - R && L < 1;
        if (on !== n.on) {
          n.on = on;
          n.el.classList.toggle('is-on', on);
          if (floor === k) legend.children[n.i]?.classList.toggle('is-on', on);
        }
      });
    }
    let fl = 0;
    for (let k = 0; k < 3; k++) if (p >= SCAN[k][0]) fl = k;
    setFloor(fl);
    const shownX = lineX == null ? (p < SCAN[0][0] ? 0 : p > SCAN[2][1] ? 1 : DIR[fl] > 0 ? 1 : 0) : lineX;
    const key = `${shownX.toFixed(4)}|${lineX == null ? 0 : 1}`;
    if (key !== last) {
      last = key;
      scan.style.opacity = lineX == null ? 0 : 1;
      scan.style.transform = `translate3d(${(shownX * W).toFixed(1)}px,0,0)`;
      if (mobile()) box.style.transform = `translate3d(${(vw / 2 - shownX * W).toFixed(1)}px,0,0)`;
    }
  }

  ScrollTrigger.create({ trigger: pinEl, start: 'top top', end: () => `+=${PIN * innerHeight}`, pin: true, anticipatePin: 1 });
  const range = ScrollTrigger.create({
    trigger: section,
    start: 'top 40%',
    end: () => `+=${(PRE + PIN) * innerHeight}`,
    onUpdate: (s) => draw(reduced ? 0.4 : s.progress),
    onRefresh: (s) => { measure(); draw(reduced ? 0.4 : s.progress); },
  });
  tabs.forEach((t, k) => t.addEventListener('click', () => {
    if (reduced) { draw([0.2, 0.55, 1][k]); return; }
    app.scrollTo(range.start + (range.end - range.start) * Math.min(SCAN[k][1] + 0.012, 1));
  }));
  addEventListener('resize', measure);
  measure();

  revealOnce(section.querySelector('.boat__head'), { reduced, start: 'top 82%', ScrollTrigger });

  const fmt = (v, dec) => v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: false });
  section.querySelectorAll('.spec').forEach((s, i) => {
    const dd = s.querySelector('dd');
    if (!dd.dataset.count) {
      if (reduced) s.classList.add('is-in');
      else ScrollTrigger.create({ trigger: s, start: 'top 88%', once: true, onEnter: () => gsap.delayedCall(i * 0.07, () => s.classList.add('is-in')) });
      return;
    }
    const to = +dd.dataset.count, from = +(dd.dataset.from || 0), dec = +(dd.dataset.dec || 0), suf = dd.dataset.suf || '';
    if (reduced) { s.classList.add('is-in'); return; }
    dd.textContent = fmt(from, dec) + suf;
    ScrollTrigger.create({
      trigger: s, start: 'top 88%', once: true,
      onEnter: () => {
        gsap.delayedCall(i * 0.07, () => s.classList.add('is-in'));
        const o = { v: from };
        gsap.to(o, { v: to, duration: 1.4, delay: i * 0.07, ease: 'proa.out', onUpdate: () => (dd.textContent = fmt(o.v, dec) + suf) });
      },
    });
  });
}
