// Reserva: calendário do mês seguinte + formulário. Sem back-end: o envio monta a mensagem e abre o WhatsApp da Wave.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FLEET, WHATSAPP } from './fleet.js';

const TAKEN = []; // dias já fretados: a Wave preenche quando tiver a agenda
const MAX_PEOPLE = 20;

export function book({ reduced }) {
  const section = document.querySelector('.book');
  const panel = section.querySelector('.panel');
  const title = section.querySelector('.cal__title');
  const days = section.querySelector('.cal__days');
  const form = section.querySelector('.form');
  const dateOut = form.elements.data;
  const peopleOut = form.elements.pessoas;
  const msg = section.querySelector('.form__msg');

  form.elements.lancha.innerHTML = ['Quero uma sugestão', ...FLEET.map((b) => b.name)].map((n) => `<option>${n}</option>`).join('');

  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const total = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const offset = first.getDay();
  title.textContent = first.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(' de ', ' ');

  for (let i = 0; i < offset; i++) days.appendChild(document.createElement('span'));
  const buttons = [];
  for (let d = 1; d <= total; d++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cal__day';
    b.innerHTML = `<span>${d}</span>`;
    b.dataset.d = d;
    if (TAKEN.includes(d)) { b.disabled = true; b.classList.add('is-taken'); b.setAttribute('aria-label', `${d}, já reservado`); }
    days.appendChild(b);
    buttons.push(b);
  }
  let chosen = null;
  const pick = (b) => {
    chosen?.classList.remove('is-on');
    chosen?.removeAttribute('aria-pressed');
    chosen = b;
    b.classList.add('is-on');
    b.setAttribute('aria-pressed', 'true');
    dateOut.value = `${String(b.dataset.d).padStart(2, '0')}/${String(first.getMonth() + 1).padStart(2, '0')}`;
    msg.textContent = '';
  };
  buttons.forEach((b) => b.addEventListener('click', () => pick(b)));
  pick(buttons.find((b) => !b.disabled));

  let people = 6;
  form.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => {
    people = Math.min(MAX_PEOPLE, Math.max(1, people + +b.dataset.d));
    peopleOut.value = people;
  }));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = form.elements.nome.value.trim();
    if (!nome) { msg.textContent = 'Falta o seu nome.'; form.elements.nome.focus(); return; }
    const text = `Olá, Wave Lanchas! Sou ${nome}. Quero consultar uma lancha para ${dateOut.value}, ${people} ${people > 1 ? 'pessoas' : 'pessoa'}, destino ${form.elements.roteiro.value}. Lancha: ${form.elements.lancha.value}.`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    msg.textContent = `Pedido pronto, ${nome.split(' ')[0]}. É só enviar no WhatsApp.`;
  });

  if (reduced) { gsap.set(panel, { clipPath: 'inset(0% 0 0 0)' }); return; }
  gsap.set(buttons, { autoAlpha: 0 });
  ScrollTrigger.create({
    trigger: panel, start: 'top 82%', once: true,
    onEnter: () => {
      gsap.to(panel, { clipPath: 'inset(0% 0 0 0)', duration: 1.2, ease: 'proa.inOut' });
      buttons.forEach((b) => {
        const i = +b.dataset.d - 1 + offset;
        gsap.to(b, { autoAlpha: 1, duration: 0.5, ease: 'proa.out', delay: 0.55 + ((i % 7) + Math.floor(i / 7)) * 0.045 });
      });
    },
  });
}
