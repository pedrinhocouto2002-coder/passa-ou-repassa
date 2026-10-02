/* =========================================================
   PASSA OU REPASSA — script da landing page (vanilla JS)
   ========================================================= */

/* ============================================================
   CONFIGURAÇÃO — edite somente este bloco
   ============================================================ */
const CONFIG = {
  // META PIXEL: cole aqui o ID do seu Pixel (somente números). Vazio = Pixel desligado.
  META_PIXEL_ID: '28002457099450078',

  // LINKS DE CHECKOUT DA CACTO — substitua pelos links reais.
  CHECKOUT: {
    '990': 'https://pay.cakto.com.br/34a57t6_1166172',
    '1490': 'https://pay.cakto.com.br/ux5pk5e',
  },

  // Repassa UTMs / fbclid da URL da página para o link do checkout (ajuda na atribuição).
  FORWARD_QUERY_PARAMS: true,

  // TRACKING SERVER-SIDE (CAPI) — opcional.
  // URL de um endpoint seu (ex.: função serverless / GTM server) que recebe os eventos
  // via POST JSON e repassa para a Conversions API da Meta usando o mesmo event_id.
  SERVER_EVENTS_ENDPOINT: '',
};

const OFFERS = {
  '990': { value: 9.90, name: 'Passa ou Repassa — Kit Básico', id: 'por-kit-basico' },
  '1490': { value: 14.90, name: 'Passa ou Repassa — Kit Completo', id: 'por-kit-completo' },
};
const PRODUCT = { name: 'Passa ou Repassa', id: 'passa-ou-repassa', currency: 'BRL' };

/* ============================================================
   TRACKING
   Eventos: PageView (carregamento), ViewContent (ao ver as cartas
   ou dar play no vídeo, 1x), InitiateCheckout (clique em um CTA
   de oferta). Purchase NÃO é disparado aqui — deve ser registrado
   pela Cakto após o pagamento confirmado.
   ============================================================ */
const Track = (() => {
  const dl = (window.dataLayer = window.dataLayer || []);
  const sent = new Set();

  function loadPixel(id) {
    /* Código base oficial do Meta Pixel */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', id);
  }

  function eventId(name) {
    const rnd = (crypto.randomUUID && crypto.randomUUID()) || (Date.now().toString(36) + Math.random().toString(36).slice(2));
    return `${name}.${rnd}`;
  }

  function getCookie(n) {
    const m = document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : undefined;
  }

  function server(name, id, params) {
    if (!CONFIG.SERVER_EVENTS_ENDPOINT) return;
    const body = JSON.stringify({
      event_name: name, event_id: id, event_time: Math.floor(Date.now() / 1000),
      event_source_url: location.href, action_source: 'website',
      user_data: { fbp: getCookie('_fbp'), fbc: getCookie('_fbc'), client_user_agent: navigator.userAgent },
      custom_data: params,
    });
    try {
      if (navigator.sendBeacon) navigator.sendBeacon(CONFIG.SERVER_EVENTS_ENDPOINT, new Blob([body], { type: 'application/json' }));
      else fetch(CONFIG.SERVER_EVENTS_ENDPOINT, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } });
    } catch (e) { /* tracking nunca deve quebrar a página */ }
  }

  function send(name, params = {}, { once = false } = {}) {
    if (once && sent.has(name)) return null;
    sent.add(name);
    const id = eventId(name);
    if (window.fbq) window.fbq('track', name, params, { eventID: id });
    dl.push({ event: name, event_id: id, ...params });
    server(name, id, params);
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') console.info('[track]', name, params, id);
    return id;
  }

  function init() {
    if (CONFIG.META_PIXEL_ID) loadPixel(CONFIG.META_PIXEL_ID);
    send('PageView');
  }

  return { init, send };
})();

/* ============================================================
   CHECKOUT (CTAs de oferta)
   ============================================================ */
function checkoutUrl(offerKey) {
  const raw = CONFIG.CHECKOUT[offerKey];
  if (!raw || raw.startsWith('[')) return null;
  if (!CONFIG.FORWARD_QUERY_PARAMS) return raw;
  try {
    const url = new URL(raw);
    const here = new URLSearchParams(location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'src', 'sck']
      .forEach(k => { if (here.has(k) && !url.searchParams.has(k)) url.searchParams.set(k, here.get(k)); });
    return url.toString();
  } catch (e) { return raw; }
}

function initCheckoutButtons() {
  document.querySelectorAll('[data-offer]').forEach(btn => {
    const key = btn.dataset.offer;
    const url = checkoutUrl(key);
    if (url) btn.href = url;

    btn.addEventListener('click', ev => {
      const offer = OFFERS[key];
      Track.send('InitiateCheckout', {
        value: offer.value, currency: PRODUCT.currency,
        content_name: offer.name, content_ids: [offer.id], content_type: 'product', num_items: 1,
      });

      if (!url) {
        ev.preventDefault();
        toast(`Link de checkout ainda não configurado (${offer.value.toFixed(2).replace('.', ',')}). Edite CONFIG.CHECKOUT em script.js.`);
        return;
      }
      // Abrir em nova aba (Ctrl/Cmd/clique do meio): segue o comportamento padrão.
      if (ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.button === 1) return;
      // Pequena espera para o Pixel enviar o evento antes de sair da página.
      ev.preventDefault();
      setTimeout(() => { location.href = url; }, 180);
    });
  });
}

/* ============================================================
   UI
   ============================================================ */
let toastTimer;
function toast(msg) {
  const el = document.querySelector('[data-toast]');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 4200);
}

function onVisible(el, cb, opts = { threshold: 0.35 }) {
  if (!el) return;
  if (!('IntersectionObserver' in window)) { cb(); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { cb(); io.disconnect(); } });
  }, opts);
  io.observe(el);
}

function viewContent() {
  Track.send('ViewContent', {
    content_name: PRODUCT.name, content_ids: [PRODUCT.id], content_type: 'product', currency: PRODUCT.currency,
  }, { once: true });
}

// Rolagem suave dos links internos (hero, CTA intermediário, barra fixa) sem alterar o #hash da URL:
// a troca de hash faz o Meta Pixel registrar PageViews extras.
function initScrollLinks() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('a[data-scroll]').forEach(a => {
    a.addEventListener('click', ev => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      ev.preventDefault();
      target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    });
  });
}

function initRail() {
  const track = document.querySelector('.rail__track');
  if (!track) return;
  const step = () => (track.querySelector('li')?.getBoundingClientRect().width || 180) * 2 + 28;
  document.querySelector('[data-rail-prev]')?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  document.querySelector('[data-rail-next]')?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
}

function initZoom() {
  const dlg = document.getElementById('zoom');
  if (!dlg || typeof dlg.showModal !== 'function') return;
  const img = document.getElementById('zoom-img');
  const cap = document.getElementById('zoom-cap');
  document.querySelectorAll('[data-zoom]').forEach(btn => {
    btn.addEventListener('click', () => {
      img.src = btn.dataset.zoom;
      img.alt = btn.querySelector('img')?.alt || '';
      cap.innerHTML = btn.dataset.caption || '';
      dlg.showModal();
    });
  });
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
}

function initVideo() {
  const video = document.getElementById('demo-video');
  if (!video) return;
  const frame = video.closest('.video__frame');
  const playBtn = frame.querySelector('[data-play]');
  const soundBtn = frame.querySelector('[data-sound]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const play = () => {
    video.play().then(() => frame.classList.add('is-playing')).catch(() => frame.classList.remove('is-playing'));
  };
  video.addEventListener('pause', () => frame.classList.remove('is-playing'));
  video.addEventListener('play', () => { frame.classList.add('is-playing'); viewContent(); });

  playBtn.addEventListener('click', play);
  video.addEventListener('click', () => (video.paused ? play() : video.pause()));

  soundBtn.addEventListener('click', e => {
    e.stopPropagation();
    video.muted = !video.muted;
    soundBtn.setAttribute('aria-pressed', String(!video.muted));
    soundBtn.querySelector('span').textContent = video.muted ? 'Ativar som' : 'Som ativado';
    if (video.paused) play();
  });

  // Autoplay SEM áudio quando o vídeo aparece na tela; pausa quando sai.
  if ('IntersectionObserver' in window && !reduced) {
    new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { video.preload = 'auto'; play(); }
        else if (!video.paused) video.pause();
      });
    }, { threshold: 0.55 }).observe(video);
  }
}

function initSticky() {
  const bar = document.querySelector('[data-sticky]');
  if (!bar || !('IntersectionObserver' in window)) return;
  const hero = document.querySelector('.hero');
  const blockers = [document.querySelector('.mid-cta'), document.getElementById('ofertas'), document.querySelector('.offer-final'), document.querySelector('.final'), document.querySelector('.footer')];
  const state = { heroVisible: true, blocked: new Set() };
  const update = () => {
    const show = !state.heroVisible && state.blocked.size === 0;
    bar.classList.toggle('is-visible', show);
    bar.setAttribute('aria-hidden', String(!show));
    bar.querySelector('a').tabIndex = show ? 0 : -1;
  };
  new IntersectionObserver(([e]) => { state.heroVisible = e.isIntersecting; update(); }, { threshold: 0 }).observe(hero);
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { e.isIntersecting ? state.blocked.add(e.target) : state.blocked.delete(e.target); });
    update();
  }, { threshold: 0.05 });
  blockers.forEach(b => b && io.observe(b));
}

function initProof() {
  // Mostra a seção de prova social somente quando houver itens reais.
  const sec = document.getElementById('prova-social');
  if (sec && sec.querySelector('.proof-item')) sec.hidden = false;
}

function initReveal() {
  if (!('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('js');
  const els = document.querySelectorAll('.step, .benefit, .offer');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => { el.classList.add('reveal'); io.observe(el); });
}

/* ============================================================
   INIT
   ============================================================ */
Track.init();
initCheckoutButtons();
initScrollLinks();
initRail();
initZoom();
initVideo();
initSticky();
initProof();
initReveal();
onVisible(document.getElementById('cartas'), viewContent, { threshold: 0.3 });
document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
