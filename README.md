# Landing page — Passa ou Repassa

HTML + CSS + JavaScript puro. Sem build, sem framework. É só subir a pasta inteira para qualquer hospedagem estática (Vercel, Netlify, Hostinger, GitHub Pages...).

```
index.html      → conteúdo da página
style.css       → visual (mobile-first)
script.js       → configuração, tracking e interações
assets/img/     → imagens (cartas e páginas renderizadas dos PDFs reais, fotos, prints de prova social) em WebP
assets/video/   → vídeo demonstrativo comprimido + poster
```

## Ordem da página

Hero → Cartas reais (uma por série) → Vídeo → Como funciona → Para quais turmas (1º ao 8º ano) + CTA intermediário → Prova social → Ofertas + páginas reais do material → Benefícios → Oferta final → FAQ → CTA final.

## Ofertas

| Opção | Preço | Conteúdo | Link (`CONFIG.CHECKOUT`) |
|---|---|---|---|
| Kit Básico | R$9,90 | 20 cartas do Passa ou Repassa · Garantia de 7 dias | `990` → `https://pay.cakto.com.br/34a57t6_1166172` |
| Kit Completo | R$14,90 | Passa ou Repassa completo (144 cartas) + 6 extras: Kit de Dinâmicas, Caixa das Perguntas, Fichas de Leitura, Gêneros Textuais, Sequência Didática — A Bela Adormecida, Troca Mágica do 10 · Garantia de 7 dias · Acesso digital vitalício | `1490` → `https://pay.cakto.com.br/ux5pk5e` |

Se o conteúdo de uma oferta mudar, atualize também: a faixa acima das ofertas (`.diff`), a oferta final (`.ofinal__desc`) e a pergunta do FAQ "Qual a diferença entre R$9,90 e R$14,90?".

## Configuração (`script.js`, bloco `CONFIG`)

1. **Links da Cakto**: já configurados (tabela acima). Para trocar, edite `CONFIG.CHECKOUT`.
2. **Meta Pixel**: já configurado (`28002457099450078`). Para trocar, edite `META_PIXEL_ID`.
3. **og:image** em `index.html`: troque pelo endereço absoluto depois de publicar.

## Eventos de tracking

| Evento | Quando dispara | Parâmetros |
|---|---|---|
| `PageView` | ao carregar a página | — |
| `ViewContent` | 1x, quando a pessoa vê a galeria de cartas ou dá play no vídeo | `content_name`, `content_ids`, `currency: BRL` |
| `InitiateCheckout` | clique em qualquer botão de oferta | `value: 9.90` ou `14.90`, `currency: BRL`, `content_name`, `content_ids` |

- **Purchase não é disparado na página.** Configure o Purchase na Cakto (Pixel/integração dela) para registrar só pagamento confirmado.
- Todo evento leva um `eventID` único. Ele serve para deduplicar com a Conversions API.
- Os eventos também vão para `window.dataLayer`, se você usar o Google Tag Manager.
- **CAPI / server-side**: preencha `SERVER_EVENTS_ENDPOINT` com a URL do seu endpoint (função serverless, GTM server etc.). A página envia via POST JSON: `event_name`, `event_id`, `event_time`, `event_source_url`, `user_data` (fbp, fbc, user agent) e `custom_data`. O endpoint repassa para a Meta com o mesmo `event_id`.
- Com `FORWARD_QUERY_PARAMS: true`, as UTMs e o `fbclid` da URL do anúncio vão junto no link da Cakto.
- Os botões que rolam a página (hero, CTA intermediário, barra fixa) usam rolagem por JavaScript sem alterar o `#` da URL, para não gerar PageViews extras no Pixel.

## Prova social

A seção `#prova-social` fica antes das ofertas e está ativa com 3 prints de WhatsApp (`assets/img/provas/print-01.webp` a `print-03.webp`). As fotos de perfil foram borradas por privacidade. Abaixo dos prints há a legenda: "Mensagens de clientes. Algumas fotos mostram uma versão anterior do design das cartas."

Para adicionar mais:

1. Coloque a imagem em `assets/img/provas/` (WebP de ~600px de largura é o ideal).
2. Em `index.html`, dentro de `.proof__grid`, duplique um bloco `<figure class="proof-item proof-item--shot">`.

Para esconder a seção, adicione o atributo `hidden` na tag `<section id="prova-social" ...>`; ela deixa de ocupar espaço. Com `hidden`, o script só volta a exibi-la se houver pelo menos um `.proof-item`. Use apenas provas sociais reais.

## Itens para confirmar

- **FAQ "Como faço a compra?"**: ajuste o texto com a forma real de entrega configurada na Cakto (e-mail, área de membros, WhatsApp...).

## Rodar localmente

Qualquer servidor estático serve, por exemplo:

```bash
npx serve .
```
