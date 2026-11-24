// Reserva (fundo e título) e rodapé (nome subindo da linha d'água).
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { revealOnce } from './type.js';

export function reveals({ reduced }) {
  const book = document.querySelector('.book');
  const foot = document.querySelector('.foot');
  const word = foot.querySelector('.foot__word');
  const text = word.textContent;
  word.innerHTML = [...text].map((c) => `<span aria-hidden="true">${c}</span>`).join('');

  revealOnce(book.querySelector('.book__copy'), { reduced, start: 'top 78%', ScrollTrigger });
  if (reduced) return;

  gsap.fromTo(book.querySelector('.book__bg'), { scale: 1.14 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: book, start: 'top bottom', end: 'bottom bottom', scrub: true } });
  gsap.fromTo(word.children, { yPercent: 104 }, { yPercent: 0, ease: 'none', stagger: 0.12, scrollTrigger: { trigger: foot, start: 'top 45%', end: 'bottom bottom', scrub: true } });
  gsap.from([foot.querySelector('.foot__time'), foot.querySelector('.foot__night')], { yPercent: 18, autoAlpha: 0, duration: 1, ease: 'proa.out', stagger: 0.12, scrollTrigger: { trigger: foot, start: 'top 62%', once: true } });
}
