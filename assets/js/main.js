// Jhulia Monteiro: interações e animações da página.
// Tudo respeita "reduzir movimento": nesse caso o conteúdo aparece pronto, sem deslocamentos.

const html = document.documentElement;
const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ponteiroFino = matchMedia('(hover: hover) and (pointer: fine)').matches;
html.classList.remove('sem-js');
html.classList.add(reduzir ? 'reduzir' : 'anim');

/* ---------------------------------------------------------------- cabeçalho e menu */
const topo = document.querySelector('.topo');
const solido = topo?.classList.contains('topo--solido');
const aoRolar = () => { if (!solido) topo?.classList.toggle('rolou', scrollY > 24); };
addEventListener('scroll', aoRolar, { passive: true });
aoRolar();

const botaoMenu = document.querySelector('.botao-menu');
const menu = document.querySelector('.menu');
const fecharMenu = () => { menu?.classList.remove('aberto'); botaoMenu?.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; };
botaoMenu?.addEventListener('click', () => {
  const abrir = !menu.classList.contains('aberto');
  menu.classList.toggle('aberto', abrir);
  botaoMenu.setAttribute('aria-expanded', String(abrir));
  document.body.style.overflow = abrir ? 'hidden' : '';
});
menu?.addEventListener('click', e => { if (e.target.closest('a')) fecharMenu(); });
addEventListener('keydown', e => { if (e.key === 'Escape') fecharMenu(); });
addEventListener('resize', () => { if (innerWidth > 980) fecharMenu(); });

/* ---------------------------------------------------------------- revelar ao rolar */
const revelar = [...document.querySelectorAll('[data-revelar]')];
if (!reduzir && 'IntersectionObserver' in window) {
  // irmãos que entram juntos aparecem em cascata (60 ms)
  revelar.forEach(el => {
    const irmaos = [...el.parentElement.children].filter(c => c.hasAttribute('data-revelar'));
    const i = irmaos.indexOf(el);
    if (i > 0) el.style.setProperty('--atraso', Math.min(i, 6) * 70 + 'ms');
  });
  const io = new IntersectionObserver(ents => ents.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('visto'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: .12 });
  revelar.forEach(el => io.observe(el));
  setTimeout(() => revelar.forEach(el => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('visto'); }), 2500);
} else {
  revelar.forEach(el => el.classList.add('visto'));
}

/* ---------------------------------------------------------------- entrada do topo (GSAP) */
const gsap = window.gsap;
if (gsap && !reduzir && document.querySelector('.hero')) {
  const ScrollTrigger = window.ScrollTrigger;
  if (ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  html.classList.remove('pre');   // antes de montar a animação: o GSAP lê o estado final do CSS
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from('[data-intro="titulo"] .linha > span', { yPercent: 110, duration: 1.1, stagger: .09 })
    .from('[data-intro="texto"]', { y: 24, opacity: 0, duration: .9, stagger: .08 }, '-=.75')
    .from('.retrato', { y: 40, opacity: 0, scale: .96, duration: 1.3 }, 0.1)
    .from('.retrato__anel', { scale: .9, opacity: 0, duration: 1.4 }, .35)
    .from('.retrato__cartao', { x: -24, opacity: 0, duration: .9 }, .7);
  // em aparelho lento, a entrada nunca passa de 2,5 s: o conteúdo aparece pronto
  setTimeout(() => { if (tl.progress() < 1) tl.progress(1); }, 2500);

  if (ScrollTrigger) {
    // retrato desliza devagar com a rolagem (parallax leve)
    gsap.to('.retrato__moldura img', { yPercent: 6, scale: 1.06, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    // linha do tempo: a linha se desenha conforme a rolagem
    const linha = document.querySelector('.passos__linha i');
    if (linha) gsap.fromTo(linha, { scaleY: 0 }, { scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: '.passos', start: 'top 70%', end: 'bottom 60%', scrub: .6 } });
    gsap.utils.toArray('.passo').forEach(p => {
      gsap.from(p.querySelector('.passo__n'), { scale: .4, opacity: 0, duration: .7, ease: 'back.out(2)',
        scrollTrigger: { trigger: p, start: 'top 78%' } });
    });

    // frase de direitos: as palavras acendem conforme a rolagem
    const frase = document.querySelector('.frase');
    if (frase) {
      const palavras = [...frase.querySelectorAll('.p')];
      ScrollTrigger.create({ trigger: frase, start: 'top 80%', end: 'bottom 45%', scrub: true,
        onUpdate: s => { const n = Math.round(s.progress * palavras.length); palavras.forEach((w, i) => w.classList.toggle('on', i < n)); } });
    }
  }
}
if (gsap && !reduzir && !document.querySelector('.hero')) {
  // páginas internas: só a linha do tempo/frase não existem; nada a animar além do revelar
}
html.classList.remove('pre');
// sem GSAP (ou reduzir movimento): a linha fica cheia e a frase acesa
if (!gsap || reduzir) document.querySelectorAll('.frase .p').forEach(w => w.classList.add('on'));

/* ---------------------------------------------------------------- frase: separa as palavras (feito antes do GSAP ler) */
// (as palavras já vêm separadas no HTML para funcionar sem JavaScript)

/* ---------------------------------------------------------------- números que sobem */
const numeros = document.querySelectorAll('[data-contar]');
const contar = el => {
  const alvo = +el.dataset.contar; const suf = el.dataset.sufixo || '';
  if (reduzir) { el.textContent = alvo + suf; return; }
  const t0 = performance.now(), dur = 1400;
  const passo = t => { const k = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - k, 4);
    el.textContent = Math.round(alvo * e) + suf; if (k < 1) requestAnimationFrame(passo); };
  requestAnimationFrame(passo);
};
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(ents => ents.forEach(en => { if (en.isIntersecting) { contar(en.target); io.unobserve(en.target); } }), { threshold: .6 });
  numeros.forEach(n => io.observe(n));
}

/* ---------------------------------------------------------------- cartões com inclinação 3D */
if (ponteiroFino && !reduzir) {
  document.querySelectorAll('.area').forEach(c => {
    let raf = 0;
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        c.classList.add('ativo');
        c.style.setProperty('--ry', ((x - .5) * 12).toFixed(2) + 'deg');
        c.style.setProperty('--rx', ((.5 - y) * 10).toFixed(2) + 'deg');
        c.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        c.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
    });
    c.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf);
      c.classList.remove('ativo');
      c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg');
    });
  });
}

/* ---------------------------------------------------------------- WhatsApp fixo: aparece depois do topo, some no fim */
const fixos = document.querySelectorAll('.whats-fixo, .barra-whats');
const ctaTopo = document.querySelector('[data-cta-topo]');
const final = document.querySelector('#contato');
if (fixos.length) {
  let topoVisivel = !!ctaTopo, finalVisivel = false;
  const atualizar = () => fixos.forEach(f => {
    const mostrar = !topoVisivel && !finalVisivel;
    f.classList.toggle('visivel', mostrar);
    f.inert = !mostrar;
  });
  if ('IntersectionObserver' in window) {
    if (ctaTopo) new IntersectionObserver(([en]) => { topoVisivel = en.isIntersecting; atualizar(); }).observe(ctaTopo);
    if (final) new IntersectionObserver(([en]) => { finalVisivel = en.isIntersecting; atualizar(); }, { threshold: .15 }).observe(final);
  }
  atualizar();
}

/* ---------------------------------------------------------------- 3D (three.js): carrega depois da página, sem atrasar nada */
const temWebGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })();
if (temWebGL && document.querySelector('[data-3d]')) {
  const carregar = () => import('./cena3d.js').then(m => m.iniciar({ reduzir })).catch(e => console.warn('3D indisponível', e));
  if (document.readyState === 'complete') setTimeout(carregar, 50); else addEventListener('load', () => setTimeout(carregar, 50), { once: true });
}
