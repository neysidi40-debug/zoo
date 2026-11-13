/* ============================================================
   ZOO — seleção de texto estilo marca-texto
   ============================================================
   A ::selection nativa fica transparente (html.ink-selection no CSS) e
   o traço é um ::highlight (CSS Custom Highlight API): o navegador pinta
   o fundo ATRÁS das letras, igual à seleção normal — o texto nunca some
   e o destaque acompanha o texto ao rolar, sem recalcular posição.

   Animação: um instante depois de soltar o mouse, o destaque cresce da
   primeira à última letra selecionada numa varrida rápida. Lê a seleção
   REAL do navegador, então Ctrl+C continua normal. Sem suporte à API ou
   com "reduzir movimento", fica a seleção laranja comum.

   É um efeito da página inteira, sem nada pra renderizar: por isso é um
   hook chamado uma vez no App, e não um componente.
   ============================================================ */

import { useEffect } from 'react';

const PAINT_DELAY = 40; // atraso proposital antes do traço aparecer
const SWEEP_MS = 320; // duração da varrida da 1ª à última letra
const ON_ORANGE = '.cta-final'; // fundo laranja usa outro tom (ver CSS)

const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

export function useInkSelection() {
  useEffect(() => {
    const supported = typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight === 'function';
    if (!supported || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const root = document.documentElement;
    root.classList.add('ink-selection');

    const inkHL = new Highlight();
    const inkOnOrangeHL = new Highlight();
    CSS.highlights.set('ink', inkHL);
    CSS.highlights.set('ink-on-orange', inkOnOrangeHL);

    let paintTimer = null;
    let sweepRaf = null;
    let pointerDown = false;

    const clearInk = () => {
      if (sweepRaf !== null) {
        cancelAnimationFrame(sweepRaf);
        sweepRaf = null;
      }
      inkHL.clear();
      inkOnOrangeHL.clear();
    };

    // quebra a seleção em pedaços, um por nó de texto, marcando os que
    // estão em fundo laranja
    const textPieces = range => {
      const pieces = [];
      const container = range.commonAncestorContainer;
      const walker = document.createTreeWalker(
        container.nodeType === Node.TEXT_NODE ? container.parentNode : container,
        NodeFilter.SHOW_TEXT
      );
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!range.intersectsNode(node)) continue;
        const start = node === range.startContainer ? range.startOffset : 0;
        const end = node === range.endContainer ? range.endOffset : node.length;
        if (end <= start || !node.data.slice(start, end).trim()) continue;
        const el = node.parentElement;
        pieces.push({ node, start, end, onOrange: Boolean(el && el.closest(ON_ORANGE)) });
      }
      return pieces;
    };

    // destaca só as primeiras `count` letras da seleção
    const renderInk = (pieces, count) => {
      inkHL.clear();
      inkOnOrangeHL.clear();
      let left = count;
      for (const p of pieces) {
        if (left <= 0) break;
        const len = Math.min(p.end - p.start, left);
        const r = document.createRange();
        r.setStart(p.node, p.start);
        r.setEnd(p.node, p.start + len);
        (p.onOrange ? inkOnOrangeHL : inkHL).add(r);
        left -= len;
      }
    };

    const paintSelection = () => {
      clearInk();
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
      const pieces = textPieces(sel.getRangeAt(0));
      const total = pieces.reduce((n, p) => n + (p.end - p.start), 0);
      if (!total) return;

      let t0 = null;
      const tick = ts => {
        if (t0 === null) t0 = ts;
        const t = Math.min((ts - t0) / SWEEP_MS, 1);
        renderInk(pieces, Math.ceil(total * easeOutCubic(t)));
        sweepRaf = t < 1 ? requestAnimationFrame(tick) : null;
      };
      sweepRaf = requestAnimationFrame(tick);
    };

    const schedulePaint = () => {
      clearTimeout(paintTimer);
      paintTimer = setTimeout(paintSelection, PAINT_DELAY);
    };

    // mouse: pinta ao soltar o botão (durante o arraste não desenha nada)
    const onPointerDown = () => {
      pointerDown = true;
    };
    const onPointerUp = () => {
      pointerDown = false;
      schedulePaint();
    };
    // teclado (Shift+setas, Ctrl+A) e alças de seleção do celular não
    // passam pelo pointerup — pegam a mudança de seleção direto
    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        clearTimeout(paintTimer);
        clearInk();
        return;
      }
      if (!pointerDown) schedulePaint();
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('selectionchange', onSelectionChange);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('selectionchange', onSelectionChange);
      clearTimeout(paintTimer);
      clearInk();
      CSS.highlights.delete('ink');
      CSS.highlights.delete('ink-on-orange');
      root.classList.remove('ink-selection');
    };
  }, []);
}
