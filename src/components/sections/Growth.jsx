/* ============================================================
   ZOO — Crescimento (texto + gráfico)
   ============================================================
   O gráfico é SVG inline: não tem imagem pra baixar e as cores saem dos
   tokens do site, então acompanha o tema claro/escuro sozinho. A curva
   é ilustrativa, não é dado de cliente.

   O gráfico se desenha por CORTINA (um retângulo dentro do <clipPath>
   cresce da esquerda pra direita) e a bolinha da ponta estoura quando a
   cortina chega ao fim. As duas animações são CSS, ligadas pela classe
   is-visible que o <Reveal> põe quando o bloco entra na tela.
   ============================================================ */

import { Reveal } from '../Reveal.jsx';
import { BlurTitle } from '../SectionHead.jsx';
import { Mark, Uline } from '../Ink.jsx';

const CHART_LINE =
  'M0 250 L4.8 252.5 L9.7 250 L14.5 253.2 L19.3 254.2 L24.1 249.6 L29 252.1 L33.8 252.3 L38.6 254 L43.4 251.8 L48.3 251.1 L53.1 251.1 L57.9 252.1 L62.8 253.4 L67.6 248.6 L72.4 248.9 L77.2 252.7 L82.1 248.7 L86.9 252.1 L91.7 248 L96.6 247.2 L101.4 246.4 L106.2 247.1 L111 247.9 L115.9 246.6 L120.7 250 L125.5 247.8 L130.3 245.1 L135.2 244.1 L140 242 L144.8 247.2 L149.7 245.2 L154.5 241.8 L159.3 241.4 L164.1 238.9 L169 240.5 L173.8 240.2 L178.6 239.6 L183.4 231.9 L188.3 237.6 L193.1 229.7 L197.9 231.4 L202.8 231.2 L207.6 227.9 L212.4 220.9 L217.2 223.7 L222.1 226.3 L226.9 220 L231.7 224.2 L236.6 245.8 L241.4 223.2 L246.2 216 L251 215.5 L255.9 220.6 L260.7 219 L265.5 217.2 L270.3 219.6 L275.2 216.3 L280 217.7 L284.8 212.4 L289.7 214.8 L294.5 205.9 L299.3 215 L304.1 203.3 L309 213 L313.8 200.9 L318.6 201.8 L323.4 208.7 L328.3 202.6 L333.1 200.6 L337.9 193.4 L342.8 197.8 L347.6 192.6 L352.4 187.9 L357.2 193.8 L362.1 191.3 L366.9 189.7 L371.7 214.6 L376.6 180.7 L381.4 177.2 L386.2 179.3 L391 180.3 L395.9 172.5 L400.7 171.2 L405.5 171.4 L410.3 176.4 L415.2 175.3 L420 170.7 L424.8 161.7 L429.7 157 L434.5 162 L439.3 147.5 L444.1 153.8 L449 143.8 L453.8 143.3 L458.6 136.6 L463.4 134.6 L468.3 125.9 L473.1 120.6 L477.9 121.8 L482.8 115.3 L487.6 117.4 L492.4 102.9 L497.2 112.4 L502.1 99.6 L506.9 91.4 L511.7 96.3 L516.6 94.2 L521.4 89.7 L526.2 86.1 L531 89.9 L535.9 82.3 L540.7 84.6 L545.5 79 L550.3 73 L555.2 78 L560 70';
// a área é o mesmo traçado, fechado pela base do gráfico
const CHART_AREA = `${CHART_LINE} L560 340 L0 340 Z`;

export default function Growth() {
  return (
    <section className="growth">
      <div className="wrap growth-grid">
        <div className="growth-text">
          <Reveal as="span" className="mono growth-kicker">
            POR QUE IMPORTA
          </Reveal>
          <h2>
            <BlurTitle lines={['Quem não é achado,', 'não é contratado.']} />
          </h2>
          <Reveal as="p" delay={0.1}>
            Hoje quase toda pessoa procura por serviço <Mark>começa no Google ou numa rede social</Mark>. Sem um site
            próprio, seu negócio <Mark>depende só de indicação</Mark> — e fica de fora quando o cliente compara as
            opções.
          </Reveal>
          <Reveal as="p" delay={0.18}>
            Um site bem feito <Mark>trabalha enquanto você atende</Mark>: responde as dúvidas de sempre, mostra o que
            você faz e <Uline>leva a conversa direto pro WhatsApp</Uline>.
          </Reveal>
        </div>

        <Reveal className="growth-chart" amount={0.35}>
          <div className="chart-panel">
            <svg className="chart-plot" viewBox="0 0 560 340" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <defs>
                <linearGradient id="zooChartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop className="chart-stop-a" offset="0" />
                  <stop className="chart-stop-b" offset=".62" />
                  <stop className="chart-stop-c" offset="1" />
                </linearGradient>
                {/* a cortina que revela o gráfico da esquerda pra direita */}
                <clipPath id="zooChartWipe">
                  <rect className="chart-wipe" x="0" y="0" width="560" height="340" />
                </clipPath>
              </defs>
              <g className="chart-grid">
                <path d="M112 0V340M224 0V340M336 0V340M448 0V340" vectorEffect="non-scaling-stroke" />
                <path d="M0 68H560M0 136H560M0 204H560M0 272H560" vectorEffect="non-scaling-stroke" />
              </g>
              <g clipPath="url(#zooChartWipe)">
                <path className="chart-area" d={CHART_AREA} />
                <path className="chart-line" vectorEffect="non-scaling-stroke" d={CHART_LINE} />
              </g>
            </svg>
            <p className="chart-caption mono">CRESCIMENTO ILUSTRATIVO</p>
          </div>
          {/* fica FORA do painel: o painel corta o que passa da borda, e a
              bolinha precisa aparecer inteira em cima dela */}
          <span className="chart-head" aria-hidden="true" />
        </Reveal>
      </div>
    </section>
  );
}
