/* ============================================================
   ZOO — dados gerais do site
   ============================================================
   Tudo que é contato, link de menu e placeholder mora aqui, pra
   trocar num lugar só.

   AINDA É PLACEHOLDER (trocar antes de publicar):
     - WHATSAPP: número fictício
     - CNPJ: valor fictício
   ============================================================ */

export const WHATSAPP = '5581900000000';
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP}`;
export const WHATSAPP_QUOTE_URL = `${WHATSAPP_URL}?text=Ol%C3%A1!%20Quero%20um%20or%C3%A7amento%20de%20site.`;

export const EMAIL_CONTATO = 'zooseusite@gmail.com';
export const EMAIL_SUPORTE = 'koalasuporte@gmail.com';
export const CNPJ = '00.000.000/0001-00';
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
