import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const activeScenes = [];
const up = new THREE.Vector3(0, 1, 0);

function material(color, roughness = 0.5, metalness = 0.15, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
}
function addMesh(parent, geometry, mat, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}
function addBox(parent, size, mat, position, rotation = [0, 0, 0]) {
  return addMesh(parent, new THREE.BoxGeometry(...size), mat, position, rotation);
}
function addCapsule(parent, radius, length, mat, position, rotation = [0, 0, 0]) {
  return addMesh(parent, new THREE.CapsuleGeometry(radius, length, 5, 10), mat, position, rotation);
}
function makeLights(scene) {
  scene.add(new THREE.HemisphereLight(0xc7f5d7, 0x10191a, 2.0));
  const key = new THREE.DirectionalLight(0xe0ffed, 3.0);
  key.position.set(4, 6, 5);
  scene.add(key);
  const rim = new THREE.PointLight(0x6bdda4, 28, 9);
  rim.position.set(-3, 1, -2);
  scene.add(rim);
  const warm = new THREE.PointLight(0xff9a80, 12, 8);
  warm.position.set(2, -2, 3);
  scene.add(warm);
}
function addFloorGrid(scene) {
  const grid = new THREE.GridHelper(8, 24, 0x315344, 0x1b3128);
  grid.position.y = -1.45;
  grid.material.transparent = true;
  grid.material.opacity = 0.22;
  scene.add(grid);
}

function buildBreathalyzer(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const boardMat = material(0x174e43, 0.65, 0.22);
  const boardEdge = material(0x0c2521, 0.6, 0.2);
  const metal = material(0xb8c6bd, 0.28, 0.8);
  const darkMetal = material(0x52635b, 0.35, 0.75);
  const black = material(0x18211f, 0.35, 0.35);
  const gold = material(0xd6bb79, 0.3, 0.75);
  addBox(root, [3.35, 0.18, 2.15], boardEdge, [0, -0.45, 0]);
  addBox(root, [3.25, 0.08, 2.05], boardMat, [0, -0.34, 0]);

  // MQ-3-style metal sensor can and perforated protective cage.
  const sensor = new THREE.Group();
  root.add(sensor);
  addMesh(sensor, new THREE.CylinderGeometry(0.57, 0.64, 1.13, 48), metal, [0.15, 0.34, 0]);
  addMesh(sensor, new THREE.CylinderGeometry(0.49, 0.53, 0.1, 48), darkMetal, [0.15, -0.25, 0]);
  addMesh(sensor, new THREE.CylinderGeometry(0.54, 0.54, 0.06, 48), black, [0.15, -0.32, 0]);
  addMesh(sensor, new THREE.TorusGeometry(0.54, 0.045, 10, 48), metal, [0.15, 0.92, 0]);
  addMesh(sensor, new THREE.TorusGeometry(0.58, 0.025, 8, 48), darkMetal, [0.15, -0.13, 0]);
  for (let i = 0; i < 16; i += 1) {
    const angle = (i / 16) * Math.PI * 2;
    const bar = addBox(sensor, [0.035, 0.88, 0.035], darkMetal, [0.15 + Math.cos(angle) * 0.555, 0.34, Math.sin(angle) * 0.555]);
    bar.rotation.y = -angle;
  }
  for (let i = 0; i < 5; i += 1) {
    addMesh(sensor, new THREE.TorusGeometry(0.55, 0.018, 6, 48), darkMetal, [0.15, -0.02 + i * 0.17, 0]);
  }
  // Six connection pins under the sensor.
  for (let i = 0; i < 6; i += 1) {
    const x = -0.28 + i * 0.17;
    addMesh(sensor, new THREE.CylinderGeometry(0.035, 0.035, 0.6, 10), gold, [x, -0.73, 0]);
  }
  // Supporting electronics and connector blocks.
  addBox(root, [0.72, 0.15, 0.72], material(0x253631, 0.4, 0.4), [-1.05, -0.22, 0.38]);
  addBox(root, [0.46, 0.16, 0.36], material(0x1e2925, 0.35, 0.4), [1.1, -0.21, -0.5]);
  addBox(root, [0.55, 0.12, 0.22], material(0x27312d, 0.5, 0.2), [-1.05, -0.18, -0.55]);
  for (let i = 0; i < 4; i += 1) {
    addMesh(root, new THREE.CylinderGeometry(0.035, 0.035, 0.05, 12), gold, [-1.25 + i * 0.13, -0.1, 0.38]);
  }
  const signalRing = addMesh(root, new THREE.TorusGeometry(0.82, 0.018, 8, 72), material(0x8df1b3, 0.35, 0.25, { emissive: 0x1b8053, emissiveIntensity: 1.1 }), [0.15, 1.05, 0]);
  signalRing.rotation.x = Math.PI / 2;

  // Breath / sensing particles rise above the sensor.
  const positions = new Float32Array(110 * 3);
  for (let i = 0; i < 110; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.32;
    positions[i * 3] = 0.15 + Math.cos(a) * r;
    positions[i * 3 + 1] = 1.1 + Math.random() * 1.0;
    positions[i * 3 + 2] = Math.sin(a) * r;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: 0xafffd0, size: 0.035, transparent: true, opacity: 0.7 }));
  root.add(particles);
  return (time) => {
    root.rotation.y = Math.sin(time * 0.00028) * 0.28;
    root.rotation.x = Math.sin(time * 0.0002) * 0.035;
    signalRing.scale.setScalar(1 + Math.sin(time * 0.002) * 0.06);
    const p = particleGeometry.attributes.position;
    for (let i = 0; i < p.count; i += 1) {
      let y = p.getY(i) + 0.004 + (i % 4) * 0.0008;
      if (y > 2.2) y = 1.05 + Math.random() * 0.2;
      p.setY(i, y);
    }
    p.needsUpdate = true;
  };
}

function makeKidneyShape() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.05, 0.72);
  shape.bezierCurveTo(-0.72, 0.89, -0.98, 0.25, -0.63, -0.36);
  shape.bezierCurveTo(-0.34, -0.88, 0.52, -0.83, 0.69, -0.2);
  shape.bezierCurveTo(0.83, 0.28, 0.5, 0.78, 0.12, 0.73);
  shape.bezierCurveTo(0.27, 0.48, 0.43, 0.34, 0.26, 0.12);
  shape.bezierCurveTo(0.09, -0.1, -0.18, 0.0, -0.25, 0.26);
  shape.bezierCurveTo(-0.33, 0.49, -0.26, 0.66, -0.05, 0.72);
  return shape;
}
function buildKidney(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const coral = material(0xe47c69, 0.32, 0.22, { emissive: 0x36100f, emissiveIntensity: 0.25 });
  const peach = material(0xffb09a, 0.35, 0.16);
  const scanMat = new THREE.MeshBasicMaterial({ color: 0x8df1b3, transparent: true, opacity: 0.16, side: THREE.DoubleSide });
  // Axial scan planes create a layered imaging volume.
  for (let i = 0; i < 5; i += 1) {
    const z = -0.85 + i * 0.42;
    const disk = addMesh(root, new THREE.RingGeometry(1.22, 1.72, 80), scanMat.clone(), [0, 0, z]);
    disk.material.opacity = 0.08 + i * 0.018;
  }
  const scanLine = addMesh(root, new THREE.TorusGeometry(1.77, 0.055, 12, 96), material(0x6bc997, 0.3, 0.65, { emissive: 0x174f33, emissiveIntensity: 0.65 }), [0, 0, 0.1]);
  const innerRing = addMesh(root, new THREE.TorusGeometry(1.52, 0.018, 8, 96), material(0xb7f7cf, 0.35, 0.4, { emissive: 0x286e4a, emissiveIntensity: 0.6 }), [0, 0, 0.18]);
  const kidneyGeo = new THREE.ExtrudeGeometry(makeKidneyShape(), { depth: 0.3, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.055, bevelThickness: 0.06, curveSegments: 24 });
  kidneyGeo.computeVertexNormals();
  const left = addMesh(root, kidneyGeo, coral, [-0.56, 0.02, 0.34], [0, 0, 0.13]);
  left.scale.set(0.72, 0.88, 0.82);
  const right = addMesh(root, kidneyGeo, peach, [0.56, 0.02, 0.36], [0, Math.PI, -0.13]);
  right.scale.set(0.72, 0.88, 0.82);
  // A few central vertebral forms give the scan a recognizable anatomical context.
  for (let i = 0; i < 4; i += 1) {
    addMesh(root, new THREE.CylinderGeometry(0.16, 0.2, 0.25, 20), material(0xb7c9c1, 0.55, 0.12), [0, -0.28 + i * 0.27, 0.25]);
  }
  const scanPlane = addMesh(root, new THREE.PlaneGeometry(3.5, 3.5), new THREE.MeshBasicMaterial({ color: 0x91ffbd, transparent: true, opacity: 0.08, side: THREE.DoubleSide }), [0, 0, 0.95]);
  const particles = new THREE.Group();
  root.add(particles);
  for (let i = 0; i < 32; i += 1) {
    const a = (i / 32) * Math.PI * 2;
    const dot = addMesh(particles, new THREE.SphereGeometry(0.024, 8, 8), material(i % 4 === 0 ? 0xffa38a : 0xafffd0, 0.3, 0.1, { emissive: i % 4 === 0 ? 0x7f2e22 : 0x1a6b43, emissiveIntensity: 0.7 }), [Math.cos(a) * 1.86, Math.sin(a) * 1.86, 0.0]);
    dot.scale.setScalar(0.8 + (i % 3) * 0.2);
  }
  return (time) => {
    root.rotation.y = Math.sin(time * 0.00022) * 0.22;
    root.rotation.x = Math.sin(time * 0.00017) * 0.035;
    scanPlane.position.z = 0.45 + Math.sin(time * 0.0007) * 0.5;
    scanPlane.material.opacity = 0.045 + (Math.sin(time * 0.001) + 1) * 0.025;
    scanLine.rotation.z = time * 0.00013;
    innerRing.rotation.z = -time * 0.0001;
    particles.rotation.z = time * 0.00008;
  };
}

function buildHand(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const shell = material(0x9bb5a5, 0.35, 0.62);
  const bright = material(0xd1e2d8, 0.28, 0.72);
  const dark = material(0x24332d, 0.35, 0.55);
  const accent = material(0x78dba4, 0.3, 0.45, { emissive: 0x1b6e45, emissiveIntensity: 0.7 });
  const palm = new THREE.Group();
  root.add(palm);
  addCapsule(palm, 0.52, 0.65, dark, [0, -0.18, 0]);
  addMesh(palm, new THREE.BoxGeometry(0.82, 0.95, 0.13), shell, [0, -0.1, 0.13]);
  addMesh(palm, new THREE.BoxGeometry(0.53, 0.64, 0.06), dark, [0, -0.1, 0.23]);
  // Decorative sensor traces on the palm plate.
  for (let i = 0; i < 3; i += 1) {
    const trace = addMesh(palm, new THREE.BoxGeometry(0.025, 0.42 - i * 0.06, 0.018), accent, [-0.16 + i * 0.16, -0.08, 0.27]);
    trace.rotation.z = (i - 1) * 0.12;
  }
  const fingers = [];
  function makeFinger(x, y, scale = 1, thumb = false) {
    const base = new THREE.Group();
    base.position.set(x, y, 0.15);
    if (thumb) base.rotation.z = -0.78;
    palm.add(base);
    const segmentMat = bright;
    addCapsule(base, 0.085 * scale, 0.25 * scale, segmentMat, [0, 0.17 * scale, 0]);
    addMesh(base, new THREE.SphereGeometry(0.11 * scale, 16, 12), accent, [0, 0.35 * scale, 0]);
    const jointOne = new THREE.Group();
    jointOne.position.y = 0.35 * scale;
    base.add(jointOne);
    addCapsule(jointOne, 0.075 * scale, 0.24 * scale, segmentMat, [0, 0.16 * scale, 0]);
    addBox(jointOne, [0.055 * scale, 0.3 * scale, 0.07 * scale], shell, [0, 0.16 * scale, 0.095 * scale]);
    addMesh(jointOne, new THREE.SphereGeometry(0.095 * scale, 14, 10), dark, [0, 0.31 * scale, 0]);
    const jointTwo = new THREE.Group();
    jointTwo.position.y = 0.31 * scale;
    jointOne.add(jointTwo);
    addCapsule(jointTwo, 0.067 * scale, 0.2 * scale, segmentMat, [0, 0.14 * scale, 0]);
    addBox(jointTwo, [0.05 * scale, 0.25 * scale, 0.065 * scale], shell, [0, 0.14 * scale, 0.088 * scale]);
    addMesh(jointTwo, new THREE.SphereGeometry(0.07 * scale, 14, 10), accent, [0, 0.25 * scale, 0]);
    fingers.push({ base, jointOne, jointTwo, thumb, phase: x * 2.5 + 1.3 });
  }
  // Four fingers rise from the palm; thumb sits on the radial side.
  makeFinger(-0.33, 0.35, 0.86);
  makeFinger(-0.12, 0.48, 1.0);
  makeFinger(0.12, 0.47, 0.96);
  makeFinger(0.34, 0.35, 0.83);
  makeFinger(-0.52, -0.38, 0.8, true);
  // Wrist cuff / forearm support.
  addMesh(palm, new THREE.TorusGeometry(0.42, 0.09, 12, 40), shell, [0, -0.83, 0], [Math.PI / 2, 0, 0]);
  addBox(palm, [0.72, 0.12, 0.15], dark, [0, -0.86, 0]);
  addBox(palm, [0.17, 0.16, 0.18], accent, [0.24, -0.86, 0.08]);
  return (time) => {
    root.rotation.y = Math.sin(time * 0.00025) * 0.2;
    root.rotation.x = Math.sin(time * 0.00019) * 0.035;
    fingers.forEach((finger, index) => {
      const flex = reducedMotion ? 0.1 : (Math.sin(time * 0.00115 + finger.phase) + 1) * 0.16;
      finger.jointOne.rotation.z = flex * (finger.thumb ? -0.8 : -1);
      finger.jointTwo.rotation.z = flex * (finger.thumb ? -0.55 : -0.75);
      if (finger.thumb) finger.base.rotation.z = -0.78 - flex * 0.5;
      else finger.base.rotation.z = (index - 2) * 0.035;
    });
  };
}

function mountScene(element, builder, cameraPosition = [0, 0.35, 6.4]) {
  try {
    const scene = new THREE.Scene();
    makeLights(scene);
    addFloorGrid(scene);
    const width = Math.max(element.clientWidth, 280);
    const height = Math.max(element.clientHeight, 250);
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(...cameraPosition);
    camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    element.appendChild(renderer.domElement);
    const animateModel = builder(scene);
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let dragging = false;
    const onPointerDown = (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      dragging = true;
      if (element.setPointerCapture) element.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event) => {
      if (!dragging) return;
      const bounds = element.getBoundingClientRect();
      pointer.targetY = ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.75;
      pointer.targetX = ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.35;
    };
    const onPointerUp = () => { dragging = false; };
    const onPointerLeave = () => { if (!dragging) { pointer.targetX = 0; pointer.targetY = 0; } };
    element.addEventListener('pointerdown', onPointerDown);
    element.addEventListener('pointermove', onPointerMove);
    element.addEventListener('pointerup', onPointerUp);
    element.addEventListener('pointercancel', onPointerUp);
    element.addEventListener('pointerleave', onPointerLeave);
    const resizeObserver = new ResizeObserver(() => {
      const w = Math.max(element.clientWidth, 280);
      const h = Math.max(element.clientHeight, 250);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(element);
    let visible = true;
    const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    visibilityObserver.observe(element);
    let frame = 0;
    const render = (time) => {
      frame = requestAnimationFrame(render);
      if (!visible) return;
      pointer.x += (pointer.targetX - pointer.x) * 0.045;
      pointer.y += (pointer.targetY - pointer.y) * 0.045;
      animateModel(time);
      scene.rotation.x = pointer.x;
      scene.rotation.y = pointer.y;
      renderer.render(scene, camera);
    };
    if (reducedMotion) {
      animateModel(0);
      renderer.render(scene, camera);
    } else {
      frame = requestAnimationFrame(render);
    }
    element.classList.add('is-ready');
    activeScenes.push(() => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      element.removeEventListener('pointerdown', onPointerDown);
      element.removeEventListener('pointermove', onPointerMove);
      element.removeEventListener('pointerup', onPointerUp);
      element.removeEventListener('pointercancel', onPointerUp);
      element.removeEventListener('pointerleave', onPointerLeave);
      renderer.dispose();
    });
  } catch (error) {
    console.warn('3D scene could not be initialized; showing the visual fallback.', error);
    element.classList.add('scene-fallback');
    const loading = element.querySelector('.scene-loading');
    if (loading) loading.textContent = '3D PREVIEW UNAVAILABLE IN THIS BROWSER';
  }
}

document.querySelectorAll('[data-scene]').forEach((element) => {
  const type = element.dataset.scene;
  if (type === 'breathalyzer') mountScene(element, buildBreathalyzer, [0, 0.1, 6.2]);
  if (type === 'kidney') mountScene(element, buildKidney, [0, 0.05, 6.4]);
  if (type === 'orthosis') mountScene(element, buildHand, [0, 0.05, 6.3]);
});

window.addEventListener('pagehide', () => activeScenes.forEach((dispose) => dispose()), { once: true });
