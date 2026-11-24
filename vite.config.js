import { defineConfig } from 'vite';

// No GitHub Pages o site fica em /wavelanchas/; o workflow passa BASE. Localmente fica na raiz.
export default defineConfig({
  base: process.env.BASE || '/',
});
