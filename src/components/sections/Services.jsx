/* ============================================================
   ZOO — O que a gente constrói (fichas de serviço + carrossel)
   ============================================================
   Três fichas, cada uma num card com holofote (Card.jsx → SpotlightCard
   do React Bits), e logo abaixo o carrossel de projetos.

   A piscada em cadeia dos quadradinhos das listas é CSS: começa quando
   a ficha ganha a classe is-visible (posta pelo <Reveal>).
   ============================================================ */

import Card from '../Card.jsx';
import { Reveal, stagger } from '../Reveal.jsx';
import { SectionHead } from '../SectionHead.jsx';
import { Mark } from '../Ink.jsx';
import WorkCarousel from './WorkCarousel.jsx';

const SERVICES = [
  {
    title: 'Site institucional',
    text: 'A presença oficial do seu negócio na internet: quem você é, o que oferece e como falar com você.',
    specs: [
      'Até 6 páginas (Home, Sobre, Serviços, Contato...)',
      'Formulário de contato direto',
      <Mark key="seo">Otimizado para aparecer no Google</Mark>,
      'Painel simples para você atualizar os textos'
    ]
  },
  {
    title: 'Loja virtual',
    text: (
      <>
        Catálogo de produtos, carrinho e pagamento — para <Mark>vender direto pelo site</Mark>, sem depender apenas de
        rede social.
      </>
    ),
    specs: [
      'Catálogo com fotos e variações',
      'Carrinho e checkout com Pix/cartão',
      'Controle de estoque simples',
      'Integração com WhatsApp para vendas'
    ]
  },
  {
    title: 'Sistema sob medida',
    text: (
      <>
        Quando um site pronto não resolve: painel de agendamento, área de cliente, cadastros e{' '}
        <Mark>regras próprias do seu negócio</Mark>.
      </>
    ),
    specs: [
      'Levantamento do fluxo do seu negócio',
      'Login e área restrita quando precisar',
      'Banco de dados próprio',
      'Suporte para evoluir com o tempo'
    ]
  }
];

export default function Services() {
  return (
    <section className="services" id="servicos">
      <div className="wrap">
        <SectionHead lines={['O que a gente', 'constrói']}>
          Três formatos de base. Todos ajustados sob medida para o seu negócio —{' '}
          <Mark>nada de template genérico</Mark> com sua logo em cima.
        </SectionHead>

        <div className="service-grid">
          {SERVICES.map((service, index) => (
            <Reveal className="service-cell" key={service.title} delay={stagger(index)}>
              <Card className="service-card" border="transparent">
                <span className="num mono">FICHA {String(index + 1).padStart(2, '0')}</span>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
                <ul className="spec-list">
                  {service.specs.map((spec, i) => (
                    <li key={i}>
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </Reveal>
          ))}
        </div>

        <WorkCarousel />
      </div>
    </section>
  );
}
