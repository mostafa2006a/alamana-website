// نموذج ثلاثي الأبعاد للباكيت كراشر BF 90.3 (Three.js)
// يحل محل صورة الكاسور، والصورة تبقى كبديل لو المتصفح لا يدعم WebGL
(() => {
  const host = document.getElementById('crusher3d');
  if (!host) return;

  const supportsWebGL = (() => {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) { return false; }
  })();
  if (!supportsWebGL) return;

  let started = false;
  const startObserver = new IntersectionObserver((entries) => {
    if (started || !entries.some((e) => e.isIntersecting)) return;
    started = true;
    startObserver.disconnect();
    init().catch((err) => console.warn('crusher3d:', err));
  }, { rootMargin: '300px' });
  startObserver.observe(host);

  async function init() {
    const THREE = await import('three');
    const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
    const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // المشهد
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = 'crusher3d__canvas';
    renderer.domElement.setAttribute('aria-label', 'نموذج ثلاثي الأبعاد لكاسور الأمانة BF 90.3، اسحب للتدوير');
    renderer.domElement.setAttribute('role', 'img');

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);

    // الخامات
    const yellow = new THREE.MeshStandardMaterial({ color: 0xf2a400, metalness: 0.2, roughness: 0.38 });
    const black = new THREE.MeshStandardMaterial({ color: 0x151515, metalness: 0.35, roughness: 0.32 });
    const jawMat = new THREE.MeshStandardMaterial({ color: 0xd88a00, metalness: 0.3, roughness: 0.5 });
    const steel = new THREE.MeshStandardMaterial({ color: 0xb8b8b8, metalness: 0.9, roughness: 0.28 });

    const crusher = new THREE.Group();
    const add = (mesh, parent = crusher) => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };
    const box = (w, h, d, mat, x, y, z) => {
      const m = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat));
      m.position.set(x, y, z);
      return m;
    };
    // شكل جانبي مرسوم في المستوى (z, y) ثم يُبثق على محور x
    const sideShape = (pts, holes = []) => {
      const s = new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(z, y)));
      holes.forEach(([z, y, r]) => {
        const h = new THREE.Path();
        h.absarc(z, y, r, 0, Math.PI * 2, true);
        s.holes.push(h);
      });
      return s;
    };
    const extrudeX = (shape, depth, mat, x, bevel = 0.012) => {
      const g = new THREE.ExtrudeGeometry(shape, {
        depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, curveSegments: 24,
      });
      g.rotateY(-Math.PI / 2); // (z الشكل → z العالم) والبثق باتجاه -x
      g.translate(depth / 2, 0, 0);
      const m = add(new THREE.Mesh(g, mat));
      m.position.x = x;
      return m;
    };

    const W = 1.3; // العرض الداخلي
    const T = 0.07; // سمك الجوانب
    const sideX = W / 2 + T / 2;

    // الجانبان
    const sideProfile = sideShape([
      [-0.95, 0.24], [-1.0, 0.86], [-0.55, 1.03], [0.15, 1.06], [0.5, 0.95],
      [0.92, 0.36], [1.0, 0.16], [0.78, 0.02], [-0.58, 0.02],
    ]);
    [-1, 1].forEach((s) => extrudeX(sideProfile, T, black, s * sideX));

    // القاع والظهر والسقف
    box(W, 0.06, 1.55, black, 0, 0.07, 0.2);
    box(W, 0.06, 0.5, black, 0, 0.16, -0.72).rotation.x = -0.55;
    box(W, 0.72, 0.06, black, 0, 0.62, -0.96).rotation.x = 0.1;
    box(W + T * 2, 0.08, 1.2, black, 0, 1.0, -0.38);

    // العارضة الأمامية عليها اسم الأمانة
    box(W, 0.2, 0.14, black, 0, 0.88, 0.33);
    const label = makeLabelTexture(THREE);
    const labelMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 0.19),
      new THREE.MeshStandardMaterial({ map: label, transparent: true, metalness: 0.2, roughness: 0.5 }),
    );
    labelMesh.position.set(0, 0.88, 0.402);
    crusher.add(labelMesh);

    // الفك السفلي المضلّع (مائل)
    const lowerJaw = new THREE.Group();
    const ribs = 18;
    for (let i = 0; i < ribs; i++) {
      const x = -W / 2 + 0.05 + (i * (W - 0.1)) / (ribs - 1);
      const rib = add(new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.05, 0.62), jawMat), lowerJaw);
      rib.position.set(x, 0.03, 0);
    }
    add(new THREE.Mesh(new THREE.BoxGeometry(W, 0.03, 0.64), black), lowerJaw);
    lowerJaw.position.set(0, 0.33, -0.15);
    lowerJaw.rotation.x = -0.62;
    crusher.add(lowerJaw);

    // الفك العلوي (أسنان)
    const upperJaw = new THREE.Group();
    add(new THREE.Mesh(new THREE.BoxGeometry(W, 0.12, 0.16), black), upperJaw);
    const teethCount = 22;
    for (let i = 0; i < teethCount; i++) {
      const x = -W / 2 + 0.04 + (i * (W - 0.08)) / (teethCount - 1);
      const cone = add(new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 4), jawMat), upperJaw);
      cone.rotation.x = Math.PI;
      cone.position.set(x, -0.1, 0.04);
    }
    upperJaw.position.set(0, 0.72, -0.25);
    crusher.add(upperJaw);

    // الأقراص الجانبية الصفراء والسوداء (BF 90.3)
    const discR = 0.46;
    const discCenter = new THREE.Vector2(-0.12, 0.6); // (z, y)
    [-1, 1].forEach((s) => {
      const tex = makeDiscTexture(THREE, s);
      const capMat = new THREE.MeshStandardMaterial({ map: tex, metalness: 0.25, roughness: 0.38 });
      const g = new THREE.CylinderGeometry(discR, discR, 0.12, 72);
      const disc = add(new THREE.Mesh(g, [yellow, capMat, black]));
      disc.rotation.z = -s * Math.PI / 2; // الغطاء العلوي يواجه الخارج
      disc.position.set(s * (sideX + T / 2 + 0.06), discCenter.y, discCenter.x);
      const hub = add(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.1, 48), black));
      hub.rotation.z = -s * Math.PI / 2;
      hub.position.set(s * (sideX + T / 2 + 0.16), discCenter.y, discCenter.x);
    });

    // الواقي الأصفر الجانبي بثلاث فتحات + أضلاع صفراء صغيرة
    const guard = sideShape(
      [[0.38, 0.12], [0.6, 0.1], [0.72, 0.3], [0.66, 0.6], [0.52, 0.64], [0.5, 0.42], [0.42, 0.28]],
      [[0.6, 0.22, 0.035], [0.62, 0.36, 0.035], [0.59, 0.5, 0.035]],
    );
    [-1, 1].forEach((s) => {
      extrudeX(guard, 0.03, yellow, s * (sideX + T / 2 + 0.02), 0.006);
      [0.62, 0.74, 0.86].forEach((y) => {
        box(0.04, 0.025, 0.16, yellow, s * (sideX + T / 2 + 0.02), y, 0.42 - (y - 0.62) * 0.4);
      });
    });

    // وسائد التآكل أسفل الجانبين
    [-1, 1].forEach((s) => {
      for (let i = 0; i < 7; i++) {
        box(0.1, 0.07, 0.08, yellow, s * sideX, 0.0, -0.5 + i * 0.16);
      }
    });

    // أسنان الشفة الأمامية
    const toothShape = new THREE.Shape([
      new THREE.Vector2(0, -0.05), new THREE.Vector2(0.3, -0.012),
      new THREE.Vector2(0.3, 0.012), new THREE.Vector2(0, 0.07),
    ]);
    for (let i = 0; i < 5; i++) {
      const x = -0.52 + i * 0.26;
      box(0.13, 0.1, 0.12, black, x, 0.1, 0.98);
      const g = new THREE.ExtrudeGeometry(toothShape, { depth: 0.1, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 2 });
      g.rotateY(-Math.PI / 2);
      g.translate(0.05, 0, 0);
      const tooth = add(new THREE.Mesh(g, yellow));
      tooth.position.set(x, 0.1, 1.02);
    }
    box(W + T * 2, 0.06, 0.1, black, 0, 0.08, 0.96);

    // لوح التثبيت العلوي والأذرع
    box(1.05, 0.06, 0.78, yellow, 0, 1.07, -0.42);
    const ear = sideShape(
      [[-0.4, 0], [0.34, 0], [0.32, 0.2], [0.24, 0.36], [0.1, 0.36], [0.02, 0.26],
        [-0.12, 0.28], [-0.22, 0.5], [-0.36, 0.5], [-0.42, 0.36]],
      [[0.17, 0.25, 0.065], [-0.29, 0.37, 0.075]],
    );
    [-1, 1].forEach((s) => {
      const m = extrudeX(ear, 0.06, yellow, s * 0.3);
      m.position.set(s * 0.3, 1.1, -0.42);
      // جلبة حول الفتحات
      [[0.17, 0.25, 0.09], [-0.29, 0.37, 0.1]].forEach(([z, y, r]) => {
        const ring = add(new THREE.Mesh(new THREE.TorusGeometry(r - 0.012, 0.016, 12, 36), yellow));
        ring.rotation.y = Math.PI / 2;
        ring.position.set(s * 0.335, 1.1 + y, -0.42 + z);
      });
    });
    box(0.6, 0.14, 0.05, yellow, 0, 1.17, -0.42);

    // مسامير على لوح التثبيت
    const boltGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.03, 6);
    for (let i = 0; i < 6; i++) {
      [-0.47, 0.47].forEach((x) => {
        const b = add(new THREE.Mesh(boltGeo, steel));
        b.position.set(x, 1.11, -0.76 + i * 0.135);
      });
    }
    for (let i = 0; i < 5; i++) {
      [-0.78, -0.06].forEach((z) => {
        const b = add(new THREE.Mesh(boltGeo, steel));
        b.position.set(-0.36 + i * 0.18, 1.11, z);
      });
    }
    // وصلات الهيدروليك
    [-0.42, 0.42].forEach((x) => {
      const f = add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 16), steel));
      f.position.set(x, 1.12, -0.03);
    });
    // حلقات الرفع
    [-1, 1].forEach((s) => {
      const ring = add(new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.014, 10, 24), black));
      ring.position.set(s * 0.58, 1.1, 0.12);
    });

    // تمركز النموذج
    const bbox = new THREE.Box3().setFromObject(crusher);
    const center = bbox.getCenter(new THREE.Vector3());
    crusher.position.set(-center.x, -bbox.min.y, -center.z);
    const pivot = new THREE.Group();
    pivot.add(crusher);
    scene.add(pivot);
    const modelH = bbox.max.y - bbox.min.y;

    // الإضاءة والأرضية
    scene.add(new THREE.HemisphereLight(0xfff4dc, 0x3a3020, 0.6));
    const sun = new THREE.DirectionalLight(0xffffff, 2.4);
    sun.position.set(3, 5, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: 0.5, far: 15 });
    sun.shadow.bias = -0.0004;
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0xffd27a, 1.1);
    rim.position.set(-4, 2.5, -3);
    scene.add(rim);

    const ground = new THREE.Mesh(new THREE.CircleGeometry(3, 48), new THREE.ShadowMaterial({ opacity: 0.35 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // الكاميرا والتحكم
    const target = new THREE.Vector3(0, modelH * 0.45, 0);
    camera.position.set(3.1, 1.9, 3.6);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(target);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = 0.35;
    controls.maxPolarAngle = 1.48;
    controls.autoRotate = !reduceMotion;
    controls.autoRotateSpeed = 1.6;
    controls.update();
    // السماح بالتمرير الرأسي للصفحة على الموبايل
    renderer.domElement.style.touchAction = 'pan-y';

    host.prepend(renderer.domElement);
    host.classList.add('is-ready');

    const hint = host.querySelector('.crusher3d__hint');
    let resumeTimer;
    controls.addEventListener('start', () => {
      controls.autoRotate = false;
      clearTimeout(resumeTimer);
      if (hint) hint.classList.add('is-hidden');
    });
    controls.addEventListener('end', () => {
      if (reduceMotion) return;
      resumeTimer = setTimeout(() => { controls.autoRotate = true; }, 3500);
    });

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = host;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // بعد الكاميرا يتناسب مع نسبة العرض حتى يظهر النموذج كاملًا
      const dist = w / h < 1 ? 5.2 / Math.max(w / h, 0.6) : 5.4;
      camera.position.sub(target).setLength(dist).add(target);
      camera.updateProjectionMatrix();
    };
    new ResizeObserver(resize).observe(host);
    resize();

    // التصيير فقط عند ظهور القسم
    let visible = true;
    new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }).observe(host);
    renderer.setAnimationLoop(() => {
      if (!visible || document.hidden) return;
      controls.update();
      renderer.render(scene, camera);
    });
  }

  function makeDiscTexture(THREE, side) {
    const S = 1024;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    const mid = S / 2;
    g.translate(mid, mid);
    if (side > 0) g.rotate(Math.PI); // غطاء القرص الأيمن مقلوب في إحداثيات الخامة
    g.fillStyle = '#f2a400';
    g.fillRect(-mid, -mid, S, S);
    // النصف السفلي الأسود بخط مائل
    g.save();
    g.rotate(0.38);
    g.fillStyle = '#151515';
    g.fillRect(-S, 0, S * 2, S);
    g.restore();
    // الحافة
    g.lineWidth = 14;
    g.strokeStyle = '#111';
    g.beginPath(); g.arc(0, 0, mid - 8, 0, Math.PI * 2); g.stroke();
    // النصوص
    g.fillStyle = '#111';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = '900 118px Cairo, Arial, sans-serif';
    g.save();
    g.rotate(-0.25);
    g.fillText('BF 90.3', -40, -255);
    g.restore();
    g.font = '800 54px Cairo, Arial, sans-serif';
    g.save();
    g.rotate(1.2);
    g.fillText('ALAMANA', 0, -330);
    g.restore();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }

  function makeLabelTexture(THREE) {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 205;
    const g = c.getContext('2d');
    g.fillStyle = '#e9c48c';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = '900 150px Cairo, Arial, sans-serif';
    g.shadowColor = 'rgba(0,0,0,.6)';
    g.shadowOffsetY = 6;
    g.fillText('ALAMANA', 512, 110);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }
})();
