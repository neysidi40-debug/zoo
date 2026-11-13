# Zoo 

<p align="center">
  <img src="https://i.imgur.com/4bshFdI.png" width="100%" alt="">
</p>

Site institucional de uma página só (one-page), sem backend e sem banco de dados. Feito em React com Vite, com componentes do [React Bits](https://reactbits.dev/) e animações em Motion.

## Como rodar

```bash
npm install
```

```bash
npm run dev
```

Abre em `http://localhost:5173`. Para gerar a versão de publicação: `npm run build` (sai na pasta `dist/`).

## Onde fica cada coisa

| Caminho | O que tem dentro |
|---|---|
| `index.html` | Só a casca: título, meta tags, fontes e o `<div id="root">` |
| `src/App.jsx` | A ordem das seções na página |
| `src/components/sections/` | Uma seção por arquivo (Hero, Growth, Process, Services, WorkCarousel, Pricing, Deliverables, Faq, CtaFinal) |
| `src/components/` | Peças compartilhadas: Header, Footer, tela de abertura, entrada ao rolar (`Reveal`), marca-texto (`Ink`), card com holofote (`Card`) |
| `src/data/` | Conteúdo que mais muda: contatos e menu (`site.js`) e os projetos do carrossel (`projects.js`) |
| `src/hooks/` | Tema claro/escuro, morph do header, carrossel arrastável, seleção em marca-texto |
| `src/reactbits/` | Componentes trazidos do reactbits.dev (variante JS + CSS) |
| `src/styles/global.css` | Toda a parte visual: cores, fontes, espaçamentos e o ajuste para celular/tablet |
| `public/` | Logos e os vídeos/capas dos projetos |

## Componentes do React Bits

| Onde | Componente |
|---|---|
| Fundo da hero | `Aurora` |
| Fundo da tela de abertura | `GhostFibers` |
| Botão "Pedir orçamento" da hero | `SpecularButton` |
| Palavra que se reveza no título | `TextType` |
| Letreiro da hero | `LogoLoop` |
| Títulos de seção | `BlurText` |
| Fichas de serviço e planos | `SpotlightCard` |
| Fundo do menu mobile | `FluxLines` |

Os arquivos são os do registro do React Bits, sem alteração — a única exceção é o `BlurText`, que ganhou a prop `as` e suporte a quebra de linha (marcado com `zoo:` no código). Para trazer outro componente: `npx shadcn@latest add https://reactbits.dev/r/<Nome>-JS-CSS` ou copie o código do site para `src/reactbits/`.

## O que ainda é placeholder (trocar antes de publicar)

- **WhatsApp**: número fictício `5581900000000`, em `src/data/site.js`.
- **CNPJ**: valor fictício (`00.000.000/0001-00`), em `src/data/site.js`.
- **Preços**: valores ilustrativos, em `src/components/sections/Pricing.jsx`.

## Como editar o essencial

- **Trocar um texto**: procure o texto (Ctrl+Shift+F) dentro de `src/` e edite direto.
- **Trocar uma cor**: topo do `src/styles/global.css` (bloco `:root` e `html.theme-light`). Todo o site usa essas variáveis.
- **Adicionar um projeto no carrossel**: copie um bloco em `src/data/projects.js` e coloque o vídeo e a capa em `public/projetos/`.

## Como publicar

Vercel e Netlify detectam o Vite sozinhos (comando `npm run build`, pasta `dist`). Em hospedagem simples, envie o conteúdo de `dist/`.

## Arquivos soltos na raiz

`old.mp4`, `zoo dither.png` e `fotos-integrantes/` não são usados pelo site e não entram no build.
