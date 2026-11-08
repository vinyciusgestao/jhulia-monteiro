// Jhulia Monteiro: carregamento, aviso de cookies (LGPD) e Google Analytics só com consentimento.

// ---------------------------------------------------------------- Google Analytics 4
// Cole aqui o ID da propriedade (ex.: 'G-ABC123XYZ'). Vazio = nenhum script de análise é carregado.
const GA_ID = '';

const CHAVE = 'jm-cookies';   // 'aceito' ou 'recusado', guardado só neste navegador

function ler() { try { return localStorage.getItem(CHAVE); } catch { return null; } }
function gravar(v) { try { localStorage.setItem(CHAVE, v); } catch { /* modo privado: vale só nesta visita */ } }

function carregarAnalytics() {
  if (!GA_ID || window.gtag) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { anonymize_ip: true });
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
  document.head.append(s);
}

function avisoCookies() {
  // sem ID do Analytics o site não grava cookies: não há o que pedir, então o aviso e o link ficam escondidos
  document.querySelectorAll('[data-cookies-abrir]').forEach(el => { el.hidden = !GA_ID; });
  if (!GA_ID) return;
  const box = document.querySelector('[data-cookies]');
  const escolha = ler();
  if (escolha === 'aceito') carregarAnalytics();
  if (!box || escolha) return;
  box.hidden = false;
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-cookies-escolha]');
    if (!b) return;
    const v = b.dataset.cookiesEscolha;
    gravar(v);
    box.hidden = true;
    if (v === 'aceito') carregarAnalytics();
  });
}

// "Preferências de cookies" no rodapé reabre o aviso
document.addEventListener('click', e => {
  const a = e.target.closest('[data-cookies-abrir]');
  if (!a) return;
  e.preventDefault();
  try { localStorage.removeItem(CHAVE); } catch { /* sem armazenamento */ }
  const box = document.querySelector('[data-cookies]');
  if (box) { box.hidden = false; box.querySelector('button')?.focus(); }
});

// ---------------------------------------------------------------- carregamento
function pronto() { document.documentElement.classList.remove('is-loading'); document.documentElement.classList.add('is-loaded'); }
if (document.readyState === 'complete') pronto(); else window.addEventListener('load', pronto, { once: true });
setTimeout(pronto, 6000);   // nunca prende o visitante: some em 6 s de qualquer forma

avisoCookies();
