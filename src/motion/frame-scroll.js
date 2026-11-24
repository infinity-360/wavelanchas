// Vídeo no scroll por frames, versão com vários clipes cortados (adaptada de tools/frames-lab/frame-scroll.js).
//
//   const film = frameFilm({ canvas, clips: ['/frames/07h', '/frames/11h', ...], step, blurCopies })
//   film.render({ clip, t, blur, dir, zoom })   // clip = índice, t = 0..1 dentro do clipe
//   film.firstFrame  // Promise: 1º quadro do 1º clipe desenhável
//   film.progress(k) // 0..1 do clipe k já baixado (para o loader)
//   film.ready       // Promise: todos os clipes baixados
//
// Diferenças do módulo comum:
// - Não cria o pin: quem chama (day.js) cria o ScrollTrigger antes do Lenis e chama render() no onUpdate.
// - Vários clipes: baixa o 1º em ordem grossa → fina (1º quadro, último, a cada 8, 4, 2, 1), depois os outros na ordem.
// - Entre dois quadros vizinhos desenha os dois com mistura (o conjunto normal tem 12 fps e o scrub fica liso).
// - Corte com borrão de movimento: o mesmo quadro desenhado N vezes deslocado, com pesos iguais (média),
//   na direção do corte. Funciona em qualquer navegador (o ctx.filter não existe no Safari).
// - Sem o quadro exato, desenha o carregado mais próximo; o scrub nunca trava.
// - Canvas em "cover", devicePixelRatio limitado a 2 (1,5 no celular).

export function frameFilm({ canvas, clips, step = 1, concurrency = 6, blurCopies = 10 }) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const films = clips.map((base) => ({ base, manifest: null, count: 0, images: [], loaded: 0, wanted: 0 }));
  let last = null;
  let key = '';

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, innerWidth < 760 ? 1.5 : 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    key = '';
    if (last) render(last);
  }

  function nearest(f, i) {
    for (let d = 0; d < f.count; d++) {
      if (f.images[i - d]) return i - d;
      if (f.images[i + d]) return i + d;
    }
    return -1;
  }

  function cover(img, zoom, dx, dy, alpha) {
    const { width: cw, height: ch } = canvas;
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight) * zoom;
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, (cw - w) / 2 + dx, (ch - h) / 2 + dy, w, h);
  }

  function render(state) {
    last = state;
    const { clip = 0, t = 0, blur = 0, dir = 'x', zoom = 1 } = state;
    const f = films[clip];
    if (!f || !f.count) return false;
    const pos = Math.min(1, Math.max(0, t)) * (f.count - 1);
    const i0 = Math.floor(pos);
    const a = pos - i0;
    const k = `${clip}|${pos.toFixed(3)}|${blur.toFixed(3)}|${dir}|${zoom.toFixed(4)}|${f.loaded}`;
    if (k === key) return true;
    const n0 = f.images[i0] ? i0 : nearest(f, i0);
    if (n0 < 0) return false;
    key = k;
    const img0 = f.images[n0];

    if (blur > 0.002) {
      // borrão de movimento: média de N cópias espalhadas ao longo da direção do corte (pesos 1/(j+1) = média)
      const spread = blur * canvas.width * 0.075;
      const N = blurCopies;
      for (let j = 0; j < N; j++) {
        const o = (j / (N - 1) - 0.5) * spread;
        cover(img0, zoom, dir === 'x' ? o : 0, dir === 'y' ? o : 0, 1 / (j + 1));
      }
    } else {
      cover(img0, zoom, 0, 0, 1);
      const i1 = Math.min(f.count - 1, i0 + 1);
      if (n0 === i0 && a > 0.02 && i1 !== i0 && f.images[i1]) cover(f.images[i1], zoom, 0, 0, a);
    }
    ctx.globalAlpha = 1;
    return true;
  }

  const load = (f, i) => new Promise((resolve) => {
    const img = new Image();
    img.src = `${f.base}/${String(i + 1).padStart(4, '0')}.${f.manifest.ext}`;
    img.decode().then(() => { f.images[i] = img; f.loaded++; }, () => {}).finally(resolve);
  });

  function orderOf(f) {
    const idx = [];
    for (let i = 0; i < f.manifest.count; i += step) idx.push(i);
    if (idx[idx.length - 1] !== f.manifest.count - 1) idx.push(f.manifest.count - 1);
    f.wanted = idx.length;
    const out = [], seen = new Set();
    const push = (i) => { if (!seen.has(i)) { seen.add(i); out.push(i); } };
    push(idx[0]);
    push(idx[idx.length - 1]);
    for (let s = 8; s >= 1; s /= 2) for (let j = 0; j < idx.length; j += s) push(idx[j]);
    return out;
  }

  async function loadFilm(f, first) {
    f.manifest = await fetch(`${f.base}/manifest.json`).then((r) => r.json());
    f.count = f.manifest.count;
    f.images = new Array(f.count);
    const order = orderOf(f);
    if (first) { await load(f, order.shift()); first(); }
    await Promise.all(Array.from({ length: concurrency }, async () => {
      for (let i; (i = order.shift()) !== undefined; ) {
        await load(f, i);
        if (last && films[last.clip] === f) { key = ''; render(last); }
      }
    }));
  }

  let firstResolve;
  const firstFrame = new Promise((r) => (firstResolve = r));
  const ready = (async () => {
    // 1º clipe inteiro antes dos outros (é o hero); manifests dos outros já no começo
    await loadFilm(films[0], () => { resize(); firstResolve(); });
    for (const f of films.slice(1)) await loadFilm(f);
  })();

  addEventListener('resize', resize);
  resize();

  return {
    render,
    firstFrame,
    ready,
    progress: (k) => (films[k].wanted ? films[k].loaded / films[k].wanted : 0),
    films,
  };
}
