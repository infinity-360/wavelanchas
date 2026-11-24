// Tipografia em movimento da Proa.
//
// Títulos `.duo` = palavra em script (`.s`) + frase em serifa (`.r`):
// - a script aparece como tinta de pena, da esquerda para a direita: uma máscara em degradê (borda macia de 20%)
//   corre por cima dela. A caixa da script tem folga de ~0,35em em volta (padding + margem negativa), então o
//   traço de entrada e as hastes nunca encostam na borda da máscara;
// - a serifa sobe palavra por palavra, cada palavra na própria máscara (`clip-path` com folga para acento e
//   descendente). A saída é o inverso, rápida: a script "desescreve" do fim para o começo e as palavras sobem.
// Parágrafos com `data-lines`: linhas (SplitText) sobem na própria máscara.
// Elementos com `data-fade`: sobem 12 px e acendem.
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { T } from './ease.js';

gsap.registerPlugin(SplitText);

function splitWords(r) {
  if (r.dataset.split) return;
  r.dataset.split = '1';
  const words = r.textContent.trim().split(/\s+/);
  r.textContent = '';
  words.forEach((w, i) => {
    const o = document.createElement('span');
    o.className = 'w';
    const n = document.createElement('span');
    n.className = 'wi';
    n.textContent = w;
    o.appendChild(n);
    r.appendChild(o);
    if (i < words.length - 1) r.appendChild(document.createTextNode(' '));
  });
}

const lines = (el) => el.querySelectorAll('.pl');

// prepara um bloco de texto (título, parágrafos, rótulos) e devolve { in, out, show, hide }
export function textItem(root, { reduced = false } = {}) {
  const titles = [...root.querySelectorAll('.duo')].concat(root.matches('.duo') ? [root] : []);
  titles.forEach((t) => t.querySelectorAll('.r').forEach(splitWords));
  const paras = [...root.querySelectorAll('[data-lines]')].concat(root.matches('[data-lines]') ? [root] : []);
  paras.forEach((p) => {
    // autoSplit refaz as linhas quando a largura muda; onSplit devolve às linhas novas o estado do bloco
    if (!p._split) p._split = SplitText.create(p, { type: 'lines', mask: 'lines', linesClass: 'pl', autoSplit: true, aria: 'auto', onSplit: (self) => { gsap.set(self.lines, { yPercent: p._shown ? 0 : 110 }); } });
  });
  const fades = [...root.querySelectorAll('[data-fade]')];
  const scripts = titles.flatMap((t) => [...t.querySelectorAll('.s')]);
  const words = () => titles.flatMap((t) => [...t.querySelectorAll('.wi')]);
  const allLines = () => paras.flatMap((p) => [...lines(p)]);
  let tl;
  const mark = (v) => paras.forEach((p) => (p._shown = v));

  function hide() {
    mark(false);
    tl?.kill();
    gsap.set(scripts, { '--m': 100 });
    gsap.set(words(), { yPercent: 135 });
    gsap.set(allLines(), { yPercent: 110 });
    gsap.set(fades, { autoAlpha: 0, y: 12 });
    gsap.set(root, { autoAlpha: 0 });
  }
  function show() {
    mark(true);
    tl?.kill();
    gsap.set(scripts, { '--m': 0 });
    gsap.set(words(), { yPercent: 0 });
    gsap.set(allLines(), { yPercent: 0 });
    gsap.set(fades, { autoAlpha: 1, y: 0 });
    gsap.set(root, { autoAlpha: 1 });
  }

  function enter({ delay = 0 } = {}) {
    mark(true);
    tl?.kill();
    gsap.set(root, { autoAlpha: 1 });
    if (reduced) {
      show();
      return (tl = gsap.timeline({ delay }).fromTo(root, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }));
    }
    const w = words();
    const ls = allLines();
    tl = gsap.timeline({ delay });
    if (scripts.length) tl.fromTo(scripts, { '--m': 100 }, { '--m': 0, duration: T.write, ease: 'proa.write', stagger: 0.12 }, 0);
    // a serifa começa quando a pena já passou da metade da script
    if (w.length) tl.fromTo(w, { yPercent: 135 }, { yPercent: 0, duration: T.in, ease: 'proa.out', stagger: Math.min(0.06, 0.32 / w.length) }, scripts.length ? 0.22 : 0);
    if (ls.length) tl.fromTo(ls, { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'proa.out', stagger: 0.07 }, titles.length ? 0.38 : 0);
    if (fades.length) tl.fromTo(fades, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'proa.out', stagger: 0.06 }, titles.length ? 0.45 : 0.1);
    return tl;
  }

  function leave() {
    mark(false);
    tl?.kill();
    if (reduced) return (tl = gsap.timeline().to(root, { autoAlpha: 0, duration: 0.25 }));
    tl = gsap.timeline({ onComplete: () => gsap.set(root, { autoAlpha: 0 }) });
    if (scripts.length) tl.to(scripts, { '--m': 100, duration: 0.42, ease: 'proa.in' }, 0);
    const w = words();
    if (w.length) tl.to(w, { yPercent: -135, duration: T.out, ease: 'proa.in', stagger: 0.018 }, 0);
    const ls = allLines();
    if (ls.length) tl.to(ls, { yPercent: -110, duration: 0.34, ease: 'proa.in', stagger: 0.02 }, 0);
    if (fades.length) tl.to(fades, { autoAlpha: 0, y: -8, duration: 0.3, ease: 'proa.in' }, 0);
    return tl;
  }

  return { root, in: enter, out: leave, show, hide };
}

// título de seção que entra uma vez quando chega na tela
export function revealOnce(el, { reduced, start = 'top 82%', ScrollTrigger }) {
  const item = textItem(el, { reduced });
  item.hide();
  gsap.set(el, { autoAlpha: 1 });
  ScrollTrigger.create({ trigger: el, start, once: true, onEnter: () => item.in() });
  return item;
}
