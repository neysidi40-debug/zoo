/* ============================================================
   ZOO — carrossel de slides arrastável
   ============================================================
   A faixa (track) rola na horizontal com scroll-snap do CSS: no celular
   o toque já rola nativo. Este hook acrescenta o que falta no desktop:

   · arrastar com o mouse: soltou depois de puxar, vai pro próximo ou
     anterior no sentido do arraste; se puxou bem pouco, volta pro slide
     em que estava;
   · step(±1), pros botões de seta;
   · `edges`: se a faixa está no começo ou no fim (pra desligar a seta).

   A classe is-dragging desliga o snap do CSS enquanto a rolagem suave
   anda, pra os dois não brigarem. Ela é posta direto no elemento, e não
   por estado: muda no meio de um gesto e não tem nada pra renderizar.
   ============================================================ */

import { useCallback, useEffect, useRef, useState } from 'react';

const SWIPE_MIN = 40; // px de arraste pra contar como "trocar de slide"

export function useSnapCarousel(trackRef) {
  const api = useRef({ step: () => {} });
  const [edges, setEdges] = useState({ atStart: true, atEnd: false });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const slides = () => Array.from(track.children);
    const maxLeft = () => track.scrollWidth - track.clientWidth;
    const slideLeft = i => Math.min(slides()[i].offsetLeft, maxLeft());
    const nearestIndex = left => {
      let best = 0;
      slides().forEach((_, i) => {
        if (Math.abs(slideLeft(i) - left) < Math.abs(slideLeft(best) - left)) best = i;
      });
      return best;
    };

    // o snap fica desligado enquanto a rolagem suave anda; religa quando
    // chega (ou por segurança, em 700ms)
    let releaseTimer = null;
    let dragging = false;
    const releaseSnap = () => {
      clearTimeout(releaseTimer);
      track.classList.remove('is-dragging');
    };
    const goTo = i => {
      const target = Math.max(0, Math.min(i, slides().length - 1));
      track.scrollTo({ left: slideLeft(target), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      clearTimeout(releaseTimer);
      releaseTimer = setTimeout(releaseSnap, 700);
    };
    const onScrollEnd = () => {
      if (!dragging) releaseSnap();
    };

    let startX = 0;
    let lastX = 0;
    let startIndex = 0;

    const onPointerDown = e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return; // toque rola nativo
      dragging = true;
      startX = lastX = e.clientX;
      startIndex = nearestIndex(track.scrollLeft);
      clearTimeout(releaseTimer);
      track.classList.add('is-dragging');
      track.setPointerCapture(e.pointerId);
    };
    const onPointerMove = e => {
      if (!dragging) return;
      track.scrollLeft -= e.clientX - lastX;
      lastX = e.clientX;
    };
    const endDrag = e => {
      if (!dragging) return;
      dragging = false;
      // puxou pra esquerda = avança; pra direita = volta
      const dist = e.clientX - startX;
      let target = startIndex;
      if (dist <= -SWIPE_MIN) target = startIndex + 1;
      else if (dist >= SWIPE_MIN) target = startIndex - 1;
      goTo(target); // is-dragging sai quando a rolagem suave termina
    };

    const updateEdges = () => {
      const atStart = track.scrollLeft <= 2;
      const atEnd = track.scrollLeft >= maxLeft() - 2;
      setEdges(prev => (prev.atStart === atStart && prev.atEnd === atEnd ? prev : { atStart, atEnd }));
    };

    api.current.step = dir => {
      track.classList.add('is-dragging'); // desliga o snap durante a rolagem
      goTo(nearestIndex(track.scrollLeft) + dir);
    };

    track.addEventListener('pointerdown', onPointerDown);
    track.addEventListener('pointermove', onPointerMove);
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('scrollend', onScrollEnd);
    track.addEventListener('scroll', updateEdges, { passive: true });
    window.addEventListener('resize', updateEdges);
    updateEdges();

    return () => {
      clearTimeout(releaseTimer);
      track.removeEventListener('pointerdown', onPointerDown);
      track.removeEventListener('pointermove', onPointerMove);
      track.removeEventListener('pointerup', endDrag);
      track.removeEventListener('pointercancel', endDrag);
      track.removeEventListener('scrollend', onScrollEnd);
      track.removeEventListener('scroll', updateEdges);
      window.removeEventListener('resize', updateEdges);
    };
  }, [trackRef]);

  const step = useCallback(dir => api.current.step(dir), []);
  return { step, edges };
}
