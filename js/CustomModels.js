import * as THREE from 'three';

function makeCanvas(size, base, variance, specks) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < specks; i++) {
    const v = Math.random() * variance * 2 - variance;
    ctx.fillStyle = v > 0 ? `rgba(255,255,255,${v / 255})` : `rgba(0,0,0,${-v / 255})`;
    const x = Math.random() * size, y = Math.random() * size, r = 2 + Math.random() * 14;
    for (const dx of [-size, 0, size]) for (const dy of [-size, 0, size]) {
      ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2); ctx.fill();
    }
  }
  return { c, ctx };
}

export function stoneTextureURL() {
  const { c, ctx } = makeCanvas(512, '#8a8378', 90, 2500);
  ctx.strokeStyle = 'rgba(30,26,22,0.8)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 14; i++) {
    let x = Math.random() * 512, y = Math.random() * 512;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let k = 0; k < 30; k++) { x += Math.random() * 24 - 12; y += Math.random() * 24 - 12; ctx.lineTo(x, y); }
    ctx.stroke();
  }
  return c.toDataURL('image/png');
}

export function groundTextureURL() {
  const { c, ctx } = makeCanvas(512, '#8a6a4e', 60, 1800);
  ctx.strokeStyle = '#2d231c';
  ctx.lineWidth = 5;
  for (let i = 0; i <= 512; i += 128) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
  }
  return c.toDataURL('image/png');
}

export function grassTextureURL() {
  return makeCanvas(512, '#3f7a35', 45, 2500).c.toDataURL('image/png');
}

// estilo Gojo Satoru
export function createCharacterModel() {
  const root = new THREE.Group();
  const model = new THREE.Group();
  root.add(model);

  const skin = new THREE.MeshStandardMaterial({ color: 0xf6d9c4, roughness: 0.7 });
  const black = new THREE.MeshStandardMaterial({ color: 0x15151c, roughness: 0.8 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x101018, roughness: 0.85 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0xf4f7ff, roughness: 0.6, flatShading: true });
  const gold = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.6, roughness: 0.4 });

  
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.4), black);
  torso.position.y = 1.35;
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.27, 0.22, 14), black);
  collar.position.y = 1.9;
  const buttons = [1.6, 1.4, 1.2].map(y => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), gold);
    b.position.set(0, y, 0.205);
    return b;
  });

  // Cabeza
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 16), skin);
  head.position.y = 2.12;

  // Venda negra sobre los ojos
  const blindfold = new THREE.Mesh(new THREE.CylinderGeometry(0.295, 0.295, 0.14, 24), black);
  blindfold.position.y = 2.12;

  // Cabello blanco
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.42), hairMat);
  cap.position.set(0, 2.12, -0.04);
  const hair = new THREE.Group();
  hair.add(cap);
  const up = new THREE.Vector3(0, 1, 0);
  const spike = (r, h, pos, dir) => {
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), hairMat);
    m.position.copy(pos);
    m.quaternion.setFromUnitVectors(up, dir.clone().normalize());
    hair.add(m);
  };
  for (let i = 0; i < 8; i++) {          
    const a = (i / 8) * Math.PI * 2;
    spike(0.1, 0.42, new THREE.Vector3(Math.cos(a) * 0.17, 2.38, Math.sin(a) * 0.17),
      new THREE.Vector3(Math.cos(a) * 0.7, 1, Math.sin(a) * 0.7));
  }
  for (let i = 0; i < 8; i++) {          
    const a = (i / 8) * Math.PI * 2;
    if (Math.sin(a) > 0.6) continue;
    spike(0.09, 0.36, new THREE.Vector3(Math.cos(a) * 0.25, 2.24, Math.sin(a) * 0.25),
      new THREE.Vector3(Math.cos(a) * 1.3, 0.5, Math.sin(a) * 1.3));
  }
  spike(0.12, 0.55, new THREE.Vector3(0, 2.42, 0), new THREE.Vector3(0, 1, -0.2)); // mechón central
  for (const x of [-0.12, 0, 0.12]) {    // flequillo
    spike(0.07, 0.3, new THREE.Vector3(x, 2.33, 0.2), new THREE.Vector3(x * 2, 0.5, 1));
  }

  
  const limb = (mat, w, h, x, y, endMesh) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), mat);
    m.position.y = -h / 2;
    pivot.add(m);
    if (endMesh) { endMesh.position.y = -h; pivot.add(endMesh); }
    return pivot;
  };
  const hand = () => new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), skin);
  const shoe = () => new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.44), black);
  const armL = limb(black, 0.22, 0.8, -0.47, 1.75, hand());
  const armR = limb(black, 0.22, 0.8, 0.47, 1.75, hand());
  const legL = limb(pantsMat, 0.28, 0.9, -0.18, 0.9, shoe());
  const legR = limb(pantsMat, 0.28, 0.9, 0.18, 0.9, shoe());
  for (const leg of [legL, legR]) leg.children[1].position.z = 0.06;

  model.add(torso, collar, ...buttons, head, blindfold, hair, armL, armR, legL, legR);
  model.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return { root, model, armL, armR, legL, legR };
}

// ---------- Roca ----------
export function createRockModel(texturePath, radius) {
  const tex = new THREE.TextureLoader().load(texturePath);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);

  const geo = new THREE.SphereGeometry(radius, 48, 32);
  const p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    v.multiplyScalar(1 + 0.06 * Math.sin(v.x * 3.1) * Math.cos(v.y * 2.7 + v.z * 2.3));
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 3, roughness: 1 }));
  mesh.castShadow = true;
  return mesh;
}

// 
const bigGeo = new THREE.ConeGeometry(0.6, 2.0, 7).translate(0, 1.0, 0);
const smallGeo = new THREE.ConeGeometry(0.35, 1.2, 6).translate(0, 0.6, 0);
const tipGeo = new THREE.ConeGeometry(0.2, 0.5, 7);
const rockMat = new THREE.MeshStandardMaterial({ color: 0xb7aea0, roughness: 0.8, flatShading: true });
const tipMat = new THREE.MeshStandardMaterial({ color: 0x8c3b2f, roughness: 0.6, flatShading: true });

export function createObstacleModel() {
  const g = new THREE.Group();
  const big = new THREE.Mesh(bigGeo, rockMat);
  const s1 = new THREE.Mesh(smallGeo, rockMat); s1.position.set(0.55, 0, 0.2);
  const s2 = new THREE.Mesh(smallGeo, rockMat); s2.position.set(-0.5, 0, -0.25); s2.scale.setScalar(0.8);
  const tip = new THREE.Mesh(tipGeo, tipMat); tip.position.y = 1.78;
  g.add(big, s1, s2, tip);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

// moneda
const coinGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.08, 24).rotateX(Math.PI / 2); // cara hacia la cámara
const coinRimGeo = new THREE.TorusGeometry(0.34, 0.035, 8, 24);
const coinMat = new THREE.MeshStandardMaterial({ color: 0xffc928, metalness: 0.8, roughness: 0.3, emissive: 0x6b4a00 });

export function createCoinModel() {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(coinGeo, coinMat);
  const rim = new THREE.Mesh(coinRimGeo, coinMat);
  rim.position.z = 0.045;
  g.add(disc, rim);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

// bosque y arbustos
const trunkGeo = new THREE.CylinderGeometry(0.2, 0.32, 1.8, 8).translate(0, 0.9, 0);
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3b24, roughness: 1 });
const pineGeos = [
  new THREE.ConeGeometry(1.45, 1.9, 8).translate(0, 2.1, 0),
  new THREE.ConeGeometry(1.1, 1.7, 8).translate(0, 3.1, 0),
  new THREE.ConeGeometry(0.75, 1.5, 8).translate(0, 4.0, 0),
];
const crownGeo = new THREE.SphereGeometry(1.35, 12, 10).translate(0, 3.1, 0);
const crown2Geo = new THREE.SphereGeometry(0.9, 10, 8).translate(0.7, 3.7, 0.2);
const leafMats = [0x2f6b3a, 0x3c8442, 0x275a31, 0x4a9a4c].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true }));

export function createTreeModel() {
  const t = new THREE.Group();
  t.add(new THREE.Mesh(trunkGeo, trunkMat));
  const mat = leafMats[Math.floor(Math.random() * leafMats.length)];
  if (Math.random() < 0.55) {                 // pino
    for (const g of pineGeos) t.add(new THREE.Mesh(g, mat));
  } else {                                    // árbol redondo
    t.add(new THREE.Mesh(crownGeo, mat), new THREE.Mesh(crown2Geo, mat));
  }
  t.traverse(o => { if (o.isMesh) o.castShadow = true; });
  t.scale.setScalar(0.8 + Math.random() * 0.9);
  t.rotation.y = Math.random() * Math.PI * 2;
  return t;
}

const bushGeo = new THREE.SphereGeometry(0.8, 9, 7).translate(0, 0.35, 0);
export function createBushModel() {
  const b = new THREE.Mesh(bushGeo, leafMats[Math.floor(Math.random() * leafMats.length)]);
  b.scale.set(0.8 + Math.random() * 0.8, 0.6 + Math.random() * 0.5, 0.8 + Math.random() * 0.8);
  return b;
}

const stemGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.5, 5).translate(0, 0.25, 0);
const headGeo = new THREE.SphereGeometry(0.12, 8, 6).translate(0, 0.54, 0);
const centerGeo = new THREE.SphereGeometry(0.06, 6, 5).translate(0, 0.62, 0);
const stemMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32 });
const centerMat = new THREE.MeshStandardMaterial({ color: 0xffe066 });
const petalMats = [0xff5fa2, 0xffd23f, 0xffffff, 0xb06cff, 0xff7a3d, 0x6ec6ff]
  .map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 }));

export function createFlowerModel() {
  const f = new THREE.Group();
  f.add(
    new THREE.Mesh(stemGeo, stemMat),
    new THREE.Mesh(headGeo, petalMats[Math.floor(Math.random() * petalMats.length)]),
    new THREE.Mesh(centerGeo, centerMat),
  );
  f.scale.setScalar(0.8 + Math.random() * 0.9);
  return f;
}

const hillGeo = new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
const hillMats = [0x2d5a34, 0x3a6b3c, 0x264d30, 0x4a7a44, 0x5a8a4a]
  .map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 1 }));

export function createHillModel() {
  const h = new THREE.Mesh(hillGeo, hillMats[Math.floor(Math.random() * hillMats.length)]);
  const rx = 14 + Math.random() * 18;
  h.scale.set(rx, 8 + Math.random() * 12, 14 + Math.random() * 18);
  h.userData.rx = rx;
  return h;
}

const _d = new THREE.Object3D();
const leafWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true });
const petalWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
const leafPalette = [0x2f6b3a, 0x3c8442, 0x275a31, 0x4a9a4c, 0x356f2e, 0x5aa54f].map(c => new THREE.Color(c));
const petalPalette = [0xff5fa2, 0xffd23f, 0xffffff, 0xb06cff, 0xff7a3d, 0x6ec6ff, 0xff4040].map(c => new THREE.Color(c));
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const sideSign = () => (Math.random() < 0.5 ? -1 : 1);

function makeMatrix(x, z, sx, sy, sz) {
  _d.position.set(x, 0, z);
  _d.rotation.set(0, rnd(0, Math.PI * 2), 0);
  _d.scale.set(sx, sy, sz);
  _d.updateMatrix();
  return _d.matrix.clone();
}

function inst(geo, mat, mats, cols, shadow) {
  const m = new THREE.InstancedMesh(geo, mat, mats.length);
  for (let i = 0; i < mats.length; i++) {
    m.setMatrixAt(i, mats[i]);
    if (cols) m.setColorAt(i, cols[i]);
  }
  m.instanceMatrix.needsUpdate = true;
  if (m.instanceColor) m.instanceColor.needsUpdate = true;
  m.castShadow = shadow;
  m.frustumCulled = false;
  return m;
}


export function createForestChunk(L = 60, density = 1) {
  const g = new THREE.Group();

  function trees(count, minX, maxX, shadow) {
    const trunkM = [], pineM = [], pineC = [], roundM = [], roundC = [];
    for (let i = 0; i < count; i++) {
      const s = rnd(0.8, 1.9);
      const mx = makeMatrix(sideSign() * rnd(minX, maxX), rnd(0, L), s, s * rnd(0.9, 1.3), s);
      trunkM.push(mx);
      if (Math.random() < 0.55) { pineM.push(mx); pineC.push(pick(leafPalette)); }
      else { roundM.push(mx); roundC.push(pick(leafPalette)); }
    }
    if (trunkM.length) g.add(inst(trunkGeo, trunkMat, trunkM, null, shadow));
    if (pineM.length) for (const geo of pineGeos) g.add(inst(geo, leafWhiteMat, pineM, pineC, shadow));
    if (roundM.length) for (const geo of [crownGeo, crown2Geo]) g.add(inst(geo, leafWhiteMat, roundM, roundC, shadow));
  }
  trees(Math.round(90 * density), 6.4, 26, true);    // árboles junto al camino
  trees(Math.round(260 * density), 26, 90, false);   // bosque denso al fondo

  
  const bushM = [], bushC = [];
  for (let i = 0; i < Math.round(70 * density); i++) {
    bushM.push(makeMatrix(sideSign() * rnd(4.9, 18), rnd(0, L), rnd(0.8, 1.6), rnd(0.6, 1.1), rnd(0.8, 1.6)));
    bushC.push(pick(leafPalette));
  }
  g.add(inst(bushGeo, leafWhiteMat, bushM, bushC, false));

  
  const flowerM = [], flowerC = [];
  for (let i = 0; i < Math.round(280 * density); i++) {
    const s = rnd(0.8, 1.7);
    flowerM.push(makeMatrix(sideSign() * rnd(4.5, 16), rnd(0, L), s, s, s));
    flowerC.push(pick(petalPalette));
  }
  g.add(inst(stemGeo, stemMat, flowerM, null, false));
  g.add(inst(headGeo, petalWhiteMat, flowerM, flowerC, false));
  g.add(inst(centerGeo, centerMat, flowerM, null, false));

  return g;
}