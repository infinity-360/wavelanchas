// Abertura da Proa: a escotilha.
//
// Fundo abismo; no centro, o anel de 24 marcas (relógio de bordo, 0h embaixo) e, por dentro dele, a água do
// primeiro plano. O relógio embaixo do anel corre de 00:00 a 07:00 enquanto o 1º clipe baixa: a hora acompanha
// o download, nunca passa dele e leva no mínimo 1,4 s; o arco turquesa enche de 0h a 7h junto.
// Às 07:00, sem pausa, a escotilha abre até cobrir a tela (1,35 s, proa.inOut), a imagem assenta de 1,3× para 1×,
// o anel cresce e some, o relógio voa para o canto (vira o relógio do scroll) e o título do hero entra no meio do
// movimento. O mesmo anel e o mesmo relógio voltam no fecho do dia (day.js).
// ?hd: segura às 07:00 até os quatro conjuntos Full HD baixarem, sem limite de tempo.
import { gsap } from 'gsap';

const MIN_TIME = 1.4; // segundos mínimos da contagem
const MAX_WAIT = 6; // em conexão lenta, abre mesmo sem o 1º clipe inteiro (o canvas usa o quadro mais próximo)

export function intro({ dia, hold, onReveal, lenis, reduced }) {
  const root = document.documentElement;
  const el = document.querySelector('.intro');
  if (reduced || !root.classList.contains('intro-on')) {
    root.classList.remove('intro-on');
    root.classList.add('intro-done');
    el?.remove();
    dia.start();
    onReveal?.(true);
    return;
  }
  lenis?.stop();
  scrollTo(0, 0);
  dia.takeClip();

  const word = el.querySelector('.intro__word');
  const coord = el.querySelector('.intro__coord');
  word.innerHTML = [...word.textContent].map((c) => `<span>${c}</span>`).join('');

  const clip = { r: 0, s: 1.3 };
  const applyClip = () => dia.stageClip(clip.r, clip.s);
  const ring = { a: 0, s: 0.9, r: -30 };
  const applyRing = () => dia.portSet({ alpha: ring.a, scale: ring.s, rotate: ring.r });
  const fly = { f: 1, a: 0 };
  const applyFly = () => dia.clockFly(fly.f, fly.a);
  applyClip();
  applyRing();
  applyFly();
  dia.portArc(0, 0);
  dia.clock.set(0, true);
  dia.clock.el.classList.add('is-ticking');

  gsap.timeline({ defaults: { ease: 'proa.out' } })
    .to(ring, { a: 1, s: 1, r: 0, duration: 1.4, onUpdate: applyRing }, 0)
    .to(fly, { a: 1, duration: 0.8, onUpdate: applyFly }, 0.35)
    .from(word.children, { yPercent: 110, duration: 1, stagger: 0.06 }, 0.2)
    .from(coord, { autoAlpha: 0, y: 8, duration: 0.9 }, 0.5);
  dia.film.firstFrame.then(() => gsap.to(clip, { r: dia.geo().portR, duration: 1.1, ease: 'proa.out', onUpdate: applyClip }));

  // contagem: o relógio mostra min(tempo, download)
  const count = { t: 0 };
  gsap.to(count, { t: 1, duration: MIN_TIME, ease: 'sine.inOut', delay: 0.3 });
  const bootAt = performance.now();
  let shown = 0;
  let done = false;
  let holdOk = !hold;
  hold?.then(() => (holdOk = true));

  const tick = () => {
    const late = !hold && performance.now() - bootAt > MAX_WAIT * 1000;
    const target = Math.min(count.t, late ? 1 : dia.loadProgress());
    shown += (target - shown) * 0.14;
    if (target >= 1 && shown > 0.985) shown = 1; // o fim da aproximação é invisível no relógio: abre já
    const H = dia.startHour || 7;
    dia.clock.set(shown * H * 60, true);
    dia.portArc(0, shown * H);
    if (shown === 1 && holdOk && !done) { done = true; gsap.ticker.remove(tick); reveal(); }
  };
  gsap.ticker.add(tick);

  function reveal() {
    const g = dia.geo();
    const ringPx = (g.portR * 300) / 90;
    gsap.timeline({
      onComplete: () => {
        root.classList.remove('intro-on');
        root.classList.add('intro-done');
        el.remove();
        dia.release();
        lenis?.start();
      },
    })
      .to(clip, { r: g.cover, s: 1, duration: 1.35, ease: 'proa.inOut', onUpdate: applyClip }, 0)
      .to(ring, { s: ((g.cover * 2) / ringPx) * 1.06, a: 0, r: 18, duration: 1.35, ease: 'proa.inOut', onUpdate: applyRing }, 0)
      .to(word.children, { yPercent: -110, duration: 0.45, stagger: 0.03, ease: 'proa.in' }, 0)
      .to(coord, { autoAlpha: 0, duration: 0.3, ease: 'proa.in' }, 0)
      .to(fly, { f: 0, duration: 1.25, ease: 'proa.inOut', onUpdate: applyFly }, 0.08)
      .add(() => {
        dia.clock.el.classList.remove('is-ticking');
        root.classList.add('intro-reveal');
        dia.start();
        onReveal?.(false);
      }, 0.5);
  }
}
