/* ============================================================
   ZOO — tema claro / escuro
   ============================================================
   O tema é uma classe no <html> (theme-light). A escolha fica salva
   no navegador do visitante e é aplicada por um script curtinho no
   <head> do index.html, ANTES de a página pintar — assim não pisca
   escuro→claro ao recarregar. Aqui fica só a troca.

   As cores de cada tema estão no topo do src/styles/global.css.
   ============================================================ */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const KEY = 'zoo-theme';
const META_COLOR = { dark: '#0E0D0C', light: '#ECE5D8' };

export const ThemeContext = createContext({ light: false, toggle: () => {} });
export const useThemeContext = () => useContext(ThemeContext);

export function useTheme() {
  const [light, setLight] = useState(() => document.documentElement.classList.contains('theme-light'));
  const timer = useRef(0);

  const toggle = useCallback(() => {
    const root = document.documentElement;
    const next = !root.classList.contains('theme-light');
    // liga uma transição curta de cores só durante a troca (ver global.css)
    root.classList.add('theme-switching');
    root.classList.toggle('theme-light', next);
    try {
      localStorage.setItem(KEY, next ? 'light' : 'dark');
    } catch {
      /* navegação privada etc. */
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => root.classList.remove('theme-switching'), 450);
    setLight(next);
  }, []);

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', light ? META_COLOR.light : META_COLOR.dark);
  }, [light]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return { light, toggle };
}
