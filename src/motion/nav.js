import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function nav({ app, dia }) {
  const el = document.querySelector('.nav');
  const links = [...el.querySelectorAll('[data-sec]')];
  const line = 48;

  document.querySelectorAll('[data-nav]').forEach((sec) => {
    const on = () => {
      el.classList.toggle('is-dark', sec.dataset.nav === 'dark');
      links.forEach((a) => a.classList.toggle('is-current', a.dataset.sec === sec.id));
    };
    ScrollTrigger.create({ trigger: sec, start: `top ${line}px`, end: `bottom ${line}px`, onEnter: on, onEnterBack: on });
  });

  let lastY = scrollY;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      const past = y > dia.st.end;
      const dir = app.lenis ? app.lenis.direction : Math.sign(y - lastY);
      lastY = y;
      el.classList.toggle('is-veil', past);
      if (!past) el.classList.remove('is-hidden');
      else if (dir > 0) el.classList.add('is-hidden');
      else if (dir < 0) el.classList.remove('is-hidden');
    },
  });
}
