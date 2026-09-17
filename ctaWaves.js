/* ============================================================
   ZOO — Fundo de ondas de formas da faixa final
   ============================================================
   Adaptado do ShapeWaves (vercel.com/labs) pras cores do Zoo.

   O original é um componente React que roda em WebGPU com a
   biblioteca vgpu. Aqui não dá: o site é HTML/CSS/JS puro e o
   WebGPU ainda não funciona em boa parte dos navegadores. Então o
   efeito foi refeito em canvas 2D, sem biblioteca, mantendo as
   três ideias que dão a cara dele:

   1) Uma grade de formas (triângulo, círculo e quadrado). Qual
      forma aparece em cada célula vem de um ruído que se desloca
      devagar — é isso que faz as "ondas" atravessarem a faixa.
   2) O mouse joga ondas na grade: cada movimento levanta as
      células por perto e a onda se espalha e vai sumindo, como
      água. Onde a onda passa, a forma muda e clareia.
   3) Tudo desenhado em poucas chamadas: as formas são agrupadas
      por tipo e por tom, então cada quadro pinta ~12 caminhos em
      vez de milhares.

   Pausa fora da tela e com "reduzir movimento" desenha um quadro
   parado, sem onda nenhuma.
   ============================================================ */

(() => {
  const canvas = document.getElementById('ctaWaves');
  const host = canvas && canvas.parentElement;
  if (!canvas || !host) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── ajustes do visual ──
  const CELL = 15;             // lado da célula, em px de tela
  const DOT = 0.6;             // tamanho da forma dentro da célula (0 a 1)
  const NOISE_SCALE = 7;       // células por "onda" do ruído (maior = ondas largas)
  const NOISE_SPEED = 0.05;    // quanto o ruído anda por segundo
  const TONES = 4;             // níveis de tom entre a cor base e a de destaque
  // Tons dentro da própria família do laranja. Antes as formas eram pretas
  // ([14,13,12]) e a camada escura por cima da faixa inteira dava a impressão
  // de que o fundo tinha ficado mais escuro — o fundo sempre foi var(--orange).
  const BASE = [199, 62, 10];      // --orange-deep: as formas em repouso
  const HIGHLIGHT = [122, 36, 4];  // laranja bem fechado: rastro onde a onda passa
  const BASE_ALPHA = 0.16;
  const HIGHLIGHT_ALPHA = 0.6;

  // ── ondas do mouse ──
  const SPLASH_RADIUS = 46;    // px
  const SPLASH_STRENGTH = 0.5;
  const WAVE_SPEED = 0.42;
  const WAVE_FRICTION = 0.94;
  const WAVE_DECAY = 0.972;
  const SETTLED = 0.01;
  const STEP = 1 / 60;

  let dpr = 1;
  let width = 0, height = 0;
  let cols = 0, rows = 0, cellPx = CELL, originY = 0;
  let charges, heights, prevHeights;
  let chargesActive = false;
  let backlog = 0;
  let time = 0;
  let lastTs = 0;
  let rafId = null;
  let visible = true;

  // cores pré-montadas: uma por nível de tom
  const tones = Array.from({ length: TONES }, (_, i) => {
    const t = TONES === 1 ? 0 : i / (TONES - 1);
    const mix = (a, b) => Math.round(a + (b - a) * t);
    const alpha = BASE_ALPHA + (HIGHLIGHT_ALPHA - BASE_ALPHA) * t;
    return `rgba(${mix(BASE[0], HIGHLIGHT[0])},${mix(BASE[1], HIGHLIGHT[1])},${mix(BASE[2], HIGHLIGHT[2])},${alpha.toFixed(3)})`;
  });

  /* ── ruído ──
     Ruído de valor com interpolação suave, somando duas oitavas
     (fbm). Barato o suficiente pra rodar por célula a cada quadro. */
  const hash = (x, y) => {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const smooth = t => t * t * (3 - 2 * t);
  const noise2 = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = smooth(xf), v = smooth(yf);
    const top = hash(xi, yi) * (1 - u) + hash(xi + 1, yi) * u;
    const bottom = hash(xi, yi + 1) * (1 - u) + hash(xi + 1, yi + 1) * u;
    return top * (1 - v) + bottom * v;
  };
  const fbm = (x, y) => noise2(x, y) * 0.65 + noise2(x * 2, y * 2) * 0.35;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = host.clientWidth;
    height = host.clientHeight;
    if (!width || !height) return;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cols = Math.max(1, Math.round(width / CELL));
    cellPx = width / cols;
    rows = Math.max(1, Math.floor(height / cellPx));
    originY = (height - rows * cellPx) / 2;

    const total = cols * rows;
    charges = new Float32Array(total);
    heights = new Float32Array(total);
    prevHeights = new Float32Array(total);
    chargesActive = false;
  };

  /* ── onda: cada movimento do mouse levanta as células por perto ── */
  const splash = (x, y, strength) => {
    const sigma = Math.max(0.5, (SPLASH_RADIUS / cellPx) * 0.5);
    const reach = Math.ceil(sigma * 2.5);
    const cx = (x - 0) / cellPx - 0.5;
    const cy = (y - originY) / cellPx - 0.5;
    const minRow = Math.max(0, Math.floor(cy - reach));
    const maxRow = Math.min(rows - 1, Math.ceil(cy + reach));
    const minCol = Math.max(0, Math.floor(cx - reach));
    const maxCol = Math.min(cols - 1, Math.ceil(cx + reach));
    for (let row = minRow; row <= maxRow; row++){
      const dy = row - cy;
      for (let col = minCol; col <= maxCol; col++){
        const dx = col - cx;
        const bump = strength * Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
        const i = row * cols + col;
        heights[i] = Math.min(1.2, heights[i] + bump);
      }
    }
    chargesActive = true;
  };

  // equação de onda simples: cada célula é puxada pela média das vizinhas
  const stepWave = () => {
    const lastCol = cols - 1, lastRow = rows - 1;
    let peak = 0;
    for (let row = 0; row < rows; row++){
      const base = row * cols;
      const up = (row === 0 ? row : row - 1) * cols;
      const down = (row === lastRow ? row : row + 1) * cols;
      for (let col = 0; col < cols; col++){
        const i = base + col;
        const left = base + (col === 0 ? col : col - 1);
        const right = base + (col === lastCol ? col : col + 1);
        const h = heights[i];
        const laplacian = heights[left] + heights[right] + heights[up + col] + heights[down + col] - 4 * h;
        const velocity = (h - prevHeights[i]) * WAVE_FRICTION;
        const next = (h + velocity + WAVE_SPEED * laplacian) * WAVE_DECAY;
        prevHeights[i] = next;
        const charge = next < 0 ? 0 : (next > 1 ? 1 : next);
        charges[i] = charge;
        if (charge > peak) peak = charge;
      }
    }
    const swap = heights;
    heights = prevHeights;
    prevHeights = swap;
    return peak;
  };

  const updateWaves = delta => {
    if (!chargesActive) return false;
    backlog = Math.min(backlog + delta, STEP * 4);
    let peak = 1;
    while (backlog >= STEP){
      backlog -= STEP;
      peak = stepWave();
    }
    if (peak < SETTLED){
      heights.fill(0);
      prevHeights.fill(0);
      charges.fill(0);
      chargesActive = false;
    }
    return chargesActive;
  };

  /* ── desenho ──
     As formas são agrupadas por tipo e tom: 3 tipos × 4 tons = 12
     caminhos por quadro, em vez de um fill por célula. */
  const draw = () => {
    if (!cols || !rows) return;
    ctx.clearRect(0, 0, width, height);

    const half = cellPx * 0.5;
    const size = half * DOT;
    const paths = [];
    for (let i = 0; i < 3 * TONES; i++) paths.push(new Path2D());

    for (let row = 0; row < rows; row++){
      const cy = originY + (row + 0.5) * cellPx;
      for (let col = 0; col < cols; col++){
        const cx = (col + 0.5) * cellPx;
        const tone = fbm(col / NOISE_SCALE + time, row / NOISE_SCALE - time * 0.35);
        const band = Math.min(2, Math.floor(tone * 3));
        const charge = charges ? charges[row * cols + col] : 0;
        const shape = (band + Math.floor(charge * 3)) % 3;
        const level = Math.min(TONES - 1, Math.floor(charge * TONES));
        const path = paths[shape * TONES + level];

        if (shape === 0){            // quadrado
          path.rect(cx - size, cy - size, size * 2, size * 2);
        } else if (shape === 1){     // círculo
          path.moveTo(cx + size, cy);
          path.arc(cx, cy, size, 0, Math.PI * 2);
        } else {                     // triângulo
          path.moveTo(cx, cy - size);
          path.lineTo(cx + size, cy + size);
          path.lineTo(cx - size, cy + size);
          path.closePath();
        }
      }
    }

    for (let shape = 0; shape < 3; shape++){
      for (let level = 0; level < TONES; level++){
        ctx.fillStyle = tones[level];
        ctx.fill(paths[shape * TONES + level]);
      }
    }
  };

  const render = ts => {
    rafId = null;
    const delta = lastTs ? Math.min(0.1, (ts - lastTs) / 1000) : 0;
    lastTs = ts;

    const animating = visible && !document.hidden && !reduceMotion;
    if (animating) time += delta * NOISE_SPEED;
    const waving = visible && !document.hidden && updateWaves(delta);
    draw();

    if (animating || waving) rafId = requestAnimationFrame(render);
    else lastTs = 0;
  };

  const wake = () => {
    if (rafId === null) rafId = requestAnimationFrame(render);
  };

  // ── mouse: cada movimento dentro da faixa vira onda ──
  let bounds = null;
  let pointerAt = 0, pointerX = 0, pointerY = 0, pointerInside = false;
  const invalidate = () => { bounds = null; };

  window.addEventListener('pointermove', e => {
    if (reduceMotion || !cols) return;
    if (!bounds) bounds = host.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;
    const inside = x >= 0 && y >= 0 && x <= bounds.width && y <= bounds.height;
    const now = performance.now();
    if (inside){
      const elapsed = pointerInside ? Math.max(8, now - pointerAt) : 16;
      const travelled = pointerInside ? Math.hypot(x - pointerX, y - pointerY) : 0;
      const speed = (travelled / elapsed) * 1000;
      splash(x, y, Math.min(1, 0.22 + speed * 0.0006) * SPLASH_STRENGTH);
      wake();
    }
    pointerX = x; pointerY = y; pointerAt = now; pointerInside = inside;
  }, { passive: true });

  window.addEventListener('scroll', invalidate, { passive: true, capture: true });
  window.addEventListener('resize', () => { invalidate(); resize(); draw(); wake(); }, { passive: true });
  document.addEventListener('visibilitychange', wake);

  if ('ResizeObserver' in window){
    new ResizeObserver(() => { resize(); draw(); wake(); }).observe(host);
  }
  if ('IntersectionObserver' in window){
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
    }, { threshold: 0 }).observe(host);
  }

  resize();
  draw();
  if (!reduceMotion) wake();
})();
