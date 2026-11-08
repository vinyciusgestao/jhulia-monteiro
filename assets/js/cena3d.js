// Jhulia Monteiro: cenas 3D (three.js)
// 1. Topo: poeira dourada em profundidade, que reage ao mouse.
// 2. Seção "Compromisso": a medalha JM em cobre, com o logo em relevo, girando e seguindo o mouse.
// Cada cena só desenha quando está na tela; com "reduzir movimento" desenha um quadro parado.

import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';

const COBRE = new THREE.Color('#d9a46f');
const LOGO = 'assets/img/logo-512.png';

function renderizador(canvasPai, alpha = true) {
  const r = new THREE.WebGLRenderer({ antialias: true, alpha, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 640 ? 1.5 : 2));
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.05;
  canvasPai.appendChild(r.domElement);
  r.domElement.setAttribute('aria-hidden', 'true');
  return r;
}

// laço que só roda com a cena visível e a aba aberta
function laco(el, quadro, reduzir) {
  let visivel = false, id = 0, t0 = performance.now();
  const tick = t => { quadro((t - t0) / 1000); if (visivel && !document.hidden && !reduzir) id = requestAnimationFrame(tick); };
  const ligar = () => { cancelAnimationFrame(id); if (reduzir) { quadro(0); return; } id = requestAnimationFrame(tick); };
  new IntersectionObserver(([en]) => { visivel = en.isIntersecting; if (visivel) ligar(); else cancelAnimationFrame(id); }, { rootMargin: '100px' }).observe(el);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visivel) ligar(); });
  quadro(0);
}

// mouse suavizado (mola simples): -1..1
function mouseSuave() {
  const alvo = { x: 0, y: 0 }, atual = { x: 0, y: 0 };
  addEventListener('pointermove', e => { alvo.x = (e.clientX / innerWidth) * 2 - 1; alvo.y = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });
  return () => { atual.x += (alvo.x - atual.x) * .06; atual.y += (alvo.y - atual.y) * .06; return atual; };
}

function texturaPonto() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'); const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,240,220,1)'); grad.addColorStop(.25, 'rgba(240,201,160,.9)'); grad.addColorStop(1, 'rgba(240,201,160,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ---------------------------------------------------------------- 1. poeira dourada no topo */
function poeira(el, reduzir) {
  const r = renderizador(el);
  const cena = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(55, 1, .1, 100); cam.position.z = 14;
  const n = innerWidth < 640 ? 260 : 700;
  const pos = new Float32Array(n * 3), vel = new Float32Array(n), tam = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - .5) * 34; pos[i * 3 + 1] = (Math.random() - .5) * 20; pos[i * 3 + 2] = (Math.random() - .5) * 18;
    vel[i] = .15 + Math.random() * .35; tam[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ size: .16, map: texturaPonto(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: COBRE, opacity: .85, sizeAttenuation: true });
  const pts = new THREE.Points(geo, mat); cena.add(pts);

  // dois anéis finos de cobre, girando devagar ao fundo
  const aneis = new THREE.Group();
  [5.6, 7.4].forEach((raio, k) => {
    const a = new THREE.Mesh(new THREE.TorusGeometry(raio, .012, 8, 220), new THREE.MeshBasicMaterial({ color: COBRE, transparent: true, opacity: .22 - k * .07 }));
    a.rotation.x = 1.15 + k * .25; aneis.add(a);
  });
  aneis.position.set(innerWidth < 980 ? 0 : 5.2, .4, -2); cena.add(aneis);

  const tam2 = () => { const w = el.clientWidth, h = el.clientHeight; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  tam2(); addEventListener('resize', tam2);
  const mouse = mouseSuave();
  let ultimo = 0;
  laco(el, t => {
    const dt = Math.min(.05, t - ultimo); ultimo = t;
    const p = geo.attributes.position.array;
    for (let i = 0; i < n; i++) {
      p[i * 3 + 1] += vel[i] * dt * .6;
      p[i * 3] += Math.sin(t * .3 + i) * dt * .05;
      if (p[i * 3 + 1] > 10) p[i * 3 + 1] = -10;
    }
    geo.attributes.position.needsUpdate = true;
    const m = mouse();
    cam.position.x = m.x * 1.2; cam.position.y = -m.y * .8; cam.lookAt(0, 0, 0);
    aneis.rotation.z = t * .05; aneis.rotation.y = Math.sin(t * .2) * .15;
    r.render(cena, cam);
  }, reduzir);
}

/* ---------------------------------------------------------------- 2. medalha JM em cobre */
async function medalha(el, reduzir) {
  const img = await new Promise((ok, erro) => { const i = new Image(); i.onload = () => ok(i); i.onerror = erro; i.src = LOGO; });
  // mapas a partir do logo: as letras cobre viram metal polido e relevo; o fundo marrom, metal escovado
  const S = 1024, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d'); g.drawImage(img, 0, 0, S, S);
  const dados = g.getImageData(0, 0, S, S); const d = dados.data;
  const mc = document.createElement('canvas'); mc.width = mc.height = S; const mg = mc.getContext('2d'); const md = mg.createImageData(S, S);
  for (let i = 0; i < d.length; i += 4) {
    const letra = d[i] > 150 && d[i + 1] > 105 ? 255 : 40;   // cobre claro = letra
    md.data[i] = md.data[i + 1] = md.data[i + 2] = letra; md.data[i + 3] = 255;
  }
  mg.putImageData(md, 0, 0);
  const cor = new THREE.CanvasTexture(cv); cor.colorSpace = THREE.SRGBColorSpace; cor.anisotropy = 8;
  const mascara = new THREE.CanvasTexture(mc);
  // rugosidade: letras lisas (escuro = liso), fundo mais áspero
  const rc = document.createElement('canvas'); rc.width = rc.height = S; const rg = rc.getContext('2d');
  rg.filter = 'invert(1)'; rg.drawImage(mc, 0, 0); const rugosidade = new THREE.CanvasTexture(rc);

  const r = renderizador(el);
  const cena = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(r);
  cena.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  const cam = new THREE.PerspectiveCamera(32, 1, .1, 50); cam.position.set(0, 0, 6.2);
  const luz = new THREE.DirectionalLight('#ffe2c0', 2.2); luz.position.set(3, 4, 5); cena.add(luz);
  const luz2 = new THREE.PointLight('#d9a46f', 30, 20); luz2.position.set(-4, -2, 3); cena.add(luz2);

  const face = new THREE.MeshStandardMaterial({ map: cor, metalness: .55, metalnessMap: mascara, roughness: .55, roughnessMap: rugosidade,
    bumpMap: mascara, bumpScale: 2.2, color: '#ffffff' });
  const lateral = new THREE.MeshStandardMaterial({ color: '#c98d5a', metalness: 1, roughness: .26 });
  const moeda = new THREE.Group();
  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, .16, 160, 1), [lateral, face, face]);
  corpo.rotation.x = Math.PI / 2;
  // as tampas do cilindro trazem o logo de lado: gira a textura para ele ficar de pé
  cor.center.set(.5, .5); cor.rotation = Math.PI / 2; mascara.center.set(.5, .5); mascara.rotation = Math.PI / 2;
  rugosidade.center.set(.5, .5); rugosidade.rotation = Math.PI / 2;
  moeda.add(corpo);
  const aro = new THREE.Mesh(new THREE.TorusGeometry(1.5, .07, 24, 200), lateral); moeda.add(aro);
  const aro2 = aro.clone(); aro2.position.z = 0; moeda.add(aro2);
  cena.add(moeda);

  // faíscas orbitando a medalha
  const n = 120, pos = new Float32Array(n * 3), ang = new Float32Array(n), rad = new Float32Array(n), alt = new Float32Array(n);
  for (let i = 0; i < n; i++) { ang[i] = Math.random() * Math.PI * 2; rad[i] = 2 + Math.random() * 1.1; alt[i] = (Math.random() - .5) * 2.4; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: .07, map: texturaPonto(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: COBRE }));
  cena.add(pts);

  const tam = () => { const w = el.clientWidth, h = el.clientHeight; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  tam(); addEventListener('resize', tam);
  const mouse = mouseSuave();
  el.classList.add('webgl');

  // a rolagem pela seção dá meia volta extra na medalha
  let rolagem = 0;
  const lerRolagem = () => { const b = el.getBoundingClientRect(); rolagem = 1 - (b.top + b.height / 2) / (innerHeight + b.height / 2); };
  addEventListener('scroll', lerRolagem, { passive: true }); lerRolagem();

  laco(el, t => {
    const m = mouse();
    moeda.rotation.y = (reduzir ? -.35 : Math.sin(t * .55) * .55 + rolagem * Math.PI) + m.x * .35;
    moeda.rotation.x = (reduzir ? .12 : Math.sin(t * .4) * .12) + m.y * .25;
    moeda.position.y = reduzir ? 0 : Math.sin(t * .9) * .08;
    const p = geo.attributes.position.array;
    for (let i = 0; i < n; i++) {
      const a = ang[i] + t * (.15 + (i % 7) * .02);
      p[i * 3] = Math.cos(a) * rad[i]; p[i * 3 + 1] = alt[i] + Math.sin(t + i) * .1; p[i * 3 + 2] = Math.sin(a) * rad[i] * .6;
    }
    geo.attributes.position.needsUpdate = true;
    r.render(cena, cam);
  }, reduzir);
}

export function iniciar({ reduzir }) {
  const fundo = document.querySelector('[data-3d="poeira"]');
  if (fundo) poeira(fundo, reduzir);
  const md = document.querySelector('[data-3d="medalha"]');
  if (md) medalha(md, reduzir).catch(e => console.warn('medalha 3D', e));
}
