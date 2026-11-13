import { Reveal, stagger } from '../Reveal.jsx';
import { SectionHead } from '../SectionHead.jsx';
import { Mark } from '../Ink.jsx';

const FAQ = [
  {
    question: 'Quanto tempo leva para ficar pronto?',
    answer: (
      <>
        Em média <Mark>21 dias corridos</Mark> a partir da aprovação do design, dependendo do tamanho do projeto.
        Sistemas sob medida têm prazo combinado caso a caso, definido no diagnóstico.
      </>
    )
  },
  {
    question: 'O site fica no meu nome?',
    answer: (
      <>
        Sim. Domínio, hospedagem e todo o código ficam registrados <Mark>em seu nome ou CNPJ</Mark>.{' '}
        <Mark>Você não fica preso a nós</Mark> para manter o site no ar.
      </>
    )
  },
  {
    question: 'Como funciona o pagamento?',
    answer:
      'Entrada na aprovação do orçamento e o restante dividido em etapas até a entrega. Sistemas maiores podem ter parcelamento combinado à parte.'
  },
  {
    question: 'E se eu precisar mudar algo depois de pronto?',
    answer: (
      <>
        Os primeiros 30 dias de ajuste pós-lançamento <Mark>já estão inclusos</Mark>. Depois disso, seguimos com
        manutenção sob demanda ou plano mensal, conforme sua necessidade.
      </>
    )
  },
  {
    question: 'Preciso entender de tecnologia para manter o site?',
    answer: (
      <>
        Não. Você recebe um <Mark>painel simples</Mark> para trocar textos, fotos e produtos, além de um treinamento
        rápido explicando cada parte antes da entrega.
      </>
    )
  }
];

export default function Faq() {
  return (
    <section>
      <div className="wrap">
        <SectionHead lines={['Perguntas', 'frequentes']}>
          O que mais perguntam antes de fechar. Se ficar faltando algo, é só chamar no WhatsApp.
        </SectionHead>
        <div className="faq-list">
          {FAQ.map((item, index) => (
            <Reveal className="faq-item" key={item.question} delay={stagger(index)}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
