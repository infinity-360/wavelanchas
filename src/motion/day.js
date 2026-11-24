// 01 Hero + 02 O dia: quatro planos do mesmo dia no barco, presos ao scroll, e o fecho na escotilha.
//
// Roteiro em telas de scroll (1 tela = 100vh). O pin tem PIN telas; tudo abaixo é posição dentro dele.
//
//   0,00–0,25  hero parado no 1º quadro das 7h                 hero visível até 0,32
//   0,25–2,05  07h: vista de cima, a câmera sobe               "às 7h, café na proa…"      0,50–1,75
//   2,05–2,35  corte 1 (borrão horizontal, relógio gira 07:45 → 11:00)
//   2,35–3,95  11h: Lagoa Azul, gente pulando da popa          "às 11h, a Lagoa Azul…"     2,45–3,70
//   3,95–4,25  corte 2 (horizontal, 11:45 → 18:00)
//   4,25–5,85  18h: pôr do sol de popa                         "às 18h, o sol atrás…"      4,35–5,60
//   5,85–6,15  corte 3 (vertical, 18:45 → 22:00)
//   6,15–7,45  22h: ancorado à noite, órbita lenta             "às 22h, luz debaixo…"      6,25–7,30
//   7,45–8,00  fecho: a cena encolhe para a escotilha, o anel de 24 h volta e o arco desenha 7h → 22h,
//              o relógio sai do canto e pousa embaixo da escotilha (22:00)
//   7,80–      legenda "quinze horas a bordo"
//   8,15       o pin solta: a escotilha, o relógio e a legenda sobem com a seção enquanto o barco entra
//              por baixo (sem tela vazia entre as duas)
//
// O vídeo segue o scroll do Lenis direto (sem segunda suavização). Os textos não são scrubados: cada um tem uma
// janela e entra/sai em tempo (type.js) quando o scroll cruza a borda dela, nos dois sentidos.
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { frameFilm } from './frame-scroll.js';
import { reels } from './reels.js';
import { textItem } from './type.js';
import { ease, lerp, span } from './ease.js';

export const HD = new URLSearchParams(location.search).has('hd');
const CLIPS = ['07h', '11h', '18h', '22h'];
const HOURS = [10, 13, 17, 22]; // Wave: diárias das 10h às 18h; 22h = Réveillon no mar

export const PIN = 8.15;
const CLIP = [[0.25, 2.05], [2.35, 3.95], [4.25, 5.85], [6.15, 7.45]];
const CUT = [[2.05, 2.35], [3.95, 4.25], [5.85, 6.15]];
const DIRS = ['x', 'x', 'y'];
const TEXT = [[0, 0.32], [0.4, 1.75], [2.45, 3.7], [4.35, 5.6], [6.25, 7.3]]; // hero + 4 horas
const HUD_END = 7.45; // barra de progresso cheia
const TICKS = [0, (CUT[0][0] + CUT[0][1]) / 2, (CUT[1][0] + CUT[1][1]) / 2, (CUT[2][0] + CUT[2][1]) / 2];
const O = { ring: [7.5, 7.9], shrink: [7.45, 8.0], arc: [7.55, 8.05], fly: [7.5, 8.0], caption: 7.8 };
const MIN = 45; // minutos que o relógio anda dentro de cada plano (o das 22h fica parado)
const smooth = (x) => x * x * (3 - 2 * x);

// posição no pin (telas) → { clip, t, blur, dir, zoom }
function stateAt(s) {
  if (s < CLIP[0][0]) return { clip: 0, t: 0, blur: 0, dir: 'x', zoom: 1 };
  for (let k = 0; k < 3; k++) {
    const [a, b] = CUT[k];
    if (s >= a && s < b) {
      const x = (s - a) / (b - a);
      const out = x < 0.5;
      const blur = smooth(out ? x * 2 : (1 - x) * 2);
      return { clip: out ? k : k + 1, t: out ? 1 : 0, blur, dir: DIRS[k], zoom: 1 + blur * 0.05 };
    }
  }
  let k = 3;
  while (k > 0 && s < CLIP[k][0]) k--;
  return { clip: k, t: span(s, CLIP[k][0], CLIP[k][1]), blur: 0, dir: 'x', zoom: 1 };
}

// posição → [minutos do dia, girando?]
function minutesAt(s) {
  if (s < CLIP[0][0]) return [HOURS[0] * 60, false];
  for (let k = 0; k < 3; k++) {
    const [a, b] = CUT[k];
    if (s >= a && s < b) {
      const from = HOURS[k] * 60 + MIN, to = HOURS[k + 1] * 60;
      return [from + (to - from) * smooth((s - a) / (b - a)), true];
    }
  }
  let k = 3;
  while (k > 0 && s < CLIP[k][0]) k--;
  if (k === 3) return [HOURS[3] * 60, false];
  return [HOURS[k] * 60 + MIN * span(s, CLIP[k][0], CLIP[k][1]), false];
}

function windowAt(s) {
  for (let i = 0; i < TEXT.length; i++) if (s >= TEXT[i][0] && s < TEXT[i][1]) return i;
  return -1;
}

export function day({ section, reduced }) {
  const stage = section.querySelector('.day__stage');
  const canvas = section.querySelector('.day__canvas');
  const still = section.querySelector('.day__still');
  const shade = section.querySelector('.day__shade');
  const hud = section.querySelector('.hud');
  const track = hud.querySelector('.hud__track');
  const fill = hud.querySelector('.hud__fill');
  const tickEls = [...hud.querySelectorAll('.hud__ticks li')];
  const hint = hud.querySelector('.hud__hint');
  const clockEl = hud.querySelector('.hud__clock');
  const clock = reels(clockEl);
  const mobile = innerWidth < 760;

  const items = [section.querySelector('.hero'), ...section.querySelectorAll('.hour')].map((el) => textItem(el, { reduced }));
  const wheres = [...section.querySelectorAll('.where li')].map((el) => textItem(el, { reduced }));
  const caption = textItem(section.querySelector('.day__caption'), { reduced });
  [...items, ...wheres, caption].forEach((it) => it.hide());
  tickEls.forEach((li, k) => li.style.setProperty('--x', `${(TICKS[k] / HUD_END) * 100}%`));

  // ---- escotilha: anel de 24 marcas (0h embaixo, 12h em cima, sentido horário), o mesmo da abertura
  const port = section.querySelector('.port');
  const arc = port.querySelector('.port__arc');
  const ticksG = port.querySelector('.port__ticks');
  const NS = 'http://www.w3.org/2000/svg';
  const tickLines = [];
  for (let h = 0; h < 24; h++) {
    const a = (h / 24) * Math.PI * 2;
    const r1 = 128, r2 = h % 6 === 0 ? 114 : 120;
    const l = document.createElementNS(NS, 'line');
    l.setAttribute('x1', (150 - Math.sin(a) * r1).toFixed(2)); l.setAttribute('y1', (150 + Math.cos(a) * r1).toFixed(2));
    l.setAttribute('x2', (150 - Math.sin(a) * r2).toFixed(2)); l.setAttribute('y2', (150 + Math.cos(a) * r2).toFixed(2));
    if (h % 6 === 0) l.classList.add('big');
    ticksG.appendChild(l);
    tickLines.push(l);
    if (h % 6 === 0) {
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', (150 - Math.sin(a) * 101).toFixed(2)); t.setAttribute('y', (150 + Math.cos(a) * 101).toFixed(2));
      t.textContent = String(h).padStart(2, '0');
      ticksG.appendChild(t);
    }
  }
  const C = 2 * Math.PI * 140;
  let lastArc = '';
  // arco de h0 a h1 (horas), marcas acesas no trecho
  function portArc(h0, h1) {
    const k = `${h0.toFixed(3)}|${h1.toFixed(3)}`;
    if (k === lastArc) return;
    lastArc = k;
    arc.style.strokeDasharray = `${(Math.max(0, h1 - h0) / 24) * C} ${C}`;
    arc.style.strokeDashoffset = `${(-h0 / 24) * C}`;
    tickLines.forEach((l, h) => l.classList.toggle('is-on', h >= h0 - 0.01 && h <= h1 + 0.01));
  }
  let lastPort = '';
  function portSet({ alpha = 1, scale = 1, rotate = 0 }) {
    const k = `${alpha.toFixed(3)}|${scale.toFixed(4)}|${rotate.toFixed(2)}`;
    if (k === lastPort) return;
    lastPort = k;
    port.style.opacity = alpha.toFixed(3);
    port.style.scale = scale.toFixed(4);
    port.style.rotate = `${rotate.toFixed(2)}deg`;
  }
  // raio da janela em px (r=90 no svg de 300) e raio que cobre a tela
  let geo;
  function measure() {
    const pr = port.offsetWidth; // tamanho de layout (o anel pode estar girado ou em escala)
    clockEl.style.transform = '';
    const c = clockEl.getBoundingClientRect();
    geo = {
      portR: pr * (90 / 300), // janela por dentro dos números do anel (r=101) e das marcas (114–128)
      cover: Math.hypot(innerWidth, innerHeight) / 2 + 4,
      // do canto até embaixo da escotilha
      dx: innerWidth / 2 - (c.left + c.width / 2),
      dy: innerHeight / 2 + pr / 2 + (mobile ? 30 : 40) - (c.top + c.height / 2),
    };
    clockFly(lastFly.f, lastFly.a, true);
  }
  const lastFly = { f: 0, a: 1 };
  let lastFlyKey = '';
  function clockFly(f, a = 1, force = false) {
    lastFly.f = f; lastFly.a = a;
    if (!geo) return;
    const k = `${f.toFixed(4)}|${a.toFixed(3)}`;
    if (k === lastFlyKey && !force) return;
    lastFlyKey = k;
    clockEl.style.transform = f ? `translate3d(${(geo.dx * f).toFixed(1)}px, ${(geo.dy * f).toFixed(1)}px, 0) scale(${(1 + 0.55 * f).toFixed(4)})` : '';
    clockEl.style.opacity = a.toFixed(3);
  }
  let clipOwner = 'scroll'; // a abertura toma conta do recorte da cena até terminar
  // r = raio visível em px; o recorte é aplicado antes da escala da cena, então divide por ela
  let lastClip = '';
  function stageClip(r, sc) {
    const k = `${r == null ? '-' : r.toFixed(1)}|${sc == null ? '-' : sc.toFixed(4)}`;
    if (k === lastClip) return;
    lastClip = k;
    stage.style.clipPath = r == null ? '' : `circle(${(r / (sc || 1)).toFixed(1)}px at 50% 50%)`;
    stage.style.transform = sc == null || sc === 1 ? '' : `scale(${sc.toFixed(4)})`;
  }

  // ---- vídeo
  const base = `${import.meta.env.BASE_URL}${HD ? 'frames-hd/' : 'frames/'}`;
  // celular: metade dos quadros (memória), borrão mais barato e menos downloads ao mesmo tempo (o main thread
  // decodifica enquanto a pessoa rola); ?hd: todos os quadros a 24 fps em Full HD
  const film = frameFilm({ canvas, clips: CLIPS.map((c) => base + c), step: mobile && !HD ? 2 : 1, blurCopies: mobile ? 6 : 10, concurrency: mobile ? 3 : 6 });
  film.firstFrame.then(() => { still.style.opacity = 0; update(cur); });

  // ---- textos por janela
  let started = false;
  let active = -1;
  function setActive(i) {
    if (i === active) return;
    const prev = active;
    active = i;
    if (prev >= 0) { items[prev].out(); if (prev > 0) wheres[prev - 1].out(); }
    if (i >= 0) {
      const delay = prev >= 0 ? 0.12 : 0;
      items[i].in({ delay });
      if (i > 0) wheres[i - 1].in({ delay: delay + 0.2 });
    }
    hint.classList.toggle('is-off', i !== 0);
  }
  let capOn = false;

  let cur = 0;
  let lastHud = '';
  let lastShade = -1;
  function update(s) {
    cur = s;
    const st = stateAt(s);
    if (reduced) { st.blur = 0; st.zoom = 1; }
    film.render(st);
    const hk = `${span(s, 0, HUD_END).toFixed(4)}|${(1 - span(s, 7.3, 7.5)).toFixed(3)}`;
    if (hk !== lastHud) {
      lastHud = hk;
      fill.style.transform = `scaleX(${span(s, 0, HUD_END).toFixed(4)})`;
      track.style.setProperty('--o', (1 - span(s, 7.3, 7.5)).toFixed(3));
      tickEls.forEach((li, k) => li.classList.toggle('is-on', s >= TICKS[k]));
    }
    if (!started) return;
    const [m, spin] = minutesAt(s);
    clock.set(m, spin);
    setActive(windowAt(s));

    // fecho na escotilha
    if (clipOwner !== 'scroll') return;
    const q1 = ease.inOut(span(s, O.shrink[0], O.shrink[1]));
    if (q1 <= 0) {
      stageClip(null, null);
      if (lastShade !== 1) shade.style.opacity = lastShade = 1;
      portSet({ alpha: 0 });
      clockFly(0, 1);
    } else {
      stageClip(lerp(geo.cover, geo.portR, q1), 1 + 0.14 * q1);
      if (lastShade !== 1 - q1) shade.style.opacity = lastShade = 1 - q1;
      portSet({ alpha: span(s, O.ring[0], O.ring[1]), scale: lerp(1.18, 1, q1), rotate: -24 * (1 - q1) });
      portArc(HOURS[0], lerp(HOURS[0], 22,ease.out(span(s, O.arc[0], O.arc[1]))));
      clockFly(ease.inOut(span(s, O.fly[0], O.fly[1])), 1);
    }
    const capWant = s >= O.caption;
    if (capWant !== capOn) { capOn = capWant; capWant ? caption.in() : caption.out(); }
  }

  const st = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: () => `+=${PIN * innerHeight}`,
    pin: true,
    onUpdate: (self) => update(self.progress * PIN),
    onRefresh: (self) => { measure(); update(self.progress * PIN); },
  });
  addEventListener('resize', measure);
  measure();
  update(0);

  return {
    film,
    st,
    startHour: HOURS[0],
    ready: film.ready,
    // fração do 1º clipe já baixada (a abertura conta 00:00 → 07:00 por ela)
    loadProgress: () => film.progress(0),
    clock,
    clockFly,
    portSet,
    portArc,
    stageClip,
    geo: () => geo,
    measure,
    hud: { track, hint },
    // a abertura segura o recorte da cena, o anel e o relógio até terminar (release)
    takeClip: () => (clipOwner = 'intro'),
    release() {
      clipOwner = 'scroll';
      update(cur);
    },
    // a abertura chama no meio da escotilha abrindo: a partir daqui o scroll manda nos textos e no relógio
    start() {
      started = true;
      update(cur);
    },
    // posição de scroll do texto k (0 = hero, 1..4 = horas)
    jumpTo: (k) => st.start + (TEXT[k][0] + (k ? 0.25 : 0)) * innerHeight,
  };
}
