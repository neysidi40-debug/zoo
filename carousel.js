/* ============================================================
   ZOO — Carrosséis de arrastar
   ============================================================
   Qualquer elemento com a classe .drag-scroll vira uma faixa que
   rola na horizontal quando a pessoa ARRASTA com o mouse (no celular
   o toque já rola nativo). Nada anda sozinho.

   · data-snap  → carrossel de slides ("O que a gente constrói"):
     soltou depois de puxar, vai pro próximo/anterior no sentido do
     arraste; se puxou bem pouco, volta pro slide em que estava.
     Botões com [data-carousel-prev] / [data-carousel-next] e
     aria-controls="id-da-faixa" andam um slide.

   · data-loop  → faixa infinita (letreiro da hero): anda sozinha
     devagar, como o letreiro antigo, e a pessoa pode arrastar pra
     frente/pra trás pra ver mais rápido — pausa enquanto arrasta,
     desliza com o impulso e depois retoma de onde parou. O conteúdo
     está duplicado no HTML e, ao passar da metade, a posição "dá a
     volta" sem o visitante perceber.
   ============================================================ */

(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SWIPE_MIN = 40; // px de arraste pra contar como "trocar de slide"

  document.querySelectorAll('.drag-scroll').forEach(track => {
    const snap = track.hasAttribute('data-snap');
    const loop = track.hasAttribute('data-loop');
    const slides = snap ? Array.from(track.children) : [];

    /* ── letreiro: anda sozinho, pode ser arrastado e é infinito ──
       Anda sozinho na velocidade do letreiro antigo. Arrastar pausa; ao
       soltar ele desliza com o impulso, espera um instante (RESUME_DELAY)
       e volta a andar sozinho de onde a pessoa deixou.

       Infinito: o HTML traz as palavras duas vezes, mas em tela larga uma
       cópia pode ser mais estreita que a janela — aí a rolagem batia no fim
       antes de "dar a volta" e o letreiro travava. Por isso aqui se mede a
       largura de UMA cópia (unit) e se clonam as palavras até sobrar pelo
       menos uma cópia inteira além da tela; a volta acontece a cada `unit`,
       sempre dentro do limite da rolagem. */
    const LOOP_SECONDS = 26;    // tempo pra andar uma cópia inteira
    const RESUME_DELAY = 1200;  // pausa depois de arrastar, antes de voltar a andar
    let autoPaused = false;
    let resumeTimer = null;
    const pauseAuto = () => {
      clearTimeout(resumeTimer);
      autoPaused = true;
    };
    const resumeAuto = (delay = RESUME_DELAY) => {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => { autoPaused = false; }, delay);
    };

    let unit = 0;
    const strip = loop ? track.firstElementChild : null;
    const measureLoop = () => {
      if (!strip) return;
      const items = Array.from(strip.children).filter(el => !el.hasAttribute('data-clone'));
      const perCopy = Math.floor(items.length / 2); // o HTML traz 2 cópias
      if (perCopy < 1) return;
      unit = items[perCopy].offsetLeft - items[0].offsetLeft;
      const original = items.slice(0, perCopy);
      let guard = 0;
      while (unit > 0 && track.scrollWidth - track.clientWidth < unit + 1 && guard++ < 20){
        original.forEach(el => {
          const clone = el.cloneNode(true);
          clone.setAttribute('data-clone', '');
          clone.setAttribute('aria-hidden', 'true'); // leitor de tela não repete
          strip.appendChild(clone);
        });
      }
    };

    const wrapAround = () => {
      if (!unit) return;
      if (track.scrollLeft >= unit) track.scrollLeft -= unit;
      else if (track.scrollLeft <= 0) track.scrollLeft += unit;
    };

    if (loop){
      track.addEventListener('scroll', wrapAround, { passive: true });

      let visible = true;
      if ('IntersectionObserver' in window){
        new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(track);
      }

      // a posição é guardada em número quebrado aqui, porque o navegador
      // arredonda o scrollLeft e a velocidade lenta "travaria"
      let pos = 0;
      let lastTs = null;
      const auto = ts => {
        if (autoPaused || !visible || !unit){
          pos = track.scrollLeft; // retoma de onde a pessoa deixou
        } else if (lastTs !== null){
          pos += (unit / (LOOP_SECONDS * 1000)) * Math.min(ts - lastTs, 100);
          if (pos >= unit) pos -= unit;
          track.scrollLeft = pos;
        }
        lastTs = ts;
        requestAnimationFrame(auto);
      };

      // no toque o navegador rola sozinho: pausa e retoma um pouco depois
      track.addEventListener('touchstart', pauseAuto, { passive: true });
      track.addEventListener('touchend', () => resumeAuto(1500), { passive: true });

      // mede depois das fontes (a largura das palavras depende delas) e
      // começa no meio da 1ª cópia, pra dar pra puxar pros dois lados
      const init = () => {
        measureLoop();
        pos = unit / 2;
        track.scrollLeft = pos;
        if (!reduceMotion) requestAnimationFrame(auto);
      };
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(init);
      else window.addEventListener('load', init);

      // tela maior pode precisar de mais cópias
      window.addEventListener('resize', () => { measureLoop(); wrapAround(); });
    }

    /* ── slides ── */
    const maxLeft = () => track.scrollWidth - track.clientWidth;
    const slideLeft = i => Math.min(slides[i].offsetLeft, maxLeft());
    const nearestIndex = left => {
      let best = 0;
      slides.forEach((_, i) => {
        if (Math.abs(slideLeft(i) - left) < Math.abs(slideLeft(best) - left)) best = i;
      });
      return best;
    };

    // o snap do CSS fica desligado enquanto a rolagem suave anda, pra não
    // "brigar" com ela; religa quando chega (ou por segurança, em 700ms)
    let releaseTimer = null;
    const releaseSnap = () => {
      clearTimeout(releaseTimer);
      track.classList.remove('is-dragging');
    };
    const goTo = i => {
      const target = Math.max(0, Math.min(i, slides.length - 1));
      track.scrollTo({ left: slideLeft(target), behavior: reduceMotion ? 'auto' : 'smooth' });
      clearTimeout(releaseTimer);
      releaseTimer = setTimeout(releaseSnap, 700);
    };
    track.addEventListener('scrollend', () => { if (!dragging) releaseSnap(); });

    /* ── arraste com mouse ── */
    let dragging = false;
    let startX = 0, lastX = 0, lastT = 0, velocity = 0;
    let startIndex = 0;
    let glideRaf = null;

    track.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return; // toque rola nativo
      dragging = true;
      startX = lastX = e.clientX;
      lastT = performance.now();
      velocity = 0;
      if (snap) startIndex = nearestIndex(track.scrollLeft);
      cancelAnimationFrame(glideRaf);
      clearTimeout(releaseTimer);
      pauseAuto();
      track.classList.add('is-dragging');
      track.setPointerCapture(e.pointerId);
    });

    track.addEventListener('pointermove', e => {
      if (!dragging) return;
      const now = performance.now();
      const dx = e.clientX - lastX;
      velocity = dx / Math.max(now - lastT, 1); // px por ms
      lastX = e.clientX;
      lastT = now;
      track.scrollLeft -= dx;
      if (loop) wrapAround();
    });

    const endDrag = e => {
      if (!dragging) return;
      dragging = false;

      if (snap){
        // puxou pra esquerda = avança; pra direita = volta
        const dist = e.clientX - startX;
        let target = startIndex;
        if (dist <= -SWIPE_MIN) target = startIndex + 1;
        else if (dist >= SWIPE_MIN) target = startIndex - 1;
        goTo(target); // is-dragging sai quando a rolagem suave termina
        return;
      }

      track.classList.remove('is-dragging');
      if (reduceMotion){ autoPaused = false; return; }
      // desliza com a velocidade do arraste e vai desacelerando; quando
      // para, espera um instante e o letreiro volta a andar sozinho
      let v = -velocity * 16; // px por frame
      const glide = () => {
        if (Math.abs(v) < 0.3){ resumeAuto(); return; }
        track.scrollLeft += v;
        if (loop) wrapAround();
        v *= 0.94;
        glideRaf = requestAnimationFrame(glide);
      };
      glideRaf = requestAnimationFrame(glide);
    };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);

    /* ── botões anterior / próximo ── */
    if (snap && track.id){
      const prev = document.querySelector(`[data-carousel-prev][aria-controls="${track.id}"]`);
      const next = document.querySelector(`[data-carousel-next][aria-controls="${track.id}"]`);
      const step = dir => {
        track.classList.add('is-dragging'); // desliga o snap durante a rolagem
        goTo(nearestIndex(track.scrollLeft) + dir);
      };
      if (prev) prev.addEventListener('click', () => step(-1));
      if (next) next.addEventListener('click', () => step(1));

      const updateButtons = () => {
        if (prev) prev.disabled = track.scrollLeft <= 2;
        if (next) next.disabled = track.scrollLeft >= maxLeft() - 2;
      };
      track.addEventListener('scroll', updateButtons, { passive: true });
      window.addEventListener('resize', updateButtons);
      updateButtons();
    }
  });

  /* ── carrossel de projetos: vídeo + dica das setas ──
     O vídeo do slide toca sozinho (mudo, em loop) quando o carrossel
     aparece na tela e pausa quando sai. Nesse primeiro aparecimento, depois
     da entrada do bloco (.reveal) e com o vídeo já mostrando imagem, as
     setas fazem a animação do hover UMA vez (.is-hinting no CSS).
     Com "reduzir movimento", o vídeo não toca sozinho e a dica não roda. */
  document.querySelectorAll('.work-carousel').forEach(box => {
    const videos = Array.from(box.querySelectorAll('video'));
    const REVEAL_MS = 700;   // duração da entrada do .reveal
    const HINT_MS = 900;     // quanto tempo a classe da dica fica ligada
    const VIDEO_WAIT = 1500; // não espera o vídeo pra sempre (rede lenta)
    let hinted = false;

    // junto com a dica das setas, a borda acende uma vez: um traço laranja
    // corre por ela (.is-pulsing no CSS). A classe sai quando o traço termina.
    const hint = () => {
      if (hinted || reduceMotion) return;
      hinted = true;
      box.classList.add('is-hinting', 'is-pulsing');
      setTimeout(() => box.classList.remove('is-hinting'), HINT_MS);
    };
    box.addEventListener('animationend', e => {
      if (e.animationName === 'carousel-edge-sweep') box.classList.remove('is-pulsing');
    });

    const whenVideoReady = cb => {
      const v = videos[0];
      if (!v || v.readyState >= 2) return cb();
      let done = false;
      const once = () => { if (!done){ done = true; cb(); } };
      v.addEventListener('loadeddata', once, { once: true });
      setTimeout(once, VIDEO_WAIT);
    };

    const playAll = () => videos.forEach(v => {
      // play() pode ser recusado (economia de dados etc.): fica parado no 1º quadro
      if (!reduceMotion) v.play().catch(() => {});
    });

    if (!('IntersectionObserver' in window)){
      playAll();
      return;
    }

    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting){
        playAll();
        if (!hinted) setTimeout(() => whenVideoReady(hint), REVEAL_MS);
      } else {
        videos.forEach(v => v.pause());
      }
    }, { threshold: 0.4 }).observe(box);
  });
})();

/* ============================================================
   Equipe — letreiro só no telefone
   ============================================================
   Abaixo de 560px a grade da equipe vira uma faixa que anda sozinha e
   pode ser arrastada, igual ao letreiro da hero: arrastar pausa, ao
   soltar ela desliza com o impulso e depois volta a andar de onde ficou.

   Por que não reusa o .drag-scroll[data-loop] daqui de cima: aquele se
   liga uma vez, no carregamento, e lê a quantidade de cópias do HTML.
   Este precisa montar e desmontar conforme a largura da tela — no
   desktop a mesma grade volta a ser grade, e com as cópias no ar
   apareceriam integrantes repetidos.

   O 560 tem par no style.css: os dois precisam bater.
   ============================================================ */

(() => {
  const grid = document.querySelector('.team-grid');
  const track = grid && grid.parentElement; // .team-marquee, quem rola
  if (!grid || !track) return;

  const originals = Array.from(grid.children);
  if (!originals.length) return;

  const phone = window.matchMedia('(max-width: 560px)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const COPY = originals.length;    // quantos cartões formam uma cópia
  const LOOP_SECONDS = 34;          // tempo pra andar uma cópia inteira
  const RESUME_DELAY = 1400;        // pausa depois do arraste

  let on = false;
  let unit = 0;      // largura de uma cópia, em px
  let pos = 0;       // posição em número quebrado: o scrollLeft é arredondado
  let lastTs = null; //   pelo navegador, e nessa velocidade ele travaria
  let raf = null;
  let autoPaused = false;
  let resumeTimer = null;
  let visible = true;

  const pauseAuto = () => { clearTimeout(resumeTimer); autoPaused = true; };
  const resumeAuto = (delay = RESUME_DELAY) => {
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => { autoPaused = false; }, delay);
  };

  const addCopy = () => {
    originals.forEach(el => {
      const clone = el.cloneNode(true);
      clone.setAttribute('data-clone', '');
      clone.setAttribute('aria-hidden', 'true'); // leitor de tela não repete
      grid.appendChild(clone);
    });
  };

  /* A volta acontece a cada `unit`. Uma cópia dos cinco cartões já é bem
     mais larga que um telefone, mas a medida fica guardada: se um dia a
     faixa couber inteira na tela, a rolagem bateria no fim antes de dar a
     volta e o letreiro travaria — daí o laço que acrescenta cópias. */
  const measure = () => {
    const items = grid.children;
    if (items.length <= COPY){ unit = 0; return; }
    unit = items[COPY].offsetLeft - items[0].offsetLeft;
    let guard = 0;
    while (unit > 0 && track.scrollWidth - track.clientWidth < unit + 1 && guard++ < 10){
      addCopy();
    }
  };

  const wrapAround = () => {
    if (!unit) return;
    if (track.scrollLeft >= unit) track.scrollLeft -= unit;
    else if (track.scrollLeft <= 0) track.scrollLeft += unit;
  };

  const frame = ts => {
    if (!on){ raf = null; return; }
    if (autoPaused || !visible || !unit){
      pos = track.scrollLeft; // retoma de onde a pessoa deixou
    } else if (lastTs !== null){
      pos += (unit / (LOOP_SECONDS * 1000)) * Math.min(ts - lastTs, 100);
      if (pos >= unit) pos -= unit;
      track.scrollLeft = pos;
    }
    lastTs = ts;
    raf = requestAnimationFrame(frame);
  };

  /* ── arraste com mouse (no toque o navegador já rola sozinho) ── */
  let dragging = false;
  let lastX = 0, lastT = 0, velocity = 0;
  let glideRaf = null;

  track.addEventListener('pointerdown', e => {
    if (!on || e.pointerType !== 'mouse' || e.button !== 0) return;
    dragging = true;
    lastX = e.clientX;
    lastT = performance.now();
    velocity = 0;
    cancelAnimationFrame(glideRaf);
    pauseAuto();
    track.classList.add('is-dragging');
    track.setPointerCapture(e.pointerId);
  });

  track.addEventListener('pointermove', e => {
    if (!dragging) return;
    const now = performance.now();
    const dx = e.clientX - lastX;
    velocity = dx / Math.max(now - lastT, 1); // px por ms
    lastX = e.clientX;
    lastT = now;
    track.scrollLeft -= dx;
    wrapAround();
  });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove('is-dragging');
    if (reduceMotion.matches){ autoPaused = false; return; }
    // desliza com a velocidade do arraste e vai desacelerando; quando para,
    // espera um instante e o letreiro volta a andar sozinho
    let v = -velocity * 16; // px por quadro
    const glide = () => {
      if (Math.abs(v) < 0.3){ resumeAuto(); return; }
      track.scrollLeft += v;
      wrapAround();
      v *= 0.94;
      glideRaf = requestAnimationFrame(glide);
    };
    glideRaf = requestAnimationFrame(glide);
  };
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);

  track.addEventListener('touchstart', () => { if (on) pauseAuto(); }, { passive: true });
  track.addEventListener('touchend', () => { if (on) resumeAuto(1600); }, { passive: true });
  track.addEventListener('scroll', () => { if (on) wrapAround(); }, { passive: true });

  if ('IntersectionObserver' in window){
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(track);
  }

  const build = () => {
    if (on) return;
    on = true;
    /* no letreiro os cartões entram e saem de tela o tempo todo: a animação
       de surgimento não tem o que revelar, e os clones nasceriam presos
       invisíveis (o observador do script.js já passou por eles) */
    originals.forEach(el => { el.classList.remove('reveal'); el.classList.add('is-visible'); });
    addCopy();
    measure();
    pos = unit / 2;            // começa no meio, dá pra puxar pros dois lados
    track.scrollLeft = pos;
    lastTs = null;
    if (raf === null) raf = requestAnimationFrame(frame);
  };

  const teardown = () => {
    if (!on) return;
    on = false;
    if (raf !== null){ cancelAnimationFrame(raf); raf = null; }
    cancelAnimationFrame(glideRaf);
    clearTimeout(resumeTimer);
    autoPaused = false;
    grid.querySelectorAll('[data-clone]').forEach(el => el.remove());
    track.scrollLeft = 0;
    unit = 0;
  };

  const sync = () => { if (phone.matches) build(); else teardown(); };

  phone.addEventListener('change', sync);
  // a largura dos cartões é em vw: girar o aparelho muda a medida da volta
  window.addEventListener('resize', () => { if (on){ measure(); wrapAround(); } }, { passive: true });
  sync();
})();
