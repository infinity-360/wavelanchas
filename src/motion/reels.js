// Relógio de bordo em rolos (como um odômetro): cada dígito é uma coluna que gira.
// A posição dos rolos sai de um valor contínuo (minutos com fração): o rolo das unidades anda junto com o valor e
// o das dezenas só vira no último décimo, como no mecanismo de verdade (e nunca gira para trás ao passar de 9 a 0).
//
//   const clock = reels(el)            // el recebe "HH:MM"
//   clock.set(7 * 60 + 12)             // parado: o valor mostrado corre até o minuto inteiro em 0,45 s (tique)
//   clock.set(9 * 60 + 31.6, true)     // girando (corte entre planos): segue o valor contínuo na hora
import { gsap } from 'gsap';

const SEQ = {
  ht: [0, 1, 2],
  hu: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0],
  mt: [0, 1, 2, 3, 4, 5, 0],
  mu: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0],
};
const smooth = (x) => x * x * (3 - 2 * x);
const clamp = (v) => Math.min(1, Math.max(0, v));

export function reels(el) {
  const col = (k) => `<span class="reel" aria-hidden="true"><span class="reel__in" data-k="${k}">${SEQ[k].map((d) => `<i>${d}</i>`).join('')}</span></span>`;
  el.innerHTML = `${col('ht')}${col('hu')}<span class="reel__colon" aria-hidden="true">:</span>${col('mt')}${col('mu')}<span class="sr"></span>`;
  const cols = Object.fromEntries([...el.querySelectorAll('.reel__in')].map((c) => [c.dataset.k, c]));
  const label = el.querySelector('.sr');
  const state = { cur: 0 };
  let last = '';
  let target = null;
  let tween;

  function render() {
    const m = Math.max(0, state.cur);
    const mu = m % 10;
    const c1 = smooth(clamp(mu - 9)); // vira a dezena dos minutos
    const tens = Math.floor(m / 10) % 6;
    const c2 = tens === 5 ? c1 : 0; // vira a hora
    const h = Math.floor(m / 60);
    const pos = { ht: Math.floor(h / 10) + (h % 10 === 9 ? c2 : 0), hu: (h % 10) + c2, mt: tens + c1, mu };
    const k = Object.values(pos).map((v) => v.toFixed(3)).join('|');
    if (k === last) return;
    last = k;
    for (const key in pos) cols[key].style.transform = `translate3d(0, ${-pos[key]}em, 0)`;
    label.textContent = `${String(h).padStart(2, '0')}:${String(Math.floor(m) % 60).padStart(2, '0')}`;
  }

  function set(m, spin = false) {
    if (spin) {
      tween?.kill();
      target = null;
      state.cur = m;
      render();
      return;
    }
    const t = Math.round(m);
    if (t === target) return;
    target = t;
    tween?.kill();
    tween = gsap.to(state, { cur: t, duration: 0.45, ease: 'proa.out', onUpdate: render });
  }
  render();
  return { set, el, now: () => state.cur };
}
