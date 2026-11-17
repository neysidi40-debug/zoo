/* ============================================================
   ZOO — dados gerais do site
   ============================================================
   Tudo que é contato e link de menu mora aqui, pra trocar num lugar
   só. Por enquanto o contato da Zoo é só por email.
   ============================================================ */

export const EMAIL_CONTATO = 'zooseusite@gmail.com';
// botão "Mande um email" do fim da página: abre o app de email com o assunto pronto
export const EMAIL_ORCAMENTO_URL = `mailto:${EMAIL_CONTATO}?subject=${encodeURIComponent('Orçamento de site')}`;
export const CIDADE = 'Recife, PE';

/* Links do menu, na ordem em que aparecem. "Time" e "Projetos" saíram
   junto com as seções deles; pra voltar, é só recolocar a linha aqui e
   montar a seção no App.jsx. */
export const NAV = [
  { id: 'processo', label: 'Processo' },
  { id: 'servicos', label: 'Serviços' },
  { id: 'precos', label: 'Preços' },
  { id: 'contato', label: 'Contato' }
];

/* letreiro da hero */
export const SEGMENTOS = [
  'RESTAURANTES',
  'LOJAS',
  'CLÍNICAS',
  'ESCRITÓRIOS',
  'OFICINAS',
  'ESTÚDIOS',
  'PRESTADORES DE SERVIÇO'
];

/* palavras que se revezam no fim do título da hero (o ponto final é
   digitado junto, porque faz parte da frase) */
export const PALAVRAS_HERO = ['crescer.', 'vender.', 'durar.'];
