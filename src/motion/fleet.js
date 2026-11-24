// Frota da Wave, como aparece no Instagram (@wavelanchas). `info` só traz o que o perfil confirma.
// Fotos: capas dos próprios posts da Wave (public/img/ig). Sem foto no perfil, a linha mostra o logo.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { revealOnce } from './type.js';

export const WHATSAPP = '5548998253179';
export const FLEET = [
  { name: 'Technema 60', feet: 60, info: 'A gigante do catálogo · até 20 pessoas', img: 'technema-60' },
  { name: 'Tecnomarine 50', feet: 50, info: 'Até 20 pessoas · Starlink · churrasqueira', img: 'tecnomarine-50' },
  { name: 'Carbrasmar 50', feet: 50, info: 'Disponível para locação', img: 'carbrasmar-50' },
  { name: 'Carbrasmar 41', feet: 41, info: 'Disponível para locação', img: 'carbrasmar-41' },
  { name: 'Carbrasmar 40', feet: 40, info: 'Até 15 pessoas', img: 'carbrasmar-40' },
  { name: 'Porto Fino 40', feet: 40, info: 'Disponível para locação', img: 'porto-fino-40' },
  { name: 'Carbrasmar 39', feet: 39, info: '15 a 18 pessoas · o som mais top do Caixa d’Aço', img: 'carbrasmar-39' },
  { name: 'Oceanic 36', feet: 36, info: 'Lancha impecável', img: 'oceanic-36' },
  { name: 'Cobra Capri 32', feet: 32, info: 'Disponível para locação' },
  { name: 'Phantom 29', feet: 29, info: 'Disponível para locação' },
  { name: 'Triton', feet: null, info: 'Até 9 pessoas' },
];
const BASE = import.meta.env.BASE_URL;
const src = (b) => `${BASE}img/ig/${b.img || 'logo'}.jpg`;

export function fleet({ reduced }) {
  const root = document.querySelector('.fleet');
  const list = root.querySelector('.fleet__list');
  list.innerHTML = FLEET.map((b, i) => {
    const text = encodeURIComponent(`Olá, Wave Lanchas! Quero consultar datas e valores da ${b.name}.`);
    return `<li><a href="https://wa.me/${WHATSAPP}?text=${text}" target="_blank" rel="noopener" data-i="${i}"><img class="fleet__thumb${b.img ? '' : ' is-logo'}" src="${src(b)}" alt="" loading="lazy" width="600" height="1066"><span class="fleet__name">${b.name}</span><span class="fleet__feet">${b.feet ? `${b.feet} pés` : ''}</span><span class="fleet__info">${b.info}</span><span class="fleet__go">Consultar<i aria-hidden="true">→</i></span></a></li>`;
  }).join('');
  revealOnce(root.querySelector('.fleet__head'), { reduced, start: 'top 84%', ScrollTrigger });

  // prévia que segue o mouse (só com ponteiro fino)
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const peek = document.createElement('div');
    peek.className = 'fleet__peek';
    peek.innerHTML = '<img alt="">';
    root.appendChild(peek);
    const img = peek.firstChild;
    const px = gsap.quickTo(peek, 'x', { duration: 0.6, ease: 'proa.out' });
    const py = gsap.quickTo(peek, 'y', { duration: 0.6, ease: 'proa.out' });
    let shown = false;
    list.addEventListener('pointermove', (e) => {
      const a = e.target.closest('a[data-i]');
      if (!a) return;
      const b = FLEET[+a.dataset.i];
      const want = src(b);
      if (img.getAttribute('src') !== want) { img.src = want; img.alt = b.name; peek.classList.toggle('is-logo', !b.img); }
      px(e.clientX + 28); py(e.clientY - 150);
      if (!shown) { shown = true; gsap.set(peek, { x: e.clientX + 28, y: e.clientY - 150 }); gsap.to(peek, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'proa.out' }); }
    });
    list.addEventListener('pointerleave', () => { shown = false; gsap.to(peek, { autoAlpha: 0, scale: 0.92, duration: 0.3, ease: 'proa.in' }); });
  }

  if (!reduced) {
    [...list.children].forEach((li) => {
      gsap.from(li, { autoAlpha: 0, y: 18, duration: 0.9, ease: 'proa.out', scrollTrigger: { trigger: li, start: 'top 94%', once: true } });
    });
  }

  // faixa "a bordo": as fotos andam de lado junto com o scroll
  const strip = document.querySelector('.aboard__strip');
  if (!strip) return;
  revealOnce(document.querySelector('.aboard__head'), { reduced, start: 'top 84%', ScrollTrigger });
  if (reduced) return;
  gsap.fromTo(strip, { x: () => innerWidth * 0.12 }, {
    x: () => Math.min(0, innerWidth - strip.scrollWidth - innerWidth * 0.06),
    ease: 'none',
    scrollTrigger: { trigger: '.aboard', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
  });
}
