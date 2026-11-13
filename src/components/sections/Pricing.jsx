/* ============================================================
   ZOO — Quanto investir (planos)
   ============================================================
   VALORES ILUSTRATIVOS — ajustar antes de publicar.

   Três cards com holofote (Card.jsx → SpotlightCard do React Bits). O
   mais caro tem uma pill que desliza entre duas versões do mesmo plano
   dentro do mesmo card: as duas panes ocupam a mesma célula do grid,
   então o card não muda de tamanho na troca. A pane que entra vem do
   lado pro qual a pill andou; a que sai vai pro lado oposto.
   Setas ← → trocam de aba pelo teclado; a pane escondida fica "inert"
   pra não receber foco.
   ============================================================ */

import { useContext, useRef, useState } from 'react';
import { motion } from 'motion/react';
import Card from '../Card.jsx';
import { Reveal, RevealContext, stagger } from '../Reveal.jsx';
import { SectionHead } from '../SectionHead.jsx';
import { Mark, Uline } from '../Ink.jsx';

const Price = ({ value }) => (
  <>
    <span className="plan-price-from">a partir de</span>
    <span className="plan-price">
      <small>R$</small>
      {value}
    </span>
  </>
);

const Specs = ({ items }) => (
  <ul className="spec-list">
    {items.map((item, index) => (
      <li key={index}>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const SYSTEM_TABS = [
  {
    label: 'Essencial',
    desc: (
      <>
        Um processo do seu negócio no digital: <Uline>agenda, pedidos ou cadastro de clientes</Uline>.
      </>
    ),
    price: '8.900',
    specs: [
      'Levantamento do fluxo do negócio',
      '1 módulo principal',
      <Uline key="login">Login e área restrita</Uline>,
      'Painel administrativo'
    ]
  },
  {
    label: 'Completo',
    desc: 'Vários processos integrados num painel só, pensado pra crescer junto com a empresa.',
    price: '14.900',
    specs: ['Tudo do Essencial', 'Até 4 módulos integrados', 'Níveis de acesso por equipe', 'Relatórios e avisos por WhatsApp']
  }
];

function SystemPlan() {
  const [current, setCurrent] = useState(0);
  const switched = useRef(false);
  const buttons = useRef([]);
  const reveal = useContext(RevealContext);

  const goTo = index => {
    if (index === current) return;
    switched.current = true;
    setCurrent(index);
  };

  const onKeyDown = event => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = (current + (event.key === 'ArrowRight' ? 1 : -1) + SYSTEM_TABS.length) % SYSTEM_TABS.length;
    goTo(next);
    buttons.current[next]?.focus();
  };

  return (
    <>
      <div className="plan-toggle" role="tablist" aria-label="Versão do sistema">
        {SYSTEM_TABS.map((tab, index) => (
          <button
            key={tab.label}
            ref={node => {
              buttons.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`plan-sys-tab-${index}`}
            className={`plan-toggle-btn${index === current ? ' is-active' : ''}`}
            aria-controls={`plan-sys-${index}`}
            aria-selected={index === current}
            tabIndex={index === current ? 0 : -1}
            onClick={() => goTo(index)}
            onKeyDown={onKeyDown}
          >
            {tab.label}
          </button>
        ))}
        <motion.span
          className="plan-toggle-thumb"
          aria-hidden="true"
          initial={false}
          animate={{ x: `${current * 100}%` }}
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        />
      </div>

      <div className="plan-toggle-panes">
        {SYSTEM_TABS.map((tab, index) => {
          const isActive = index === current;
          return (
            // os sublinhados da pane que entra passam a caneta de novo: cada
            // pane avisa os dela, pelo contexto, quando está na tela
            <RevealContext.Provider
              key={tab.label}
              value={{ shown: reveal.shown && isActive, settleMs: switched.current ? 220 : reveal.settleMs }}
            >
              <motion.div
                className="plan-toggle-pane"
                role="tabpanel"
                id={`plan-sys-${index}`}
                aria-labelledby={`plan-sys-tab-${index}`}
                data-ink-host=""
                inert={!isActive}
                initial={false}
                animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: index < current ? -16 : 16 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="plan-desc">{tab.desc}</p>
                <Price value={tab.price} />
                <Specs items={tab.specs} />
                <a className="btn btn-solid" href="#contato">
                  Falar sobre o projeto
                </a>
              </motion.div>
            </RevealContext.Provider>
          );
        })}
      </div>
    </>
  );
}

export default function Pricing() {
  return (
    <section className="pricing" id="precos">
      <div className="wrap">
        <SectionHead lines={['Quanto', 'investir']}>
          <Mark>Preço fechado por projeto</Mark>, combinado antes de começar. Sem mensalidade obrigatória — o site é
          seu.
        </SectionHead>

        <div className="plan-grid">
          <Reveal className="plan-cell" delay={stagger(0)}>
            <Card className="plan-card">
              <span className="mono plan-name">01 — Presença</span>
              <h3>Site institucional</h3>
              <p className="plan-desc">Pra ser encontrado no Google e passar confiança logo no primeiro clique.</p>
              <Price value="2.490" />
              <Specs
                items={[
                  <>
                    Até <Uline>6</Uline> páginas
                  </>,
                  <>
                    Formulário e botão de <Uline>WhatsApp</Uline>
                  </>,
                  'SEO básico para o Google',
                  'Painel para editar os textos'
                ]}
              />
              <a className="btn" href="#contato">
                Pedir orçamento
              </a>
            </Card>
          </Reveal>

          <Reveal className="plan-cell" delay={stagger(1)}>
            <Card className="plan-card">
              <span className="mono plan-name">02 — Vendas</span>
              <h3>Loja virtual</h3>
              <p className="plan-desc">
                <Uline>Pra vender direto pelo site, sem depender só de rede social.</Uline>
              </p>
              <Price value="4.990" />
              <Specs
                items={[
                  'Catálogo com fotos e variações',
                  <Uline key="checkout">Checkout com Pix e Stripe</Uline>,
                  'Controle de estoque simples',
                  <Uline key="aviso">Pedido avisado no WhatsApp</Uline>
                ]}
              />
              <a className="btn" href="#contato">
                Pedir orçamento
              </a>
            </Card>
          </Reveal>

          {/* o selo fica fora do card: ele passa da borda de cima, e o card
              corta o que sai dele */}
          <Reveal className="plan-cell" delay={stagger(2)}>
            <span className="plan-badge">Mais completo</span>
            <Card className="plan-card plan-card--featured" border="var(--orange)">
              <span className="mono plan-name">03 — Operação</span>
              <h3>Sistema sob medida</h3>
              <SystemPlan />
            </Card>
          </Reveal>
        </div>

        <Reveal as="p" className="plan-note">
          Todos os planos incluem domínio e hospedagem configurados, site responsivo e 30 dias de suporte. Entrada na
          aprovação e o restante em etapas.
        </Reveal>
      </div>
    </section>
  );
}
