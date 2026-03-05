# Portal de Documentos (Mockup)

Mockup em **HTML estático** para pesquisa e exploração de documentos. Sem instalação, sem backend, sem SharePoint nem APIs. Toda a interface em **português de Portugal**. Os documentos são adicionados conforme fores passando a informação.

## Como usar

1. Abre o ficheiro **`index.html`** no browser (duplo clique ou arrastar para o navegador).
2. É necessária ligação à internet na primeira vez (Tailwind e fontes carregam por CDN).

**Não é preciso instalar nada** (nem Node, nem npm).

### Ler e pesquisar dentro dos PDFs

Se abrires o `index.html` diretamente (duplo clique), o navegador abre com o protocolo `file://`. Por segurança, **não permite** que a página carregue outros ficheiros locais (como o PDF na raiz do projeto). Por isso a função "Buscar neste documento" pode falhar.

**Para que a aplicação consiga ler o PDF e permitir pesquisa no texto:**

1. Na pasta do projeto (onde está o `index.html`), abre um terminal.
2. Executa um destes comandos:
   - **Node/npx:** `npx serve .`  
     Depois acede a **http://localhost:3000** no browser.
   - **Python 3:** `python -m http.server 8080`  
     Depois acede a **http://localhost:8080** no browser.
3. Navega até ao documento (ex.: Manual Web EPPO) e usa "Buscar neste documento" — o PDF será lido e poderás pesquisar por palavras no texto.

**Alternativa sem servidor:** Na página do documento, clica em **Editar** e preenche o campo **"Texto para pesquisa (textContent)"** com o texto do manual. A pesquisa no documento passará a usar esse texto em vez do PDF.

## Rotas (hash na URL)

| URL (hash) | Descrição |
|------------|-----------|
| `index.html#/` | Pesquisa de documentos |
| `index.html#/docs/IT-DSI-TICKETBI-V001` | Detalhe de um documento |
| `index.html#/processes` | Listagem de processos |
| `index.html#/processes/ticketbi-dsi` | Documentos de um processo |

## Conteúdo

- **Tailwind CSS** via CDN (estilo corporativo).
- Documentos definidos no próprio HTML; podes ir adicionando mais no array `mockDocuments` conforme fores passando processos e procedimentos.
- Navegação por **hash** (`#/`, `#/docs/:id`, `#/processes`, `#/processes/:nome`).
- UI tipo enterprise: header fixo, cards, badges de estado e categoria (incluindo **DSI**).

## Manuais em PDF (ler/descarregar)

Coloque os PDF na **raiz do projeto** (mesma pasta onde está o `index.html`), com o nome exato esperado:

- Manual Web EPPO: `MA-EPPO-WEB EPPO-V000.pdf`

Na página do documento terá botões para **Abrir manual (nova janela)**, **Descarregar PDF** e um leitor embutido na página.

## Documentos Word (.docx) — previsualização

Coloque os ficheiros .docx na **raiz do projeto** (mesma pasta do `index.html`):

- **Guias de Preparação:** `GUIAS DE PREPARAÇÃO - INFORMAÇÕES PARA DOCUMENTOS.docx`
- **Pagamento de Encomendas MB:** `PAGAMENTO DE ENCOMENDAS COM REFERÊNCIAS MB (Fev.24).docx`
- **TicketBI:** `IT-DSI- CRIAR TICKET NO TICKETBI-V001.docx`

Na página de cada documento, além de "Abrir" e "Descarregar", aparece o botão **"Mostrar previsualização"**, que carrega o .docx e mostra o conteúdo em HTML. **Requer** que a aplicação seja aberta por um servidor local (ex.: `npx serve .`) ou em deploy (ex.: Vercel); com `file://` o browser não consegue carregar o ficheiro.

## Nota sobre servidor local

Se abrir o `index.html` diretamente (protocolo `file://`), alguns browsers bloqueiam o iframe do PDF e o carregamento de .docx. Use um servidor local (ex.: `npx serve .`) para ler PDFs e previsualizar Word na aplicação.

## Deploy no Vercel (GitHub)

Para que os documentos (PDF e .docx) funcionem no Vercel:

1. **Os ficheiros têm de estar na raiz do projeto e ser commitados**  
   Coloque os PDF e .docx **na mesma pasta que o `index.html`** (não dentro de uma subpasta). Assim o Vercel serve cada ficheiro em URLs como `https://seu-projeto.vercel.app/MA-EPPO-WEB%20EPPO-V000.pdf`.  
   - No GitHub, confirme que no repositório aparecem os ficheiros (ex.: `MA-EPPO-WEB EPPO-V000.pdf`, `IT-DSI- CRIAR TICKET NO TICKETBI-V001.docx`) ao lado do `index.html`.  
   - Se não aparecerem: `git add "MA-EPPO-WEB EPPO-V000.pdf" "IT-DSI- CRIAR TICKET NO TICKETBI-V001.docx"` (e os outros), depois `git commit` e `git push`.

2. **Nomes iguais ao código**  
   Os nomes dos ficheiros têm de coincidir exatamente com os `filePath` dos documentos no código (incluindo espaços e acentos).

## Estrutura

- **index.html** — Tudo num só ficheiro: HTML, dados dos documentos e JavaScript. Abre e está pronto.
- **Ficheiros PDF e .docx** — Na mesma pasta que o `index.html` (raiz do projeto), para que o Vercel e o servidor local os sirvam corretamente.
