/* ============================================================
   ZOO — Header, bolinha da nav e menu mobile
   ============================================================
   Três peças que andam juntas:

   1) A barra do topo. No primeiro scroll ela encolhe até virar uma
      bolinha só com o coala (ver hooks/useHeaderMorph.js).
   2) O destaque do link da seção que está na tela.
   3) O menu mobile: o hambúrguer e o painel ficam FORA do <header> de
      propósito. A barra encolhe, e o backdrop-filter dela cria bloco de
      contenção — qualquer position:fixed lá dentro seria arrastado e
      cortado junto com o morph. Aqui os dois ficam parados no lugar.

   O <header> não recebe className pelo JSX: as classes dele (over-hero,
   is-compact) são postas quadro a quadro pelo useHeaderMorph, e o React
   as apagaria a cada render.
   ============================================================ */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import KoalaIcon from './KoalaIcon.jsx';
import FluxLines from '../reactbits/FluxLines.jsx';
import { useHeaderMorph } from '../hooks/useHeaderMorph.js';
import { useThemeContext } from '../hooks/useTheme.js';
import { CIDADE, NAV, WHATSAPP_URL } from '../data/site.js';

/* qual seção está na faixa do meio da tela — é ela que acende no menu */
function useActiveSection(ids) {
  const [active, setActive] = useState(null);

  useEffect(() => {
    const sections = ids.map(id => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return undefined;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}

const NAV_IDS = NAV.map(item => item.id);

// linhas do fundo do menu mobile, na família do laranja
const FLUX_COLORS = ['#FF5A1F', '#FF7A1A', '#C73E0A'];

/* ── menu mobile: a entrada das peças ── */
const MENU_EASE = [0.2, 0.7, 0.3, 1];
const MENU = {
  open: { transition: { delayChildren: 0.3, staggerChildren: 0.06 } },
  closed: { transition: { staggerChildren: 0 } }
};
const MENU_ITEM = {
  open: { opacity: 1, y: 0, transition: { duration: 0.45, ease: MENU_EASE } },
  closed: { opacity: 0, y: -16, transition: { duration: 0.15 } }
};
// a logo chega desfocada, como na tela de abertura
const MENU_BRAND = {
  open: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: MENU_EASE } },
  closed: { opacity: 0, y: -20, filter: 'blur(8px)', transition: { duration: 0.15 } }
};

const WINK_AT = 1.25; // s depois de abrir o menu
const WINK = { duration: 0.3, ease: [0.45, 0, 0.55, 1], delay: WINK_AT };
const WINK_RESET = { duration: 0, delay: 0.5 }; // com o painel já fechado

/* A logo do menu: no celular não cabe a logo flutuante da hero, então a
   piscada dela mora aqui. São as duas artes empilhadas — entra de olhos
   abertos e, um instante depois de o menu abrir, a de olhos abertos some
   enquanto a que pisca aparece. Fechou o menu, volta ao começo: toda vez
   que abre, pisca de novo. */
function MenuLogo({ open }) {
  return (
    <span className="menu-logo" aria-hidden="true">
      <motion.img
        src="/zoo-eyes-open.png"
        alt=""
        initial={false}
        animate={{ opacity: open ? 0 : 1 }}
        transition={open ? WINK : WINK_RESET}
      />
      <motion.img
        src="/zoo.png"
        alt=""
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={open ? WINK : WINK_RESET}
      />
    </span>
  );
}

export default function Header() {
  const headerRef = useRef(null);
  const wrapRef = useRef(null);
  const bubbleRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const active = useActiveSection(NAV_IDS);
  const { light } = useThemeContext();

  useHeaderMorph(headerRef, wrapRef, bubbleRef);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = event => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  /* o FluxLines é um shader: só fica montado com o menu aberto (e mais um
     instante, enquanto o painel fecha), pra não gastar GPU escondido */
  const [fluxOn, setFluxOn] = useState(false);
  useEffect(() => {
    if (menuOpen) {
      setFluxOn(true);
      return undefined;
    }
    const timer = setTimeout(() => setFluxOn(false), 600);
    return () => clearTimeout(timer);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header ref={headerRef}>
        <div className="wrap nav" ref={wrapRef}>
          <a className="logo" href="#top">
            <KoalaIcon size={24} />
            ZOO
          </a>
          <nav className="nav-links" aria-label="Navegação principal">
            {NAV.map(item => (
              <a key={item.id} href={`#${item.id}`} className={active === item.id ? 'is-active' : undefined}>
                {item.label}
              </a>
            ))}
          </nav>
          <a className="btn btn-solid nav-cta" href="#contato">
            Iniciar projeto
          </a>
        </div>
        {/* bolinha do header compacto */}
        <button className="nav-bubble" type="button" aria-label="Voltar ao topo" ref={bubbleRef}>
          <KoalaIcon size={32} className="" />
        </button>
      </header>

      <button
        className={`menu-toggle${menuOpen ? ' open' : ''}`}
        type="button"
        aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={menuOpen}
        aria-controls="mobileNav"
        onClick={() => setMenuOpen(open => !open)}
      >
        <span />
        <span />
        <span />
      </button>

      {/* o que sobra da tela quando o painel abre: desfoque por cima da
          página, e tocar nele fecha o menu */}
      <div className="nav-scrim" onClick={closeMenu} />

      <nav className={`mobile-nav${menuOpen ? ' open' : ''}`} id="mobileNav" aria-label="Navegação mobile" inert={!menuOpen}>
        <div className="mobile-nav__splash" aria-hidden="true" />
        {/* o fundo vivo do painel: as linhas do FluxLines (React Bits), bem
            apagadas e só na parte de cima — o CSS dissolve o resto */}
        <div className="mobile-nav__glow" aria-hidden="true">
          {fluxOn && (
            <FluxLines
              className="mobile-nav__flux"
              colors={FLUX_COLORS}
              speed={0.4}
              scale={1.4}
              glow={1.6}
              lightMode={light}
              clickSwirl={false}
            />
          )}
        </div>

        {/* as peças entram uma depois da outra, só depois que o círculo já
            pintou o fundo (delayChildren); ao fechar, somem todas juntas */}
        <motion.div className="mobile-nav__inner" initial={false} animate={menuOpen ? 'open' : 'closed'} variants={MENU}>
          <motion.a className="mobile-nav__brand" href="#top" aria-label="ZOO — voltar ao topo" onClick={closeMenu} variants={MENU_BRAND}>
            <MenuLogo open={menuOpen} />
          </motion.a>

          <motion.span className="mono mobile-nav__kicker" variants={MENU_ITEM}>
            NAVEGAÇÃO
          </motion.span>
          <div className="mobile-nav__links">
            {NAV.map((item, index) => (
              <motion.a
                key={item.id}
                className={`mobile-nav__link${active === item.id ? ' is-active' : ''}`}
                href={`#${item.id}`}
                onClick={closeMenu}
                variants={MENU_ITEM}
              >
                <span className="mono" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="mobile-nav__label">{item.label}</span>
                <span className="mobile-nav__arrow" aria-hidden="true">
                  →
                </span>
              </motion.a>
            ))}
          </div>

          <motion.div className="mobile-nav__foot" variants={MENU_ITEM}>
            <a className="btn btn-solid" href="#contato" onClick={closeMenu}>
              Iniciar projeto
            </a>
            <div className="mobile-nav__meta mono">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener">
                WHATSAPP ↗
              </a>
              <span>{CIDADE.toUpperCase()}</span>
            </div>
          </motion.div>
        </motion.div>
      </nav>
    </>
  );
}
