import * as THREE from 'three';
import {
  createCharacterModel, createRockModel, createObstacleModel, createCoinModel,
  createForestChunk, createHillModel,
  stoneTextureURL, groundTextureURL, grassTextureURL,
} from './CustomModels.js';


const CFG = {
  pathWidth: 8, playerLimit: 3.5, playerLateralSpeed: 9,
  speedStart: 10, speedMax: 17, speedGain: 0.15,
  rockRadius: 1.5, rockBaseZ: -4.6,       // la roca queda DETRÁS del personaje
  lanes: [-3.2, -1.6, 0, 1.6, 3.2], maxBlockedLanes: 2,
  spawnZ: 12, despawnZ: -4, spacingStart: 18, spacingMin: 14,
  winCoins: 40,                            // monedas necesarias para ganar
  coinsPerRow: 3,
};

//  REQ-01: Escenario 
const scene = new THREE.Scene();
const skyColor = 0x9ccbea;                 
scene.background = new THREE.Color(skyColor);
scene.fog = new THREE.Fog(skyColor, 60, 200);

const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 400);
// Cámara FRONTAL
camera.position.set(0, 12, 20);
camera.lookAt(0, 1, -2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xdff0ff, 0x4a6a3a, 1.0));
const sun = new THREE.DirectionalLight(0xfff3d6, 1.8);
sun.position.set(8, 16, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 30, bottom: -30, near: 1, far: 60 });
sun.target.position.set(0, 0, 0);
scene.add(sun, sun.target);

const loader = new THREE.TextureLoader();
const LENGTH = 260;
const groundTex = loader.load(groundTextureURL());
groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
groundTex.colorSpace = THREE.SRGBColorSpace;
groundTex.repeat.set(CFG.pathWidth / 8, LENGTH / 8);
groundTex.anisotropy = 8;
const path = new THREE.Mesh(new THREE.PlaneGeometry(CFG.pathWidth, LENGTH),
  new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.95 }));
path.rotation.x = -Math.PI / 2; path.position.z = -100; path.receiveShadow = true;
scene.add(path);


const grassTex = loader.load(grassTextureURL());
grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
grassTex.colorSpace = THREE.SRGBColorSpace;
grassTex.repeat.set(20, LENGTH / 8);
const sideMat = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 });
const wallMat = new THREE.MeshStandardMaterial({ color: 0x7a6a58, roughness: 0.9 });
for (const s of [-1, 1]) {
  const side = new THREE.Mesh(new THREE.PlaneGeometry(160, LENGTH), sideMat);
  side.rotation.x = -Math.PI / 2;
  side.position.set(s * (CFG.pathWidth / 2 + 80), -0.02, -100);
  side.receiveShadow = true;
  const wall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, LENGTH), wallMat);
  wall.position.set(s * (CFG.pathWidth / 2 + 0.2), 0.25, -100);
  wall.castShadow = wall.receiveShadow = true;
  scene.add(side, wall);
}


const FOREST_DENSITY = 3;   
const CHUNK_L = 60, CHUNKS = 4;
const chunks = [];
for (let i = 0; i < CHUNKS; i++) {
  const c = createForestChunk(CHUNK_L, FOREST_DENSITY);
  c.position.z = -190 + i * CHUNK_L;
  scene.add(c);
  chunks.push(c);
}


const hills = [];
function placeHill(h, z) {
  const side = Math.random() < 0.5 ? -1 : 1;
  h.position.set(side * (h.userData.rx + 14 + Math.random() * 35), -0.5, z);
}
for (let i = 0; i < 26; i++) {
  const h = createHillModel();
  placeHill(h, 30 - Math.random() * 290);
  scene.add(h);
  hills.push(h);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

function updateWorld(dt, speed) {
  groundTex.offset.y -= (speed * dt) / 8; // el suelo se aleja de la cámara
  grassTex.offset.y -= (speed * dt) / 8;
  for (const c of chunks) {
    c.position.z -= speed * dt;
    if (c.position.z + CHUNK_L < -190) c.position.z += CHUNKS * CHUNK_L;
  }
  for (const h of hills) {
    h.position.z -= speed * dt * 0.3;
    if (h.position.z < -260) placeHill(h, h.position.z + 290);
  }
}

//  RF02: Personaje 
const char = createCharacterModel();
scene.add(char.root);
const player = { x: 0, vx: 0, time: 0 };

function updatePlayer(dt, input, speed) {
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  player.vx += (dir * CFG.playerLateralSpeed - player.vx) * Math.min(1, dt * 14);
  player.x = THREE.MathUtils.clamp(player.x + player.vx * dt, -CFG.playerLimit, CFG.playerLimit);
  char.root.position.x = player.x;

  player.time += dt * speed * 0.75;
  const s = Math.sin(player.time);
  char.legL.rotation.x = s * 0.9;  char.legR.rotation.x = -s * 0.9;
  char.armL.rotation.x = -s * 0.8; char.armR.rotation.x = s * 0.8;
  char.model.position.y = Math.abs(Math.cos(player.time)) * 0.12;
  char.model.rotation.z = -player.vx * 0.025;
}

// RF03: Roca 
const rock = createRockModel(stoneTextureURL(), CFG.rockRadius);
rock.position.set(0, CFG.rockRadius, CFG.rockBaseZ);
scene.add(rock);
let rockT = 0;

function updateRock(dt, speed) {
  rockT += dt;
  rock.rotation.x += (speed * dt) / CFG.rockRadius; // rueda hacia la cámara (+z)
  rock.position.x += (player.x - rock.position.x) * Math.min(1, dt * 2.5);
  rock.position.z = CFG.rockBaseZ + Math.sin(rockT * 2.2) * 0.35;
  rock.position.y = CFG.rockRadius + Math.abs(Math.sin(rockT * 9)) * 0.06;
}

//  RF04: Obstáculos y monedas 
const obstacles = [];
const coins = [];
let sinceLast = 0, prevFree = 2, coinCount = 0;

function spawnRow() {
  const lanes = CFG.lanes;
  const minF = Math.max(0, prevFree - 2), maxF = Math.min(lanes.length - 1, prevFree + 2);
  const free = minF + Math.floor(Math.random() * (maxF - minF + 1)); // carril siempre libre y alcanzable
  const candidates = lanes.map((_, i) => i).filter(i => i !== free);
  const n = 1 + Math.floor(Math.random() * CFG.maxBlockedLanes);
  for (let k = 0; k < n; k++) {
    const lane = candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0];
    const o = createObstacleModel();
    const sc = 0.85 + Math.random() * 0.45;
    o.scale.setScalar(sc);
    o.rotation.y = Math.random() * Math.PI * 2;
    o.position.set(lanes[lane] + (Math.random() - 0.5) * 0.4, 0, CFG.spawnZ);
    o.userData.radius = 0.8 * sc;
    scene.add(o); obstacles.push(o);
  }
  
  for (let k = 0; k < CFG.coinsPerRow; k++) {
    const c = createCoinModel();
    c.position.set(lanes[free], 1.0, CFG.spawnZ + 3 + k * 2.2);
    scene.add(c); coins.push(c);
  }
  prevFree = free;
}

function updateObstacles(dt, speed, elapsed) {
  sinceLast += speed * dt;
  if (sinceLast >= Math.max(CFG.spacingMin, CFG.spacingStart - elapsed * 0.12)) { sinceLast = 0; spawnRow(); }
  let hit = false;
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.position.z -= speed * dt; // avanza hacia el personaje
    if (o.position.z < CFG.despawnZ) { scene.remove(o); obstacles.splice(i, 1); continue; }
    if (Math.hypot(o.position.x - player.x, o.position.z) < o.userData.radius + 0.4) hit = true;
  }
  return hit;
}


function updateCoins(dt, speed) {
  let won = false;
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    c.position.z -= speed * dt;
    c.rotation.y += dt * 4;                                  // giran
    c.position.y = 1.0 + Math.sin(performance.now() / 250 + i) * 0.08; // flotan
    if (c.position.z < CFG.despawnZ) { scene.remove(c); coins.splice(i, 1); continue; }
    if (Math.hypot(c.position.x - player.x, c.position.z) < 0.8) {
      scene.remove(c); coins.splice(i, 1);
      coinCount++;
      coinsEl.textContent = `Monedas: ${coinCount} / ${CFG.winCoins}`;
      if (coinCount >= CFG.winCoins) won = true;
    }
  }
  return won;
}


const input = { left: false, right: false };
const setKey = (e, v) => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') input.left = v;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') input.right = v;
  if (['ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
};
addEventListener('keydown', e => { setKey(e, true); if (e.code === 'Space' && state !== 'playing') startGame(); });
addEventListener('keyup', e => setKey(e, false));

const overlay = document.getElementById('overlay');
const titleEl = document.getElementById('title');
const subtitleEl = document.getElementById('subtitle');
const promptEl = document.getElementById('prompt');
const scoreEl = document.getElementById('score');
const coinsEl = document.getElementById('coins');
const bestEl = document.getElementById('best');

let state = 'menu', elapsed = 0, distance = 0, speed = CFG.speedStart, best = 0;
try { best = Number(localStorage.getItem('boulderEscapeBest')) || 0; } catch (_) {}
bestEl.textContent = `Récord: ${best} m`;
coinsEl.textContent = `Monedas: 0 / ${CFG.winCoins}`;

function startGame() {
  for (const o of obstacles) scene.remove(o);
  for (const c of coins) scene.remove(c);
  obstacles.length = 0; coins.length = 0;
  sinceLast = CFG.spacingStart - 4; prevFree = 2; coinCount = 0;
  coinsEl.textContent = `Monedas: 0 / ${CFG.winCoins}`;
  player.x = player.vx = player.time = 0;
  rock.rotation.set(0, 0, 0); rock.position.set(0, CFG.rockRadius, CFG.rockBaseZ); rockT = 0;
  elapsed = distance = 0; speed = CFG.speedStart;
  state = 'playing';
  overlay.classList.add('hidden');
}

function endGame(won) {
  state = won ? 'won' : 'over';
  const d = Math.floor(distance);
  if (d > best) { best = d; try { localStorage.setItem('boulderEscapeBest', best); } catch (_) {} }
  bestEl.textContent = `Récord: ${best} m`;
  titleEl.textContent = won ? '¡GANASTE!' : '¡TE ATRAPÓ!';
  subtitleEl.textContent = won
    ? `Juntaste las ${CFG.winCoins} monedas y escapaste de la roca (${d} m)`
    : `Recorriste ${d} m y juntaste ${coinCount} monedas`;
  promptEl.innerHTML = 'Presiona <b>ESPACIO</b> para jugar de nuevo';
  overlay.classList.remove('hidden');
}

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const curSpeed = state === 'playing' ? speed : 4;
  const ended = state === 'over' || state === 'won';

  if (state === 'playing') {
    elapsed += dt;
    speed = Math.min(CFG.speedMax, CFG.speedStart + elapsed * CFG.speedGain);
    distance += speed * dt;
    scoreEl.textContent = `Distancia: ${Math.floor(distance)} m`;
  }
  if (!ended) {
    updatePlayer(dt, state === 'playing' ? input : {}, curSpeed);
    updateRock(dt, curSpeed);
    updateWorld(dt, curSpeed);
  }
  if (state === 'playing') {
    if (updateObstacles(dt, speed, elapsed)) endGame(false);
    else if (updateCoins(dt, speed)) endGame(true);
  }

  camera.position.x += (player.x * 0.5 - camera.position.x) * Math.min(1, dt * 5);
  camera.lookAt(player.x * 0.4, 1, -2);
  renderer.render(scene, camera);
}
animate();