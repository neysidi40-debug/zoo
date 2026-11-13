/* ============================================================
   ZOO — projetos do carrossel ("O que a gente constrói")
   ============================================================
   Cada item vira um slide: o vídeo do site ao vivo (com a capa em
   .jpg), a legenda por cima e a ficha que aparece ao lado.

   Pra adicionar um projeto: copie um bloco, troque os textos e
   coloque o vídeo e a capa em public/projetos/. `phone` é opcional:
   só os projetos que têm vídeo de celular mostram a ficha da
   esquerda.

   O último item é o slide reservado ("Seu projeto"), sem vídeo.
   ============================================================ */

const midia = nome => ({
  video: `/projetos/${nome}.mp4`,
  poster: `/projetos/${nome}.jpg`
});
const celular = nome => ({
  video: `/projetos/${nome}-celular.mp4`,
  poster: `/projetos/${nome}-celular.jpg`
});

export const PROJECTS = [
  {
    id: 'combo-lanches',
    name: 'Combo Lanches',
    tag: 'CARDÁPIO DIGITAL',
    ...midia('combo-lanches'),
    phone: celular('combo-lanches'),
    alt: 'Vídeo do site da Combo Lanches: hambúrguer montando na rolagem, troca de tema, cardápio, lanche montado com adicionais, sacola, pedido simulado com Pix e rastreio do entregador',
    info: {
      label: 'CARDÁPIO DIGITAL · 2026',
      text: 'Site e cardápio com sacola para uma hamburgueria de Caetés I, em Abreu e Lima (PE). Na home, o hambúrguer se monta conforme você rola. Tem um montador de combo, tema claro e escuro e uma versão própria para o celular.',
      bullets: ['Hambúrguer que se monta na rolagem', 'Sacola, Pix simulado e rastreio', 'Versão própria para celular'],
      stack: 'React · Vite · Tailwind CSS · Motion · GSAP',
      href: 'https://combo-lanches.vercel.app/'
    }
  },
  {
    id: 'aluado',
    name: "Aluado's Store",
    tag: 'LOJA VIRTUAL',
    ...midia('aluado'),
    phone: celular('aluado'),
    alt: "Vídeo da Aluado's Store: abertura da página, boné em 3D girado de frente trocando de estampa, tema escuro, botão segure para comprar e formulário de envio preenchido",
    info: {
      label: 'LOJA VIRTUAL · 2026',
      text: 'Loja de um produto só, para o drop de um boné. O boné aparece em 3D e gira na tela, dá pra trocar a estampa e a compra é feita segurando o botão, com Pix de verdade via Asaas e Supabase. Tem tema claro e escuro.',
      bullets: ['Boné em 3D com React Three Fiber', 'Pix real via Asaas + Supabase', 'Tema claro e escuro'],
      stack: 'React · Vite · Three.js · Motion · Supabase',
      href: 'https://www.aluado.store/'
    }
  },
  {
    id: 'garden-brasa',
    name: 'Garden Brasa',
    tag: 'LINK NA BIO',
    ...midia('garden-brasa'),
    alt: 'Vídeo da página de links do Garden Brasa sendo rolada, com troca de tema',
    info: {
      label: 'LINK NA BIO · 2025',
      text: 'Link na bio do Garden Brasa, restaurante no Itanhangá (RJ). Reúne iFood, redes sociais, WhatsApp e mapa com rota numa página só, com tema claro e escuro. Feita sobre o template LittleLink.',
      bullets: ['iFood, redes e WhatsApp num lugar só', 'Mapa com botão de rota', 'Tema claro e escuro'],
      stack: 'HTML · CSS · JavaScript · LittleLink',
      href: 'https://gardenbrasabio.vercel.app/'
    }
  },
  {
    id: 'dharlan-world',
    name: 'dharlan.world',
    tag: 'SITE PESSOAL',
    ...midia('dharlan-world'),
    phone: celular('dharlan-world'),
    alt: 'Vídeo do site dharlan.world: home com troca de tema, sobre mim, gerador de kaomoji, criador de avatar, wishlist, contato, 2kki, portfólio, arte, terminal com help, sitemap e exit (a boneca em dither atravessa a tela) e o rádio flutuando na home',
    info: {
      label: 'SITE PESSOAL · 2026',
      text: 'Site pessoal e blog do dharlan com estética de web antiga: HTML escrito à mão, ASCII art, galerias, portfólio, página em formato de terminal e vários temas de cor. Tudo sem framework e sem build.',
      bullets: ['Estética old web feita à mão', 'Página em formato de terminal', 'Vários temas de cor'],
      stack: 'HTML · CSS · JavaScript · Vercel',
      href: 'https://www.dharlan.world/'
    }
  },
  {
    id: 'lidera360',
    name: 'Lidera360',
    tag: 'PLATAFORMA',
    ...midia('lidera360'),
    phone: celular('lidera360'),
    alt: 'Vídeo da Lidera360: home com as pills de preço, login, versão logada, menu, dashboard com destaque de trilha, tudo no tema escuro, e o perfil trocando para o tema claro',
    info: {
      label: 'PLATAFORMA · SENAC · 2026',
      text: 'Projeto Senac: landing e protótipo de uma plataforma de treinamento corporativo, com trilhas, dashboard do aluno e perfil. HTML, CSS e JS puros, tema claro/escuro e intro animada em WebGL.',
      bullets: ['Tema claro/escuro com tokens próprios', 'Intro com contador e shader WebGL', 'Sem framework: HTML, CSS e JS puros'],
      stack: 'HTML · CSS · JavaScript · WebGL',
      href: 'https://lidera360-senac.vercel.app/'
    }
  },
  {
    id: '4bit9d',
    name: '4bit.9d core',
    tag: 'SITE PESSOAL',
    ...midia('4bit9d'),
    alt: 'Vídeo do site 4bit.9d core sendo rolado',
    info: {
      label: 'SITE PESSOAL · 2025',
      text: 'Site pessoal com cara de terminal: tela de boot, texto digitado ao vivo, arte ASCII e braille em preto e branco e painéis tipo "cat about_me.txt" e "ls -la /social" com os links.',
      bullets: ['Estética de terminal em preto e branco', 'Arte ASCII/braille digitada ao vivo', 'Tela de boot antes do conteúdo'],
      stack: 'React · TypeScript · Vite · Tailwind CSS',
      href: 'https://4bit9d.vercel.app/'
    }
  },
  {
    id: 'mitch',
    name: 'mitchdapesada',
    tag: 'LINK NA BIO',
    ...midia('mitch'),
    alt: 'Vídeo da página de links do mitchdapesada sendo rolada',
    info: {
      label: 'LINK NA BIO · 2025',
      text: 'Link na bio de um criador de conteúdo: foto, números das redes, cards com imagem levando pro Twitter, Instagram e YouTube, e botões pra compartilhar. Escuro, direto e no tom zoeiro do perfil.',
      bullets: ['Contadores das redes logo no topo', 'Cards com imagem para cada canal', 'Botões de compartilhar no rodapé'],
      stack: 'HTML · CSS · JavaScript · Vercel',
      href: 'https://mitchrework.vercel.app/'
    }
  },
  {
    id: 'diverse-bio',
    name: 'Diverse',
    tag: 'LINK NA BIO',
    ...midia('diverse-bio'),
    alt: 'Vídeo da página de links da Diverse sendo rolada, com troca de tema',
    info: {
      label: 'LINK NA BIO · 2025',
      text: 'Página de link na bio da Diverse, marca de bolsas e acessórios artesanais. Reúne Instagram, destaques de modelos e estampas, WhatsApp e e-mail, com galeria de produtos e troca de tema claro/escuro.',
      bullets: ['Atalhos para Instagram, WhatsApp e e-mail', 'Galeria de produtos em carrossel', 'Tema claro e escuro com um clique'],
      stack: 'HTML · CSS · JavaScript · LittleLink',
      href: 'https://diverseoldbio.vercel.app/'
    }
  },
  {
    // último slide: reservado pro próximo projeto
    id: 'seu-projeto',
    name: 'Seu projeto',
    tag: 'VAGA ABERTA',
    placeholder: { label: 'PRÓXIMO PROJETO', text: 'Seu site pode ser o próximo aqui.' },
    info: {
      label: 'VAGA ABERTA',
      text: 'Site, loja ou sistema feito sob medida para o seu negócio, sem template genérico. Conta pra gente o que você precisa.',
      href: '#contato',
      hrefLabel: 'Falar sobre o projeto →'
    }
  }
];
