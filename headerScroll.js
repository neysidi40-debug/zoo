/* ============================================================
   ZOO — Header compacto
   ============================================================
   No topo da página a nav fica aberta, unida ao grid da hero.
   No primeiro scroll ela encolhe até virar uma bolinha no canto
   superior esquerdo só com o coala; clicar na bolinha volta ao topo.
   Voltando ao topo, ela abre de novo.

   Vale nos dois tamanhos; muda só a medida final da bolinha. No mobile
   o hambúrguer não se recolhe junto: ele mora fora do <header> no HTML
   e fica parado no canto, senão o menu ficaria inalcançável depois do
   primeiro scroll.

   Por que a animação é feita em JS e não com CSS transition:
   animar width/height/border-radius junto com overflow:hidden via
   `transition` faz o Chrome/Edge/Safari trocarem de camada no meio
   da animação e piscar um frame. Aqui cada frame calcula o valor
   final (com easing) e aplica direto no style — sem transition do
   navegador rodando por baixo, sem flash. Mesma técnica do
   Headerscroll.js do Lidera360.
   ============================================================ */

(() => {
  const header = document.querySelector('header');
  const wrap = header && header.querySelector('.wrap.nav');
  const bubble = header && header.querySelector('.nav-bubble');
  if (!header || !wrap || !bubble) return;

  const fading = ['.logo', '.nav-links', '.nav-cta']
    .map(sel => header.querySelector(sel))
    .filter(Boolean);

  const TRIGGER  = 10;   // px de scroll pra compactar ("primeiro scroll")
  const DURATION = 350;  // ms
  /* diâmetro, topo e esquerda finais da bolinha. No desktop batem com a
     bolinha de tema (64px). No mobile os 16px são o mesmo recuo que a
     bolinha de tema usa lá embaixo: os três controles flutuantes ficam
     todos à mesma distância da borda da tela. */
  const GEOM = {
    desktop: { size: 64, top: 16, left: 20 },
    mobile:  { size: 56, top: 16, left: 16 }
  };
  // cores da bolinha vêm do CSS (--float-bg-rgb / --float-line-rgb),
  // pra acompanharem o tema claro/escuro
  const cssVar = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  const desktop = window.matchMedia('(min-width: 861px)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let ratio = 0;   // 0 = nav aberta, 1 = bolinha
  let target = 0;
  let from = 0;
  let startTs = null;
  let rafId = null;

  // medidas da nav aberta — só remede com ela aberta, senão mediria a bolinha
  let fullHeight = header.offsetHeight;
  let padLeft = parseFloat(getComputedStyle(wrap).paddingLeft) || 0;
  let padRight = parseFloat(getComputedStyle(wrap).paddingRight) || 0;
  const measure = () => {
    if (ratio > 0) return;
    fullHeight = header.offsetHeight;
    padLeft = parseFloat(getComputedStyle(wrap).paddingLeft) || 0;
    padRight = parseFloat(getComputedStyle(wrap).paddingRight) || 0;
  };

  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

  const HEADER_PROPS = ['width', 'height', 'left', 'right', 'top', 'borderRadius', 'background', 'border', 'backdropFilter', 'transition'];
  const WRAP_PROPS = ['overflow', 'height', 'paddingLeft', 'paddingRight'];

  function applyFrame(r){
    if (r <= 0.001){
      // nav aberta: limpa tudo e devolve o controle pro CSS normal
      HEADER_PROPS.forEach(p => header.style[p] = '');
      WRAP_PROPS.forEach(p => wrap.style[p] = '');
      fading.forEach(el => el.style.opacity = '');
      bubble.classList.remove('is-visible');
      header.classList.remove('is-compact');
      return;
    }

    const fullWidth = document.documentElement.clientWidth;
    const compact = r >= 0.995;
    const { size: SIZE, top: TOP, left: LEFT } = desktop.matches ? GEOM.desktop : GEOM.mobile;

    header.style.right = 'auto';
    header.style.width = `${lerp(fullWidth, SIZE, r)}px`;
    header.style.height = `${lerp(fullHeight, SIZE, r)}px`;
    header.style.left = `${lerp(0, LEFT, r)}px`;
    header.style.top = `${lerp(0, TOP, r)}px`;
    header.style.borderRadius = `${lerp(0, SIZE / 2, r)}px`;
    header.style.background = `rgba(${cssVar('--float-bg-rgb')},${lerp(0, 0.94, r)})`;
    header.style.border = `1px solid rgba(${cssVar('--float-line-rgb')},${r})`;
    header.style.backdropFilter = compact ? 'blur(10px)' : 'none';
    // durante o morph nenhuma transition do CSS pode rodar; parada, só o hover
    header.style.transition = compact ? 'transform 0.25s ease, box-shadow 0.25s ease' : 'none';

    wrap.style.overflow = 'hidden';
    wrap.style.height = '100%';
    wrap.style.paddingLeft = `${lerp(padLeft, 0, r)}px`;
    wrap.style.paddingRight = `${lerp(padRight, 0, r)}px`;

    fading.forEach(el => el.style.opacity = `${1 - r}`);
    bubble.classList.toggle('is-visible', r > 0.55);
    header.classList.toggle('is-compact', compact);
  }

  function step(ts){
    if (startTs === null) startTs = ts;
    const t = Math.min((ts - startTs) / DURATION, 1);
    ratio = lerp(from, target, easeOutCubic(t));
    applyFrame(ratio);
    if (t < 1){
      rafId = requestAnimationFrame(step);
    } else {
      ratio = target;
      applyFrame(ratio);
      rafId = null;
    }
  }

  function animateTo(to, instant){
    if (to === target && !instant) return;
    target = to;
    if (instant || reduceMotion.matches){
      if (rafId !== null){ cancelAnimationFrame(rafId); rafId = null; }
      ratio = to;
      applyFrame(ratio);
      return;
    }
    from = ratio;
    startTs = null;
    if (rafId === null) rafId = requestAnimationFrame(step);
  }

  const wanted = () => window.scrollY > TRIGGER ? 1 : 0;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { animateTo(wanted()); ticking = false; });
  }, { passive: true });

  window.addEventListener('resize', () => {
    measure();
    if (ratio > 0 && ratio < 1) return; // no meio do morph o próximo frame já corrige
    applyFrame(ratio);
  }, { passive: true });

  // trocou de faixa de tamanho: pula direto pro estado certo, com a medida nova
  desktop.addEventListener('change', () => { measure(); applyFrame(ratio); animateTo(wanted(), true); });

  bubble.addEventListener('click', () => {
    window.scrollTo({ top: 0 }); // o html já tem scroll-behavior: smooth
  });

  // trocou o tema com a bolinha fechada: reaplica pra pegar as cores novas
  new MutationObserver(() => applyFrame(ratio))
    .observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  // estado inicial sem animação (ex: recarregou a página já rolada)
  animateTo(wanted(), true);
})();
