# Site da Zoo — Estúdio de Sites

Site institucional de uma página só (one-page), sem backend e sem banco de dados. Só HTML, CSS e JavaScript puro — abre em qualquer navegador, sem precisar instalar nada.

## Arquivos

| Arquivo | O que tem dentro |
|---|---|
| `index.html` | Todo o texto e a estrutura das seções (header, hero, serviços, processo, projetos, depoimentos, entregáveis, FAQ, contato, rodapé) |
| `style.css` | Toda a parte visual: cores, fontes, espaçamentos e o ajuste para celular/tablet |
| `script.js` | O menu mobile (abre/fecha) e o destaque do link ativo no menu enquanto rola a página |

Os três arquivos precisam ficar sempre na mesma pasta, porque o `index.html` carrega os outros dois por referência (`<link href="style.css">` e `<script src="script.js">`).

## O que ainda é placeholder (trocar antes de publicar)

- **WhatsApp**: hoje aponta pro número fictício `5581900000000`. Aparece em 2 lugares no `index.html` — procure por `wa.me`.
- **CNPJ e endereço**: no rodapé, com valores fictícios (`00.000.000/0001-00`). Procure por `CNPJ` no `index.html`.
- **6 projetos de portfólio** e **3 depoimentos**: são exemplos fictícios pra preencher o layout. Trocar pelos primeiros clientes reais assim que existirem — apresentar case fictício como se fosse real é o oposto de credibilidade.
- **E-mail** já está correto: `koalasuporte@gmail.com`.

## Como editar o essencial

- **Trocar um texto**: abra o `index.html`, procure o texto (Ctrl+F) e edite direto — não precisa saber programar pra isso.
- **Trocar uma cor**: abra o `style.css`, vá até o topo do arquivo (bloco `:root`) e troque o valor da cor ali. Como todo o site usa essas variáveis, a cor muda em tudo de uma vez.
- **Adicionar um projeto novo no portfólio**: copie um bloco `<div class="project-card">...</div>` inteiro (tem 6 no arquivo) e edite o texto de dentro.

## Como publicar

Como é um site estático (sem backend), pode subir em qualquer serviço de hospedagem simples: Hostinger, Vercel, Netlify ou GitHub Pages. É só enviar os 3 arquivos — não precisa de configuração de servidor.