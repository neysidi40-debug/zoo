/* ============================================================
   ZOO — Estúdio de Sites
   Arquivo de comportamento (interatividade do site)
   ============================================================
   Este arquivo cuida de três coisas simples:

   1) Menu mobile: abre e fecha o menu quando o botão de três
      tracinhos (hambúrguer) é clicado, e fecha sozinho quando
      algum link do menu é clicado.

   2) Destaque do menu ao rolar a página: enquanto o visitante
      rola o site, o link correspondente à seção visível na tela
      (Serviços, Processo, Projetos, Contato) fica destacado no
      menu do topo, pra dar noção de "onde estou" na página.

   3) Animação de entrada ao rolar a página: qualquer elemento
      com a classe "reveal" no HTML aparece com um leve movimento
      de baixo pra cima assim que entra na tela. Pra adicionar
      esse efeito em um elemento novo, basta colocar class="reveal"
      nele no index.html — não precisa mexer neste arquivo.

   Não há coleta de dados nem envio de formulário aqui — é só
   comportamento visual, roda inteiramente no navegador do visitante.
   ============================================================ */

  // Mobile menu toggle
  const menuToggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');
  menuToggle.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    menuToggle.classList.toggle('open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
  });
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      menuToggle.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Abrir menu');
    });
  });

  // Highlight active section link while scrolling
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  if ('IntersectionObserver' in window && sections.length){
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          navLinks.forEach(l => l.style.color = '');
          const active = document.querySelector('.nav-links a[href="#' + entry.target.id + '"]');
          if (active) active.style.color = 'var(--paper)';
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(sec => observer.observe(sec));
  }

  // Reveal elements as they scroll into view
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length){
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target); // anima uma vez só
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => revealObserver.observe(el));
  } else {
    // navegador sem suporte a IntersectionObserver: mostra tudo direto
    revealEls.forEach(el => el.classList.add('is-visible'));
  }