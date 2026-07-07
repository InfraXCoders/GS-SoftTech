/* ═══════════════════════════════════════════════
   GS SoftTech — 3D interaction layer (staging)
   1. Pointer-tracked tilt + glare on cards
   2. WebGL hero scene (Three.js, index page only)
   ═══════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;

  /* ── 1. Card tilt ── */
  var TILT_SELECTOR = '.card, .cloud-card, .work-card, .step, .arch-pillar, .media-box';
  var MAX_TILT = 7; // degrees

  function initTilt() {
    if (reduceMotion || !canHover) return;
    document.querySelectorAll(TILT_SELECTOR).forEach(function (el) {
      el.classList.add('tilt3d');
      var glare = document.createElement('span');
      glare.className = 'glare';
      el.appendChild(glare);

      var raf = null;

      el.addEventListener('pointermove', function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          var r = el.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width;   // 0..1
          var py = (e.clientY - r.top) / r.height;
          var rx = (0.5 - py) * MAX_TILT * 2;
          var ry = (px - 0.5) * MAX_TILT * 2;
          el.classList.add('tilting');
          el.style.transform =
            'perspective(1000px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' +
            ry.toFixed(2) + 'deg) translateZ(8px)';
          el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
          el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
        });
      });

      el.addEventListener('pointerleave', function () {
        el.classList.remove('tilting');
        el.style.transform = '';
      });
    });
  }

  /* ── 2. WebGL hero scene ── */
  function initHeroScene() {
    var hero = document.querySelector('.hero');
    if (!hero || reduceMotion || typeof THREE === 'undefined') return;

    var canvas = document.createElement('canvas');
    canvas.id = 'hero-3d';
    hero.insertBefore(canvas, hero.firstChild);

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.z = 10;

    // Wireframe icosahedron — the "core"
    var core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(3.4, 1),
      new THREE.MeshBasicMaterial({ color: 0x2979ff, wireframe: true, transparent: true, opacity: 0.28 })
    );
    scene.add(core);

    var inner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.1, 0),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true, transparent: true, opacity: 0.22 })
    );
    scene.add(inner);

    // Particle field
    var COUNT = 700;
    var pos = new Float32Array(COUNT * 3);
    for (var i = 0; i < COUNT * 3; i++) pos[i] = (Math.random() - 0.5) * 34;
    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var points = new THREE.Points(pGeo, new THREE.PointsMaterial({
      color: 0x7aa8ff, size: 0.06, transparent: true, opacity: 0.65
    }));
    scene.add(points);

    var mouseX = 0, mouseY = 0;
    window.addEventListener('pointermove', function (e) {
      mouseX = (e.clientX / window.innerWidth) - 0.5;
      mouseY = (e.clientY / window.innerHeight) - 0.5;
    }, { passive: true });

    function resize() {
      var w = hero.clientWidth, h = hero.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      // shift the core toward the right column on wide screens
      core.position.x = inner.position.x = w > 960 ? 4.5 : 0;
    }
    window.addEventListener('resize', resize);
    resize();

    var visible = true;
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
    }).observe(hero);

    var clock = new THREE.Clock();
    (function tick() {
      requestAnimationFrame(tick);
      if (!visible) return;
      var t = clock.getElapsedTime();
      core.rotation.y = t * 0.12;
      core.rotation.x = t * 0.05;
      inner.rotation.y = -t * 0.2;
      inner.rotation.z = t * 0.08;
      points.rotation.y = t * 0.015;
      camera.position.x += (mouseX * 1.6 - camera.position.x) * 0.04;
      camera.position.y += (-mouseY * 1.2 - camera.position.y) * 0.04;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    })();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initTilt(); initHeroScene(); });
  } else {
    initTilt(); initHeroScene();
  }
})();
