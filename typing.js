/* ============================================================
   ZOO — Efeito de digitação no título da hero
   ============================================================
   "Sites que vendem, não só ____." — a última palavra é apagada e
   redigitada em ciclo com as opções do data-words do .typed-word
   no index.html (máximo 5). Pra trocar as palavras, é só editar lá.

   Leitor de tela: o span animado é aria-hidden; ao lado dele fica
   um .sr-only fixo com a primeira palavra, pra frase ser lida uma
   vez só, sem anunciar cada letra digitada.
   Com "reduzir movimento" ligado, a palavra fica parada.
   ============================================================ */

(() => {
  const el = document.querySelector('.typed-word');
  if (!el) return;

  const words = (el.dataset.words || '')
    .split('|')
    .map(w => w.trim())
    .filter(Boolean)
    .slice(0, 5);
  if (words.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const TYPE_MS  = 85;    // intervalo entre letras digitadas
  const ERASE_MS = 45;    // intervalo entre letras apagadas (apagar é mais rápido)
  const HOLD_MS  = 2200;  // tempo com a palavra completa na tela
  const GAP_MS   = 350;   // pausa com o espaço vazio antes da próxima
  const START_MS = 2400;  // espera o título terminar de surgir + um tempo lendo a 1ª palavra

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  let index = 0;

  async function run(){
    el.textContent = words[0];
    await wait(START_MS);

    while (true){
      // cursor fica sólido enquanto digita/apaga e só pisca parado
      el.classList.add('is-typing');

      for (let n = words[index].length - 1; n >= 0; n--){
        el.textContent = words[index].slice(0, n);
        await wait(ERASE_MS);
      }

      index = (index + 1) % words.length;
      await wait(GAP_MS);

      for (let n = 1; n <= words[index].length; n++){
        el.textContent = words[index].slice(0, n);
        await wait(TYPE_MS);
      }

      el.classList.remove('is-typing');
      await wait(HOLD_MS);
    }
  }

  run();
})();
