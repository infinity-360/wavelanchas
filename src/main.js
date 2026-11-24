import './motion/ease.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource/monsieur-la-doulaise/400.css';
import '@fontsource-variable/figtree/index.css';
import './styles/tokens.css';
import './styles/base.css';
import './sections/intro.css';
import './sections/nav.css';
import './sections/day.css';
import './sections/boat.css';
import './sections/routes.css';
import './sections/price.css';
import './sections/book.css';
import './sections/foot.css';
import { day, HD } from './motion/day.js';
import { intro } from './motion/intro.js';
import { textItem } from './motion/type.js';
import { boat } from './motion/boat.js';
import { fleet } from './motion/fleet.js';
import { routes } from './motion/routes.js';
import { price } from './motion/price.js';
import { book } from './motion/book.js';
import { reveals } from './motion/reveals.js';
import { tone } from './motion/tone.js';
import { nav } from './motion/nav.js';
import { cursor } from './motion/cursor.js';
import { smooth } from './motion/smooth.js';

gsap.registerPlugin(ScrollTrigger);
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

async function boot() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  await Promise.all([
    document.fonts.load('40px "Monsieur La Doulaise"'),
    document.fonts.load('40px "Instrument Serif"'),
    document.fonts.load('italic 40px "Instrument Serif"'),
    document.fonts.load('16px "Figtree Variable"'),
  ]);
  await document.fonts.ready;

  const app = { lenis: null, scrollTo(target) { if (app.lenis) app.lenis.scrollTo(target, { duration: 1.4 }); else scrollTo(0, typeof target === 'number' ? target : target.getBoundingClientRect().top + scrollY); } };

  // todos os pins antes do Lenis, na ordem da página
  const dia = day({ section: document.querySelector('.day'), reduced });
  boat({ app, reduced });
  fleet({ reduced });
  routes({ reduced });
  price({ reduced });
  book({ reduced });
  reveals({ reduced });
  tone({ reduced });
  ScrollTrigger.refresh();

  app.lenis = smooth({ reduced });
  nav({ app, dia });
  cursor();

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    if (a.closest('.nav__links') || a.matches('.btn-line, .btn-sol') || a.closest('.foot__cols') || a.closest('.fleet') || a.matches('.nav__brand')) {
      a.addEventListener('click', (e) => {
        const el = document.querySelector(a.getAttribute('href'));
        if (!el) return;
        e.preventDefault();
        app.scrollTo(a.getAttribute('href') === '#top' ? 0 : el);
      });
    }
  });

  const hold = HD ? dia.ready : null;
  intro({ dia, hold, lenis: app.lenis, reduced, onReveal: () => {} });
  void textItem;
}

boot();
