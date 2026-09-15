/* ============================================================
   ZOO — Estúdio de Sites
   Arquivo de comportamento (interatividade do site)
   ============================================================
   Este arquivo cuida de três coisas simples:

   1) Menu mobile: abre e fecha o menu quando o botão de três
      tracinhos (hambúrguer) é clicado, e fecha sozinho quando
      algum link do menu é clicado.

   2) Destaque do menu ao rolar a página: enquanto o visitante
      rola o site, o link correspondente à seção visível na tela
      (Serviços, Processo, Projetos, Contato) fica destacado no
      menu do topo, pra dar noção de "onde estou" na página.

   3) Animação de entrada ao rolar a página: qualquer elemento
      com a classe "reveal" no HTML aparece com um leve movimento
      de baixo pra cima assim que entra na tela. Pra adicionar
      esse efeito em um elemento novo, basta colocar class="reveal"
      nele no index.html — não precisa mexer neste arquivo.

   Não há coleta de dados nem envio de formulário aqui — é só
   comportamento visual, roda inteiramente no navegador do visitante.
   ============================================================ */

  // Mobile menu toggle
  const menuToggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');
  menuToggle.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    menuToggle.classList.toggle('open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
  });
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      menuToggle.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Abrir menu');
    });
  });

  // Highlight active section link while scrolling
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  if ('IntersectionObserver' in window && sections.length){
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          navLinks.forEach(l => l.style.color = '');
          const active = document.querySelector('.nav-links a[href="#' + entry.target.id + '"]');
          if (active) active.style.color = 'var(--paper)';
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(sec => observer.observe(sec));
  }

  // Seleção de texto estilo marca-texto (adaptado do Lidera360).
  // A ::selection nativa fica transparente (html.ink-selection no CSS) e
  // este bloco desenha, por cima, um traço laranja em cada linha
  // selecionada: espera um instante depois de soltar o mouse e aí o traço
  // corre da esquerda pra direita (scaleX 0 → 1), linha por linha.
  // Lê a seleção REAL do navegador, então Ctrl+C continua normal.
  // Com "reduzir movimento" nada disso liga e fica a seleção laranja comum.
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    const PAINT_DELAY = 40;     // atraso proposital antes do traço aparecer
    const STROKE_STAGGER = 25;  // atraso entre linhas quando a seleção quebra

    document.documentElement.classList.add('ink-selection');

    // O traço fica POR CIMA do texto, então precisa se misturar com a
    // página em vez de cobrir as letras:
    //  · fundo escuro (quase o site todo): "screen" só clareia — o fundo
    //    vira laranja e as letras claras continuam claras
    //  · fundo laranja (.cta-final): "screen" deixaria o texto preto
    //    laranja e ele sumiria; lá usa "multiply" com um tom escuro, que
    //    escurece o fundo e mantém o texto preto
    // O blend precisa estar na CAMADA (ela é fixed + z-index, isola os
    // filhos), por isso são duas camadas, uma por modo.
    // Ficam acima do conteúdo e abaixo do header (z-index 100).
    const makeLayer = (blend, ink) => {
      const layer = document.createElement('div');
      layer.setAttribute('aria-hidden', 'true');
      layer.style.cssText = `position:fixed; inset:0; pointer-events:none; z-index:50; mix-blend-mode:${blend};`;
      document.body.appendChild(layer);
      return { layer, ink };
    };
    const onDark = makeLayer('screen', 'rgba(255,122,26,0.75)');
    const onOrange = makeLayer('multiply', 'rgba(14,13,12,0.3)');
    // tema claro (creme): texto escuro em fundo claro — "multiply" com
    // laranja pinta o fundo e mantém as letras escuras (mesma camada)
    const onCream = { layer: onOrange.layer, ink: 'rgba(255,122,26,0.5)' };
    const LIGHT_BG = '.cta-final';

    let strokes = [];
    let paintTimer = null;
    let pointerDown = false;

    const clearStrokes = () => {
      strokes.forEach(s => s.remove());
      strokes = [];
    };

    // getClientRects devolve também a caixa inteira dos elementos que a
    // seleção atravessa (um <p> todo, um card...) — descarta qualquer
    // retângulo que contenha outro, pra sobrar só as linhas de texto
    const lineRects = range => {
      const rects = Array.from(range.getClientRects())
        .filter(r => r.width > 2 && r.height > 2)
        .slice(0, 300);
      return rects.filter((r, i) => !rects.some((o, j) => j !== i &&
        o.left >= r.left - 1 && o.right <= r.right + 1 &&
        o.top >= r.top - 1 && o.bottom <= r.bottom + 1 &&
        (o.width < r.width - 1 || o.height < r.height - 1)));
    };

    const paintSelection = (animate = true) => {
      clearStrokes();
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;

      lineRects(sel.getRangeAt(0)).forEach((r, i) => {
        // descobre o fundo embaixo da linha (as camadas ignoram o ponteiro,
        // então elementFromPoint devolve o conteúdo de verdade)
        const under = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        const lightTheme = document.documentElement.classList.contains('theme-light');
        const target = under && under.closest(LIGHT_BG) ? onOrange : (lightTheme ? onCream : onDark);
        const stroke = document.createElement('span');
        stroke.style.cssText = `
          position:fixed;
          left:${r.left}px; top:${r.top}px;
          width:${r.width}px; height:${r.height}px;
          background:${target.ink};
          border-radius:2px;
          transform-origin:left center;
          transform:scaleX(${animate ? 0 : 1});
          transition:${animate ? 'transform 0.3s cubic-bezier(.16,1,.3,1)' : 'none'};
          transition-delay:${i * STROKE_STAGGER}ms;
        `;
        target.layer.appendChild(stroke);
        strokes.push(stroke);
      });

      // espera um frame pra o navegador registrar o scaleX(0) antes de animar
      if (animate) requestAnimationFrame(() => strokes.forEach(s => { s.style.transform = 'scaleX(1)'; }));
    };

    const schedulePaint = () => {
      clearTimeout(paintTimer);
      paintTimer = setTimeout(paintSelection, PAINT_DELAY);
    };

    // mouse: pinta ao soltar o botão (durante o arraste não desenha nada)
    document.addEventListener('pointerdown', () => { pointerDown = true; });
    document.addEventListener('pointerup', () => { pointerDown = false; schedulePaint(); });

    // teclado (Shift+setas, Ctrl+A) e alças de seleção do celular não
    // passam pelo pointerup — pegam a mudança de seleção direto
    document.addEventListener('selectionchange', () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed){
        clearTimeout(paintTimer);
        clearStrokes();
        return;
      }
      if (!pointerDown) schedulePaint();
    });

    // os traços usam coordenadas da tela: ao rolar/redimensionar,
    // redesenha na posição nova, sem animar de novo
    let repaintQueued = false;
    const repaint = () => {
      if (repaintQueued || !strokes.length) return;
      repaintQueued = true;
      requestAnimationFrame(() => { repaintQueued = false; paintSelection(false); });
    };
    window.addEventListener('scroll', repaint, { passive: true, capture: true });
    window.addEventListener('resize', repaint);
  }

  // Fundo "aurora" da hero — versão em WebGL puro do componente Aurora
  // (React Bits), com as cores laranja do Zoo. Só anima enquanto a hero
  // está visível; com "reduzir movimento" ligado, desenha um quadro parado.
  const auroraCanvas = document.getElementById('heroAurora');
  const gl = auroraCanvas && auroraCanvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true });
  if (gl){
    const AURORA = {
      colorStops: ['#C73E0A', '#FF7A1A', '#FF5A1F'],
      blend: 0.5,
      amplitude: 1.0,
      speed: 0.5
    };

    const vert = `#version 300 es
      in vec2 position;
      void main(){ gl_Position = vec4(position, 0.0, 1.0); }`;

    const frag = `#version 300 es
      precision highp float;
      uniform float uTime;
      uniform float uAmplitude;
      uniform vec3 uColorStops[3];
      uniform vec2 uResolution;
      uniform float uBlend;
      out vec4 fragColor;

      vec3 permute(vec3 x){ return mod(((x * 34.0) + 1.0) * x, 289.0); }

      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
        m = m * m;
        m = m * m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      vec3 colorRamp(float f){
        if (f < 0.5) return mix(uColorStops[0], uColorStops[1], f / 0.5);
        return mix(uColorStops[1], uColorStops[2], (f - 0.5) / 0.5);
      }

      void main(){
        vec2 uv = gl_FragCoord.xy / uResolution;
        vec3 rampColor = colorRamp(uv.x);

        float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
        height = exp(height);
        height = (uv.y * 2.0 - height + 0.2);
        float intensity = 0.6 * height;

        float midPoint = 0.20;
        float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
        vec3 auroraColor = intensity * rampColor;

        fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
      }`;

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vert));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(program);

    if (gl.getProgramParameter(program, gl.LINK_STATUS)){
      gl.useProgram(program);

      // triângulo que cobre a tela inteira
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const posLoc = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      const hexToRgb = hex => {
        const n = parseInt(hex.replace('#', ''), 16);
        return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
      };
      const u = name => gl.getUniformLocation(program, name);
      gl.uniform3fv(u('uColorStops'), new Float32Array(AURORA.colorStops.flatMap(hexToRgb)));
      gl.uniform1f(u('uAmplitude'), AURORA.amplitude);
      gl.uniform1f(u('uBlend'), AURORA.blend);
      const uTime = u('uTime');
      const uResolution = u('uResolution');

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.round(auroraCanvas.clientWidth * dpr);
        const h = Math.round(auroraCanvas.clientHeight * dpr);
        if (auroraCanvas.width !== w || auroraCanvas.height !== h){
          auroraCanvas.width = w;
          auroraCanvas.height = h;
        }
        gl.viewport(0, 0, w, h);
        gl.uniform2f(uResolution, w, h);
      };

      const draw = t => {
        resize();
        gl.uniform1f(uTime, t * 0.001 * AURORA.speed);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      };

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let rafId = null;
      const loop = t => { draw(t); rafId = requestAnimationFrame(loop); };
      const start = () => { if (rafId === null) rafId = requestAnimationFrame(loop); };
      const stop = () => { if (rafId !== null){ cancelAnimationFrame(rafId); rafId = null; } };

      if (reduceMotion){
        draw(0);
        window.addEventListener('resize', () => draw(0));
      } else if ('IntersectionObserver' in window){
        new IntersectionObserver(([entry]) => {
          entry.isIntersecting ? start() : stop();
        }).observe(auroraCanvas);
      } else {
        start();
      }
    }
  }

  // Nav transparente enquanto está sobre a hero, pra aurora passar por trás;
  // depois que a hero sai de baixo da nav, volta ao fundo escuro normal
  const siteHeader = document.querySelector('header');
  const hero = document.querySelector('.hero');
  if (siteHeader && hero){
    const updateHeader = () => {
      const overHero = hero.getBoundingClientRect().bottom > siteHeader.offsetHeight;
      siteHeader.classList.toggle('over-hero', overHero);
    };
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
    window.addEventListener('resize', updateHeader);
  }

  // Reveal elements as they scroll into view
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length){
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target); // anima uma vez só
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => revealObserver.observe(el));
  } else {
    // navegador sem suporte a IntersectionObserver: mostra tudo direto
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  // Marca-texto fixo: passa a "caneta" laranja nos <mark class="ink">.
  // O traço só entra DEPOIS que o bloco termina de surgir (pra não
  // competir com o reveal), e marcas do mesmo bloco entram em sequência.
  // Mesma técnica do Lidera360.
  // (vale também pros sublinhados .uline — mesmo gatilho, só muda o visual)
  const inkMarks = Array.from(document.querySelectorAll('mark.ink, .uline'));
  if (inkMarks.length){
    const BREATH  = 160; // respiro entre o fim do surgimento e a caneta
    const STAGGER = 150; // atraso entre marcas do mesmo bloco
    const paint = list => list.forEach(m => m.classList.add('is-inked'));
    const reduceMotionInk = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotionInk || !('IntersectionObserver' in window)){
      paint(inkMarks);
    } else {
      // quanto o bloco leva pra terminar de surgir: .reveal usa transition
      // (com o delay do .stagger), o texto da hero usa animation — lê do CSS
      const toMs = v => (parseFloat(v) || 0) * (v.trim().endsWith('ms') ? 1 : 1000);
      const settleTime = host => {
        const cs = getComputedStyle(host);
        return Math.max(
          toMs(cs.transitionDuration) + toMs(cs.transitionDelay),
          toMs(cs.animationDuration) + toMs(cs.animationDelay)
        );
      };

      // agrupa por bloco que surge, pra escalonar as marcas dentro dele
      const groups = new Map();
      inkMarks.forEach(m => {
        const host = m.closest('.reveal') || m.parentElement;
        if (!groups.has(host)) groups.set(host, []);
        groups.get(host).push(m);
      });
      groups.forEach(list => list.forEach((m, i) => { m.style.transitionDelay = (i * STAGGER) + 'ms'; }));

      // mesmo threshold/rootMargin do reveal, pra contar do mesmo instante
      const inkObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          inkObserver.unobserve(entry.target);
          const list = groups.get(entry.target);
          setTimeout(() => paint(list), settleTime(entry.target) + BREATH);
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
      groups.forEach((list, host) => inkObserver.observe(host));
    }
  }

  // Planos: pill deslizante que troca entre duas versões do mesmo plano
  // dentro do mesmo card (mesma lógica do Lidera360). A pane que entra
  // vem do lado pro qual a pill andou; a que sai vai pro lado oposto.
  // Setas ← → trocam de aba pelo teclado; a pane escondida fica "inert"
  // pra não receber foco.
  document.querySelectorAll('.plan-toggle-card').forEach(card => {
    const thumb = card.querySelector('.plan-toggle-thumb');
    const btns = Array.from(card.querySelectorAll('.plan-toggle-btn'));
    const panes = Array.from(card.querySelectorAll('.plan-toggle-pane'));
    let current = Math.max(0, btns.findIndex(b => b.classList.contains('is-active')));

    const goTo = index => {
      if (index === current || !panes[index]) return;
      const dir = index > current ? 1 : -1;
      const oldPane = panes[current];
      const newPane = panes[index];

      // posiciona a pane nova do lado certo SEM transição antes de animar,
      // senão ela "viaja" do lado errado
      newPane.style.transition = 'none';
      newPane.style.transform = `translateX(${dir * 16}px)`;
      newPane.style.opacity = '0';
      void newPane.offsetHeight; // força o navegador a aplicar o estilo acima
      newPane.style.transition = '';

      oldPane.classList.remove('is-active');
      oldPane.style.transform = `translateX(${-dir * 16}px)`;
      oldPane.style.opacity = '0';
      oldPane.inert = true;

      newPane.classList.add('is-active');
      newPane.inert = false;

      // os sublinhados/marcações da pane que entra passam a caneta de novo
      // (senão já estariam desenhados, porque rodaram com a pane escondida)
      newPane.querySelectorAll('.is-inked').forEach(m => {
        const delay = m.style.transitionDelay;
        m.style.transition = 'none';
        m.classList.remove('is-inked');
        void m.offsetWidth;
        m.style.transition = '';
        m.style.transitionDelay = delay;
        setTimeout(() => m.classList.add('is-inked'), 220);
      });
      requestAnimationFrame(() => {
        newPane.style.transform = 'translateX(0)';
        newPane.style.opacity = '1';
      });

      btns.forEach((b, i) => {
        const active = i === index;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', String(active));
        b.tabIndex = active ? 0 : -1;
      });
      thumb.style.transform = `translateX(${index * 100}%)`;
      current = index;
    };

    btns.forEach((btn, i) => {
      btn.addEventListener('click', () => goTo(i));
      btn.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const next = (current + (e.key === 'ArrowRight' ? 1 : -1) + btns.length) % btns.length;
        goTo(next);
        btns[next].focus();
      });
    });
  });

  // Números da trust-bar: sobem de 0 até o valor final enquanto entram
  // desfocados vindo de cima (inspirado no BlurText do React Bits — número
  // e sufixo entram como "palavras" separadas, 150ms entre elas).
  // O valor final já está escrito no HTML: sem JS ou com "reduzir
  // movimento", o visitante vê o número direto. Leitor de tela lê só o
  // valor final (.sr-only), sem anunciar a contagem.
  const counters = Array.from(document.querySelectorAll('.figure[data-count]'));
  const reduceMotionCount = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (counters.length && !reduceMotionCount && 'IntersectionObserver' in window){
    const COUNT_MS = 1400;   // duração da contagem
    const WORD_DELAY = 150;  // atraso entre número e sufixo
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
    const numbers = new Map();

    counters.forEach(fig => {
      const target = parseInt(fig.dataset.count, 10) || 0;
      const suffix = fig.dataset.suffix || '';

      const sr = document.createElement('span');
      sr.className = 'sr-only';
      sr.textContent = fig.textContent.trim();

      const visual = document.createElement('span');
      visual.setAttribute('aria-hidden', 'true');

      const num = document.createElement('span');
      num.className = 'count-word';
      num.textContent = '0';
      visual.appendChild(num);

      if (suffix.trim()){
        const suf = document.createElement('span');
        suf.className = 'count-word' + (suffix.startsWith(' ') ? ' is-spaced' : '');
        suf.textContent = suffix.trim();
        suf.style.animationDelay = WORD_DELAY + 'ms';
        visual.appendChild(suf);
      }

      fig.textContent = '';
      fig.append(sr, visual);
      numbers.set(fig, { target, num });
    });

    const startCount = fig => {
      const { target, num } = numbers.get(fig);
      fig.classList.add('is-counting');
      let t0 = null;
      const tick = ts => {
        if (t0 === null) t0 = ts;
        const p = Math.min((ts - t0) / COUNT_MS, 1);
        num.textContent = Math.round(target * easeOutCubic(p));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    // mesmo threshold/rootMargin do reveal; espera o delay do .stagger do
    // item pra cada número começar junto com a entrada do seu bloco
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        countObserver.unobserve(entry.target);
        const item = entry.target.closest('.trust-item') || entry.target;
        const delay = (parseFloat(getComputedStyle(item).transitionDelay) || 0) * 1000;
        setTimeout(() => startCount(entry.target), delay);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    counters.forEach(fig => countObserver.observe(fig));
  }

  // Timeline "Como o projeto anda": quando entra na tela, a linha laranja
  // corre do passo 1 ao 4 e cada marcador acende quando a linha chega nele.
  // A linha é feita de segmentos (um por passo, no CSS) — horizontais no
  // desktop, verticais no mobile — e aqui só se distribui o progresso
  // (0 → 1) entre eles pela variável --fill. Sem JS a timeline fica no
  // estado original (só o trilho cinza); com "reduzir movimento", completa.
  const timeline = document.querySelector('.process-line');
  if (timeline){
    const steps = Array.from(timeline.querySelectorAll('.step'));
    const segments = Math.max(steps.length - 1, 1);
    const TIMELINE_MS = 1100; // duração total, do 1 ao 4
    const START_DELAY = 250;  // respiro depois de entrar na tela
    const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const renderTimeline = p => {
      const pos = p * segments; // 0 = no passo 1, 3 = no passo 4
      steps.forEach((step, i) => {
        step.style.setProperty('--fill', Math.min(Math.max(pos - i, 0), 1));
        if (pos >= i) step.classList.add('is-done');
      });
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)){
      renderTimeline(1);
    } else {
      const timelineObserver = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        timelineObserver.disconnect();
        setTimeout(() => {
          let t0 = null;
          const tick = ts => {
            if (t0 === null) t0 = ts;
            const t = Math.min((ts - t0) / TIMELINE_MS, 1);
            renderTimeline(easeInOutCubic(t));
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }, START_DELAY);
      }, { threshold: 0.35 });
      timelineObserver.observe(timeline);
    }
  }