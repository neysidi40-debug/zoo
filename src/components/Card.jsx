/* ============================================================
   ZOO — card com holofote
   ============================================================
   O SpotlightCard do React Bits com as cores do site: um holofote
   laranja segue o mouse por dentro do card e acende a borda por onde
   ele passa. A superfície, a borda e a sombra saem dos tokens do tema
   (o componente original traz cinzas próprios), então o card acompanha
   o tema claro/escuro sozinho.

   `border` = a cor do fio de 1px em volta. As fichas de serviço passam
   "transparent": a grade delas já desenha os fios entre um card e outro.
   ============================================================ */

import SpotlightCard from '../reactbits/SpotlightCard.jsx';

export default function Card({ className = '', border = 'var(--line)', children, ...rest }) {
  return (
    <SpotlightCard
      className={className}
      spotlightColor="var(--orange)"
      intensity={0.13}
      spotlightSize={300}
      softness={0.75}
      borderGlow={0.9}
      proximity={70}
      style={{
        '--spotlight-card-surface': 'var(--panel)',
        '--spotlight-card-border': border,
        '--spotlight-card-shadow': 'none'
      }}
      {...rest}
    >
      {children}
    </SpotlightCard>
  );
}
