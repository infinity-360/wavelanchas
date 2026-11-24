// Curvas e tempos da Proa. Nada de power1/ease padrão: toda entrada usa estas.
//   proa.out    entrada (desacelera longo, como barco encostando)          1,0 s
//   proa.in     saída (acelera e some)                                     0,4 s
//   proa.inOut  movimento de cena (escotilha, troca de andar, rota)        1,2–1,6 s
//   proa.write  a script aparecendo da esquerda para a direita (pena)      0,9 s
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);
CustomEase.create('proa.out', 'M0,0 C0.16,1 0.3,1 1,1');
CustomEase.create('proa.in', 'M0,0 C0.7,0 0.84,0 1,1');
CustomEase.create('proa.inOut', 'M0,0 C0.76,0 0.24,1 1,1');
CustomEase.create('proa.write', 'M0,0 C0.55,0.05 0.3,1 1,1');

export const T = { in: 1, out: 0.4, scene: 1.3, write: 0.9 };

// curvas para o que é amarrado ao scroll (recebem 0..1, devolvem 0..1)
export const ease = {
  inOut: gsap.parseEase('proa.inOut'),
  out: gsap.parseEase('proa.out'),
  sine: gsap.parseEase('sine.inOut'),
};
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
// fração de v entre a e b, presa em 0..1
export const span = (v, a, b) => clamp((v - a) / (b - a));
