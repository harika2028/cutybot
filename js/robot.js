/* Cuty Bot - 3D robot, butterfly antennas, environment and animation controller (Three.js r149, no modules) */
(function (global) {
  'use strict';
  var T = global.THREE;

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function seg(u, a, b) { return clamp((u - a) / (b - a), 0, 1); }
  function env(u) { return Math.sin(Math.PI * clamp(u, 0, 1)); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function mkTex(w, h, draw) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    return new T.CanvasTexture(c);
  }
  function glossy(color, extra) {
    var o = { color: color, roughness: 0.3, metalness: 0.0, clearcoat: 0.8, clearcoatRoughness: 0.25 };
    for (var k in (extra || {})) o[k] = extra[k];
    return new T.MeshPhysicalMaterial(o);
  }

  var PINK = 0xff9fbe, PINK_D = 0xf27ca3, WHITE = 0xf8faff, CYAN = 0x2fe6ff;

  function CutyRobot(canvas) {
    var hooks = { sound: function () {}, event: function () {}, tap: function () {} };
    var reduceMotion = false;
    try { reduceMotion = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    var rm = reduceMotion ? 0.35 : 1;

    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputEncoding = T.sRGBEncoding;

    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(38, 1, 0.1, 100);
    scene.add(camera);
    var view = { azim: 0, polar: 1.45, dist: 9, tx: 0, ty: 2.7 };

    /* ------------------------------ lights ------------------------------ */
    var hemi = new T.HemisphereLight(0xffffff, 0xf3d9ff, 0.7); scene.add(hemi);
    var sun = new T.DirectionalLight(0xffffff, 1.0);
    sun.position.set(-3, 8, 6); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -5; sun.shadow.camera.right = 5; sun.shadow.camera.top = 7; sun.shadow.camera.bottom = -3;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 25; sun.shadow.bias = -0.0008; sun.shadow.radius = 4;
    scene.add(sun);
    var rim = new T.DirectionalLight(0x7fefff, 0.55); rim.position.set(4, 5, -6); scene.add(rim);
    var fill = new T.DirectionalLight(0xffc4dd, 0.3); fill.position.set(5, 2, 5); scene.add(fill);

    /* ------------------------------ ground ------------------------------ */
    var groundMat = new T.MeshStandardMaterial({ color: 0xfdf1ff, roughness: 0.9 });
    var ground = new T.Mesh(new T.CircleGeometry(3.6, 64), groundMat);
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    var ring = new T.Mesh(new T.RingGeometry(3.6, 3.75, 64), new T.MeshBasicMaterial({ color: 0xffb8d2 }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.005; scene.add(ring);

    /* ------------------------------ robot ------------------------------- */
    var rig = new T.Group(); scene.add(rig);
    var mWhite = glossy(WHITE, { roughness: 0.22 });
    var mPink = glossy(PINK);
    var mPinkD = glossy(PINK_D);
    var mCyan = new T.MeshStandardMaterial({ color: CYAN, emissive: 0x18c8e8, emissiveIntensity: 0.9, roughness: 0.3 });
    var mEyeDark = glossy(0x10182c, { roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05 });
    var mBlack = new T.MeshBasicMaterial({ color: 0x1a1a22 });

    function mesh(geo, mat, parent, x, y, z) {
      var m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); if (parent) parent.add(m); return m;
    }

    /* torso */
    var torso = new T.Group(); torso.position.y = 1.0; rig.add(torso);
    var torsoPink = mesh(new T.SphereGeometry(0.95, 48, 32), mPink, torso); torsoPink.scale.set(1, 1.05, 0.9);
    var belly = new T.Group(); belly.position.set(0, -0.02, 0.42); torso.add(belly);
    var bellyMesh = mesh(new T.SphereGeometry(0.8, 48, 32), mWhite, belly); bellyMesh.scale.set(1, 1.05, 0.55);
    var helloTex = mkTex(512, 256, function (c, w, h) {
      c.clearRect(0, 0, w, h);
      c.font = 'italic 600 150px "Segoe Script","Brush Script MT","Lucida Handwriting","Apple Chancery",cursive';
      c.fillStyle = '#f58fb0'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('hello', w / 2, h / 2 + 6);
    });
    var helloMesh = mesh(new T.SphereGeometry(0.806, 32, 16, Math.PI / 2 - 0.75, 1.5, Math.PI / 2 - 0.4, 0.8),
      new T.MeshBasicMaterial({ map: helloTex, transparent: true, depthWrite: false }), belly);
    helloMesh.scale.set(1, 1.05, 0.55);
    mesh(new T.CylinderGeometry(0.42, 0.5, 0.3, 24), mPinkD, rig, 0, 1.95, 0);   /* neck */

    /* arms */
    function buildArm(side) {
      var sh = new T.Group(); sh.position.set(side * 0.9, 1.52, 0.05); rig.add(sh);
      mesh(new T.SphereGeometry(0.31, 24, 18), mPinkD, sh);
      mesh(new T.CapsuleGeometry(0.24, 0.5, 8, 16), mPink, sh, 0, -0.38, 0);
      var el = new T.Group(); el.position.y = -0.7; sh.add(el);
      mesh(new T.SphereGeometry(0.25, 20, 14), mPinkD, el);
      mesh(new T.CapsuleGeometry(0.22, 0.25, 8, 16), mPink, el, 0, -0.3, 0);
      var hand = mesh(new T.SphereGeometry(0.29, 24, 18), mPink, el, 0, -0.68, 0.02); hand.scale.set(1, 1.15, 0.9);
      return { sh: sh, el: el };
    }
    var armL = buildArm(-1), armR = buildArm(1);

    /* legs (seated, pointing forward) */
    function buildLeg(side) {
      var hip = new T.Group(); hip.position.set(side * 0.5, 0.37, 0.4); rig.add(hip);
      var cap = mesh(new T.CapsuleGeometry(0.36, 0.62, 8, 20), mPink, hip, 0, 0, 0.42); cap.rotation.x = Math.PI / 2;
      mesh(new T.SphereGeometry(0.3, 16, 12), mPinkD, hip, 0, 0, 0);
      return hip;
    }
    var hipL = buildLeg(-1), hipR = buildLeg(1);

    /* head */
    var head = new T.Group(); head.position.set(0, 1.95, 0.05); head.rotation.order = 'YXZ'; rig.add(head);
    var headC = new T.Group(); headC.position.y = 0.9; head.add(headC);
    var headWhite = mesh(new T.SphereGeometry(1.15, 56, 40), mWhite, headC); headWhite.scale.set(1.1, 0.95, 1);
    var shell = new T.Mesh(new T.SphereGeometry(1.168, 56, 40, Math.PI, Math.PI, 0, Math.PI),
      glossy(PINK, { side: T.DoubleSide })); shell.scale.set(1.1, 0.95, 1); headC.add(shell);
    var cap2 = new T.Mesh(new T.SphereGeometry(1.168, 56, 20, 0, Math.PI * 2, 0, 0.9), glossy(PINK, { side: T.DoubleSide }));
    cap2.scale.set(1.1, 0.95, 1); cap2.visible = false; headC.add(cap2);

    function zSurf(x, y) { return 1.15 * Math.sqrt(Math.max(0.02, 1 - Math.pow(x / 1.265, 2) - Math.pow(y / 1.0925, 2))); }

    /* ears */
    [-1, 1].forEach(function (s) {
      var e = new T.Group(); e.position.set(s * 1.2, 0.0, 0); headC.add(e);
      var c1 = mesh(new T.CylinderGeometry(0.4, 0.4, 0.3, 32), mPink, e); c1.rotation.z = Math.PI / 2;
      var c2 = mesh(new T.CylinderGeometry(0.25, 0.25, 0.06, 32), mCyan, e, s * 0.16, 0, 0); c2.rotation.z = Math.PI / 2;
      var c3 = mesh(new T.TorusGeometry(0.28, 0.03, 10, 32), mPinkD, e, s * 0.17, 0, 0); c3.rotation.y = Math.PI / 2;
    });

    /* eyes */
    function buildEye(side) {
      var x = side * 0.5, y = 0.12;
      var g = new T.Group(); g.position.set(x, y, zSurf(x, y) - 0.02); g.rotation.y = side * 0.3; headC.add(g);
      var lid = new T.Group(); g.add(lid);
      mesh(new T.TorusGeometry(0.37, 0.035, 12, 48), glossy(0xdfe6ee), lid, 0, 0, 0.02);
      mesh(new T.TorusGeometry(0.32, 0.055, 12, 48), mCyan, lid, 0, 0, 0.03);
      var disc = mesh(new T.CircleGeometry(0.34, 40), new T.MeshStandardMaterial({ color: 0x7fe9ff, emissive: 0x20c4e6, emissiveIntensity: 0.7 }), lid, 0, 0, 0.0);
      var pupil = new T.Group(); lid.add(pupil);
      var ball = mesh(new T.SphereGeometry(0.3, 32, 24), mEyeDark, pupil, 0, 0, -0.02); ball.scale.set(1, 1, 0.4);
      mesh(new T.SphereGeometry(0.075, 12, 10), new T.MeshBasicMaterial({ color: 0xffffff }), pupil, 0.1, 0.11, 0.1);
      mesh(new T.SphereGeometry(0.04, 10, 8), new T.MeshBasicMaterial({ color: 0xffffff }), pupil, -0.1, -0.1, 0.09);
      return { lid: lid, pupil: pupil, disc: disc };
    }
    var eyeL = buildEye(-1), eyeR = buildEye(1);

    /* nose */
    mesh(new T.SphereGeometry(0.06, 16, 12), mPinkD, headC, 0, -0.12, zSurf(0, -0.12) + 0.01);

    /* mouth: smile tube + open-mouth ellipse */
    var mouthG = new T.Group(); mouthG.position.set(0, -0.35, 0); headC.add(mouthG);
    (function () {
      var pts = [];
      for (var i = 0; i <= 14; i++) {
        var x = -0.2 + i * (0.4 / 14), yAbs = -0.3 - 0.1 * (1 - Math.pow(x / 0.2, 2));
        pts.push(new T.Vector3(x, yAbs + 0.35, zSurf(x, yAbs) + 0.012));
      }
      mouthG.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 24, 0.018, 8, false), mBlack));
    })();
    var openMouth = new T.Group(); openMouth.position.set(0, -0.5, zSurf(0, -0.5) - 0.01); headC.add(openMouth);
    var mouthBall = mesh(new T.SphereGeometry(1, 20, 14), new T.MeshBasicMaterial({ color: 0x3a1526 }), openMouth);
    mouthBall.scale.set(0.16, 0.01, 0.06);
    var tongue = mesh(new T.SphereGeometry(1, 12, 8), new T.MeshBasicMaterial({ color: 0xff7aa5 }), openMouth, 0, -0.35, 0.02);
    tongue.scale.set(0.5, 0.35, 0.5); mouthBall.add(tongue);
    openMouth.visible = false;

    /* ------------------- butterflies on antennas ------------------- */
    function wingShapes() {
      var up = new T.Shape(); up.moveTo(0, 0); up.bezierCurveTo(0.08, 0.38, 0.5, 0.6, 0.64, 0.32); up.bezierCurveTo(0.72, 0.06, 0.4, -0.06, 0, 0);
      var lo = new T.Shape(); lo.moveTo(0, 0); lo.bezierCurveTo(0.36, -0.04, 0.52, -0.24, 0.4, -0.44); lo.bezierCurveTo(0.26, -0.56, 0.05, -0.3, 0, 0);
      return { up: up, lo: lo };
    }
    var WS = wingShapes();
    var mWingPink = new T.MeshStandardMaterial({ color: 0xff8fb8, emissive: 0xff4f90, emissiveIntensity: 0.22, side: T.DoubleSide, roughness: 0.45 });
    var mWingCyan = new T.MeshStandardMaterial({ color: 0x5fe7ff, emissive: 0x00c8f0, emissiveIntensity: 0.4, side: T.DoubleSide, roughness: 0.45 });
    var mEdge = new T.LineBasicMaterial({ color: 0x9ff6ff });
    function wingPivot(shape, sx, mainMat, spotMat) {
      var p = new T.Group();
      var inner = new T.Group(); inner.scale.set(sx, 1, 1); p.add(inner);
      inner.add(new T.Mesh(new T.ShapeGeometry(shape, 14), mainMat));
      var spot = new T.Mesh(new T.ShapeGeometry(shape, 14), spotMat); spot.scale.set(0.5, 0.5, 1); spot.position.set(0.1, 0.0, 0.004); inner.add(spot);
      var lg = new T.BufferGeometry().setFromPoints(shape.getPoints(24));
      var line = new T.LineLoop(lg, mEdge); line.position.z = 0.006; inner.add(line);
      return p;
    }
    function buildButterfly() {
      var g = new T.Group(); g.scale.setScalar(0.62);
      var uR = wingPivot(WS.up, 1, mWingPink, mWingCyan), uL = wingPivot(WS.up, -1, mWingPink, mWingCyan);
      var lR = wingPivot(WS.lo, 1, mWingCyan, mWingPink), lL = wingPivot(WS.lo, -1, mWingCyan, mWingPink);
      [uR, uL, lR, lL].forEach(function (w) { g.add(w); });
      mesh(new T.CapsuleGeometry(0.04, 0.3, 4, 8), mPinkD, g, 0, -0.06, 0);
      mesh(new T.SphereGeometry(0.06, 10, 8), mPinkD, g, 0, 0.14, 0);
      return { g: g, uR: uR, uL: uL, lR: lR, lL: lL };
    }
    function buildAntenna(side, phase) {
      var base = new T.Group(); base.position.set(side * 0.5, 1.0, 0); headC.add(base);
      var segs = [], parent = base, len = 0.3;
      for (var i = 0; i < 4; i++) {
        var s = new T.Group(); s.position.y = i === 0 ? 0 : len; parent.add(s);
        mesh(new T.CylinderGeometry(0.03 - 0.003 * i, 0.04 - 0.004 * i, len, 10), mPinkD, s, 0, len / 2, 0);
        mesh(new T.SphereGeometry(0.04 - 0.004 * i, 10, 8), mPinkD, s);
        segs.push(s); parent = s;
      }
      var tip = new T.Group(); tip.position.y = len; parent.add(tip);
      var bf = buildButterfly(); bf.g.position.y = 0.12; bf.g.rotation.x = -0.2; tip.add(bf.g);
      return { side: side, phase: phase, segs: segs, bf: bf, wingPh: phase * 3, speedMul: 1 + phase * 0.12 };
    }
    var antL = buildAntenna(-1, 0.9), antR = buildAntenna(1, 0);

    rig.traverse(function (o) { if (o.isMesh) { o.castShadow = true; } });

    /* ------------------------------ sprites / fx ------------------------------ */
    var heartTex = mkTex(64, 64, function (c) {
      c.fillStyle = '#ff6fa3'; c.beginPath(); c.moveTo(32, 54);
      c.bezierCurveTo(4, 34, 6, 8, 24, 10); c.bezierCurveTo(30, 11, 32, 16, 32, 18);
      c.bezierCurveTo(32, 16, 34, 11, 40, 10); c.bezierCurveTo(58, 8, 60, 34, 32, 54); c.fill();
    });
    var starTex = mkTex(64, 64, function (c) {
      var g = c.createRadialGradient(32, 32, 0, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,240,170,0.9)'); g.addColorStop(1, 'rgba(255,240,170,0)');
      c.fillStyle = g; c.fillRect(0, 0, 64, 64);
      c.fillStyle = '#fff'; c.beginPath(); c.moveTo(32, 4); c.lineTo(37, 27); c.lineTo(60, 32); c.lineTo(37, 37); c.lineTo(32, 60); c.lineTo(27, 37); c.lineTo(4, 32); c.lineTo(27, 27); c.closePath(); c.fill();
    });
    var zTex = mkTex(64, 64, function (c) {
      c.font = 'bold 54px "Comic Sans MS","Trebuchet MS",sans-serif'; c.fillStyle = '#b9a6ff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Z', 32, 34);
    });
    var fx = [];
    function addSprite(tex, pos, scale, vel, life, kind) {
      var sp = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
      sp.position.copy(pos); sp.scale.setScalar(scale); sp.renderOrder = 10; scene.add(sp);
      fx.push({ o: sp, vel: vel, life: life, max: life, kind: kind, s0: scale });
    }
    function heartBurst(n) {
      for (var i = 0; i < n; i++) {
        addSprite(heartTex, new T.Vector3(rnd(-1.4, 1.4), rnd(1.5, 4.2), rnd(0.3, 1.5)), rnd(0.28, 0.5), new T.Vector3(rnd(-0.2, 0.2), rnd(0.6, 1.2), 0), rnd(1.4, 2.4), 'heart');
      }
    }
    function sparkleBurst(n, around) {
      var c = around || new T.Vector3(0, 3.3, 1.2);
      for (var i = 0; i < n; i++) {
        addSprite(starTex, c.clone().add(new T.Vector3(rnd(-0.8, 0.8), rnd(-0.6, 0.6), rnd(-0.2, 0.5))), rnd(0.18, 0.34), new T.Vector3(rnd(-0.6, 0.6), rnd(0.2, 0.9), 0), rnd(0.8, 1.4), 'spark');
      }
    }
    var bubbleGeo = new T.SphereGeometry(1, 20, 14);
    var bubbleMat = new T.MeshStandardMaterial({ color: 0xcdeeff, transparent: true, opacity: 0.38, roughness: 0.05, metalness: 0.1, emissive: 0x9fdcff, emissiveIntensity: 0.25 });
    var bubbleHiMat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    function spawnBubble() {
      var r = rnd(0.07, 0.28), b = new T.Mesh(bubbleGeo, bubbleMat); b.scale.setScalar(r);
      var hi = new T.Mesh(bubbleGeo, bubbleHiMat); hi.scale.setScalar(0.18); hi.position.set(-0.4, 0.45, 0.6); b.add(hi);
      var a = rnd(0, Math.PI * 2), rad = rnd(0.5, 2.6);
      b.position.set(Math.cos(a) * rad, rnd(0.2, 1.5), Math.sin(a) * rad * 0.6 + 0.6); scene.add(b);
      fx.push({ o: b, vel: new T.Vector3(0, rnd(0.5, 1.1), 0), life: rnd(2.5, 4.5), max: 4, kind: 'bubble', r: r, ph: rnd(0, 6) });
    }
    /* apple treat */
    var treat = new T.Group(); treat.visible = false; scene.add(treat);
    mesh(new T.SphereGeometry(0.24, 24, 18), glossy(0xff4d5e), treat);
    mesh(new T.CylinderGeometry(0.02, 0.02, 0.14, 6), new T.MeshStandardMaterial({ color: 0x6b4226 }), treat, 0, 0.26, 0);
    var leaf = mesh(new T.SphereGeometry(0.09, 10, 8), new T.MeshStandardMaterial({ color: 0x59c96b }), treat, 0.08, 0.3, 0); leaf.scale.set(1.6, 0.4, 0.8);
    treat.traverse(function (o) { if (o.isMesh) o.castShadow = true; });

    /* ------------------------------ sky / sun / moon / stars ------------------------------ */
    var skyCanvas = document.createElement('canvas'); skyCanvas.width = 4; skyCanvas.height = 256;
    var skyCtx = skyCanvas.getContext('2d');
    var skyTex = new T.CanvasTexture(skyCanvas); scene.background = skyTex;
    var bgGroup = new T.Group(); camera.add(bgGroup);
    var sunMesh = new T.Mesh(new T.SphereGeometry(0.9, 24, 16), new T.MeshBasicMaterial({ color: 0xffd75e, fog: false }));
    var sunHalo = new T.Sprite(new T.SpriteMaterial({ map: starTex, transparent: true, blending: T.AdditiveBlending, depthWrite: false, color: 0xffe9a0 }));
    sunHalo.scale.setScalar(5); sunMesh.add(sunHalo);
    bgGroup.add(sunMesh);
    var moonShape = (function () {
      var R = 1, r = 0.8, d = 0.4, x = (d * d + R * R - r * r) / (2 * d), y = Math.sqrt(R * R - x * x);
      var a1 = Math.atan2(y, x), b1 = Math.atan2(-y, x - d);
      var s = new T.Shape(); s.absarc(0, 0, R, a1, Math.PI * 2 - a1, false); s.absarc(d, 0, r, b1, -b1, true); return s;
    })();
    var moonMesh = new T.Mesh(new T.ShapeGeometry(moonShape, 32), new T.MeshBasicMaterial({ color: 0xfff3c4, fog: false }));
    moonMesh.scale.setScalar(0.9); moonMesh.rotation.z = 0.5; bgGroup.add(moonMesh);
    var starsGroup = new T.Group(); bgGroup.add(starsGroup);
    var starGeo = new T.BufferGeometry(), sp = [];
    for (var si = 0; si < 90; si++) sp.push(rnd(-1, 1), rnd(-0.1, 1), 0);
    starGeo.setAttribute('position', new T.Float32BufferAttribute(sp, 3));
    var starMat = new T.PointsMaterial({ map: starTex, size: 14, sizeAttenuation: false, transparent: true, depthWrite: false, opacity: 0, fog: false });
    starsGroup.add(new T.Points(starGeo, starMat));
    /* floating sparkles around the robot */
    var spkN = 36, spkPos = new Float32Array(spkN * 3), spkGeo = new T.BufferGeometry();
    for (var qi = 0; qi < spkN; qi++) { spkPos[qi * 3] = rnd(-3.2, 3.2); spkPos[qi * 3 + 1] = rnd(0.5, 6); spkPos[qi * 3 + 2] = rnd(-2, 2); }
    spkGeo.setAttribute('position', new T.BufferAttribute(spkPos, 3));
    var spkMat = new T.PointsMaterial({ map: starTex, size: 0.2, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.8 });
    scene.add(new T.Points(spkGeo, spkMat));

    var KEY = {
      d: { top: new T.Color(0x8ec5ff), bot: new T.Color(0xf4e7ff), ground: new T.Color(0xfdf1ff), sun: new T.Color(0xffffff), si: 1.0, hi: 0.72, hs: new T.Color(0xffffff), hg: new T.Color(0xf3d9ff) },
      s: { top: new T.Color(0xa98bff), bot: new T.Color(0xffc6a8), ground: new T.Color(0xffe3d9), sun: new T.Color(0xffc9a0), si: 0.85, hi: 0.6, hs: new T.Color(0xffd9c4), hg: new T.Color(0xffc2d6) },
      n: { top: new T.Color(0x0a0b2b), bot: new T.Color(0x372a73), ground: new T.Color(0x3d3a78), sun: new T.Color(0x9bb4ff), si: 0.45, hi: 0.55, hs: new T.Color(0x8fa6ff), hg: new T.Color(0x3a2f7a) }
    };
    var W = { d: 1, s: 0, n: 0 }, lastSig = '', envOverride = null, autoMode = 'day';
    function autoFromClock() {
      var d = new Date(), h = d.getHours() + d.getMinutes() / 60;
      return (h >= 6 && h < 17) ? 'day' : (h >= 17 && h < 19) ? 'sunset' : 'night';
    }
    function modeKey(m) { return m === 'sunset' ? 's' : m === 'night' ? 'n' : 'd'; }
    var tmpC = new T.Color();
    function blend(prop) {
      tmpC.setRGB(0, 0, 0);
      ['d', 's', 'n'].forEach(function (k) { tmpC.r += KEY[k][prop].r * W[k]; tmpC.g += KEY[k][prop].g * W[k]; tmpC.b += KEY[k][prop].b * W[k]; });
      return tmpC;
    }
    var hhBg = 5, hwBg = 5;
    function updateEnv(dt) {
      var tgt = modeKey(envOverride || autoMode);
      ['d', 's', 'n'].forEach(function (k) { W[k] += ((k === tgt ? 1 : 0) - W[k]) * Math.min(1, dt * 1.6); });
      var sig = W.d.toFixed(3) + W.s.toFixed(3) + W.n.toFixed(3);
      if (sig !== lastSig) {
        lastSig = sig;
        var top = blend('top').getStyle(), bot;
        var topS = top; bot = blend('bot').getStyle();
        var gr = skyCtx.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, topS); gr.addColorStop(1, bot);
        skyCtx.fillStyle = gr; skyCtx.fillRect(0, 0, 4, 256); skyTex.needsUpdate = true;
        groundMat.color.copy(blend('ground'));
        sun.color.copy(blend('sun'));
        sun.intensity = KEY.d.si * W.d + KEY.s.si * W.s + KEY.n.si * W.n;
        hemi.color.copy(blend('hs')); hemi.groundColor.copy(blend('hg'));
        hemi.intensity = KEY.d.hi * W.d + KEY.s.hi * W.s + KEY.n.hi * W.n;
        var sv = W.d + W.s * 0.9; sunMesh.visible = sv > 0.03; sunMesh.scale.setScalar(Math.max(0.01, sv));
        sunMesh.position.y = hhBg * (0.62 - 0.32 * W.s);
        moonMesh.visible = W.n > 0.03; moonMesh.scale.setScalar(Math.max(0.01, 0.9 * W.n));
        starMat.opacity = W.n; spkMat.opacity = (W.d + W.s * 0.8) * 0.8 + W.n * 0.25;
        sunHalo.material.opacity = 0.75;
      }
    }
    function placeBg() {
      var z = 16, hh = z * Math.tan(camera.fov * Math.PI / 360), hw = hh * camera.aspect;
      hhBg = hh; hwBg = hw;
      sunMesh.position.set(-hw * 0.6, hh * (0.62 - 0.32 * W.s), -z);
      moonMesh.position.set(hw * 0.6, hh * 0.58, -z);
      starsGroup.position.set(0, hh * 0.05, -z - 1); starsGroup.scale.set(hw * 1.08, hh, 1);
      lastSig = '';
    }

    /* ------------------------------ camera fit + resize ------------------------------ */
    function placeCamera() {
      var p = view.polar, a = view.azim;
      camera.position.set(view.tx + view.dist * Math.sin(p) * Math.sin(a), view.ty + view.dist * Math.cos(p), view.dist * Math.sin(p) * Math.cos(a));
      camera.lookAt(view.tx, view.ty, 0);
    }
    function fit() {
      var par = canvas.parentNode, w = Math.max(100, par.clientWidth || canvas.clientWidth || 300), h = Math.max(100, par.clientHeight || canvas.clientHeight || 300);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      var vf = camera.fov * Math.PI / 180, needH = 7.8, needW = 5.4;
      var dH = needH / (2 * Math.tan(vf / 2));
      var hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
      var dW = needW / (2 * Math.tan(hf / 2));
      view.dist = Math.max(dH, dW);
      camera.updateProjectionMatrix(); placeBg(); placeCamera();
    }
    global.addEventListener('resize', fit);
    if (global.ResizeObserver) { try { new global.ResizeObserver(fit).observe(canvas.parentNode); } catch (e) {} }

    /* ------------------------------ state + action definitions ------------------------------ */
    var state = { asleep: false, talking: false, talkUntil: 0, sleepAmt: 0, blink: 0, nextBlink: 2, blinkStart: 0, blinkDur: 0.16, lastTapAction: '' };
    var active = [];
    var look = { tx: 0, ty: 0, x: 0, y: 0 };
    var cur = {};
    var CH = ['headX', 'headY', 'headZ', 'lAz', 'lAx', 'rAz', 'rAx', 'lEl', 'rEl', 'lLeg', 'rLeg', 'mouth', 'smile', 'squash', 'roll', 'wing', 'ant', 'belly', 'eyeCap'];
    CH.forEach(function (k) { cur[k] = k === 'eyeCap' ? 1 : 0; });
    var now = 0;

    function mouthWorld() { return headC.localToWorld(new T.Vector3(0, -0.4, 1.1)); }

    var defs = {
      jump: { dur: 1.25, start: function () { hooks.sound('jump'); }, fn: function (u, o) {
        if (u < 0.25) o.squash += 0.2 * ease(u / 0.25); else if (u > 0.72) o.squash += 0.2 * (1 - seg(u, 0.72, 1));
        o.jump += 1.4 * Math.sin(Math.PI * seg(u, 0.25, 0.72));
        var air = env(seg(u, 0.2, 0.8));
        o.lAz += 2.3 * air + Math.sin(u * 40) * 0.2 * air; o.rAz += 2.3 * air - Math.sin(u * 40) * 0.2 * air;
        o.lLeg -= 0.5 * air; o.rLeg -= 0.5 * air; o.smile += 1; o.mouth += 0.4 * air; o.wing += 1.2 * air; o.ant += 1 * air;
      } },
      turn: { dur: 2.4, start: function () { hooks.sound('chime'); }, fn: function (u, o) {
        o.rotY = ease(u) * Math.PI * 2; var e = env(u);
        o.lAz += 0.6 * e; o.rAz += 0.6 * e; o.headZ += Math.sin(u * 12) * 0.08; o.smile += 1; o.wing += 0.8 * e;
      } },
      wave: { dur: 2.6, fn: function (u, o, a) {
        var f = ease(seg(u, 0, 0.18)) * (1 - ease(seg(u, 0.85, 1)));
        o.rAz += 2.5 * f; o.rAx -= 0.15 * f; o.rEl += Math.sin(u * 2.6 * 9) * 0.6 * f; o.headZ += 0.1 * f; o.smile += 1.2 * f;
        if (u > 0.45 && !a.b) { a.b = true; state.nextBlink = 0; }
      } },
      meow: { dur: 1.5, start: function () { hooks.sound('meow'); }, fn: function (u, o) {
        var e = env(u); o.mouth += 0.9 * Math.abs(Math.sin(u * Math.PI * 2.4)) * e; o.headZ += 0.22 * e; o.headX -= 0.1 * e; o.smile += 0.6 * e;
      } },
      bark: { dur: 1.1, start: function () { hooks.sound('bark'); }, fn: function (u, o) {
        var p = Math.abs(Math.sin(u * Math.PI * 2)); o.mouth += 0.9 * p * (1 - u * 0.3); o.jump += 0.22 * p; o.headX -= 0.12 * p;
        o.lAz += 0.9 * p; o.rAz += 0.9 * p; o.ant += 1;
      } },
      eat: { dur: 5.4, start: function () { treat.visible = true; hooks.sound('whoosh'); }, end: function () { treat.visible = false; }, fn: function (u, o, a) {
        if (u < 0.4) {
          var f = u / 0.4, wp = mouthWorld();
          o.headX -= 0.38 * (1 - ease(f)); o.mouth += 0.9 * ease(seg(u, 0.2, 0.4));
          treat.visible = true; treat.position.set(wp.x, wp.y + (1 - ease(f)) * 3.4, wp.z + 0.25); treat.rotation.y = u * 14; treat.rotation.z = Math.sin(u * 20) * 0.2;
        } else {
          treat.visible = false;
          if (!a.ate) { a.ate = true; hooks.event('ate'); hooks.sound('munch'); sparkleBurst(8, mouthWorld()); }
          var c = seg(u, 0.4, 0.86), chew = Math.abs(Math.sin(c * Math.PI * 7)) * (c < 1 ? 1 : 0);
          o.mouth += 0.4 * chew; o.belly += 0.05 * chew; o.headX += 0.08 * Math.sin(c * Math.PI * 7); o.squash += 0.02 * chew; o.smile += 0.6;
          if (u > 0.9 && !a.h) { a.h = true; heartBurst(5); }
        }
      } },
      bath: { dur: 6.5, start: function () { hooks.sound('chime'); }, end: function () { hooks.event('bathed'); }, fn: function (u, o, a, dt) {
        if (u < 0.78) { a.acc = (a.acc || 0) + dt * 16; while (a.acc > 1) { a.acc -= 1; spawnBubble(); } }
        o.headY += 0.55 * Math.sin(u * 16) * env(seg(u, 0, 0.9)); o.lAz += 0.35 * (0.5 + 0.5 * Math.sin(u * 30)); o.rAz += 0.35 * (0.5 + 0.5 * Math.sin(u * 30 + 1.5));
        o.smile += 1; o.wing += 0.6;
        if (Math.sin(u * 22) > 0.97) state.nextBlink = 0;
      } },
      happy: { dur: 2.4, start: function () { hooks.sound('chime'); heartBurst(8); }, fn: function (u, o) {
        var e = env(u); o.smile += 1.5 * e; o.headZ += Math.sin(u * 14) * 0.16 * e; o.jump += 0.16 * Math.abs(Math.sin(u * Math.PI * 4)) * e;
        o.wing += 2.2 * e; o.ant += 1.5 * e; o.lAz += 0.8 * e; o.rAz += 0.8 * e;
      } },
      nod: { dur: 1.4, fn: function (u, o) {
        var f = env(u); o.headX += 0.35 * Math.sin(u * Math.PI * 5) * f; o.smile += 1 * f; o.lAz += 0.1 * f; o.rAz += 0.1 * f;
      } },
      giggle: { dur: 1.3, start: function () { hooks.sound('giggle'); }, fn: function (u, o) {
        var f = env(u); o.squash += 0.03 * Math.abs(Math.sin(u * 45)) * f; o.headZ += Math.sin(u * 40) * 0.1 * f; o.mouth += 0.35 * f; o.smile += 1.5 * f; o.wing += 1 * f; o.ant += 1 * f;
        o.lAz += 0.5 * f; o.rAz += 0.5 * f;
      } },
      kick: { dur: 1.9, start: function () { hooks.sound('jump'); }, fn: function (u, o) {
        var f = env(seg(u, 0, 1)), ph = u * Math.PI * 6;
        o.lLeg -= 0.8 * Math.max(0, Math.sin(ph)) * f; o.rLeg -= 0.8 * Math.max(0, Math.sin(ph + Math.PI)) * f;
        o.roll += Math.sin(ph) * 0.05 * f; o.smile += 1 * f; o.lAz += 0.6 * f; o.rAz += 0.6 * f; o.squash += 0.02 * f;
      } },
      clap: { dur: 2.2, start: function () { hooks.sound('chime'); }, fn: function (u, o) {
        var f = ease(seg(u, 0, 0.15)) * (1 - ease(seg(u, 0.88, 1))), c = 0.5 + 0.5 * Math.sin(u * Math.PI * 12);
        o.lAx -= 1.3 * f; o.rAx -= 1.3 * f; o.lAz -= (0.15 + 0.55 * (1 - c)) * f + 0.15 * f; o.rAz -= (0.15 + 0.55 * (1 - c)) * f + 0.15 * f;
        o.smile += 1.5 * f; o.headZ += Math.sin(u * 8) * 0.06 * f; o.wing += 1 * f;
      } },
      wiggle: { dur: 2.6, start: function () { hooks.sound('chime'); }, fn: function (u, o) {
        var f = ease(seg(u, 0, 0.12)) * (1 - ease(seg(u, 0.88, 1))), ph = u * Math.PI * 8;
        o.roll += Math.sin(ph) * 0.12 * f; o.headZ -= Math.sin(ph) * 0.14 * f; o.jump += 0.07 * Math.abs(Math.sin(ph)) * f;
        o.lAz += (0.8 + 0.7 * Math.sin(ph)) * f; o.rAz += (0.8 - 0.7 * Math.sin(ph)) * f;
        o.lLeg -= 0.3 * Math.max(0, Math.sin(ph)) * f; o.rLeg -= 0.3 * Math.max(0, -Math.sin(ph)) * f;
        o.smile += 1.5 * f; o.wing += 1.5 * f; o.ant += 1.2 * f;
      } },
      wake: { dur: 6.8, start: function () { state.asleep = false; hooks.sound('chime'); }, end: function () { hooks.event('awake'); }, fn: function (u, o, a) {
        o.sleepOv = 1 - ease(seg(u, 0.1, 0.5));
        o.eyeCap *= ease(seg(u, 0.08, 0.3));
        var st = env(seg(u, 0.25, 0.62));
        o.lAz += 2.6 * st; o.rAz += 2.6 * st; o.squash -= 0.06 * st;
        var yw = env(seg(u, 0.42, 0.68));
        o.mouth += 1.0 * yw; o.eyeCap *= 1 - 0.75 * yw; o.headX -= 0.28 * yw;
        o.headZ += 0.26 * env(seg(u, 0.6, 0.86));
        o.headY += Math.sin(seg(u, 0.78, 0.94) * Math.PI * 4) * 0.4 * env(seg(u, 0.78, 0.94));
        var up = ease(seg(u, 0.78, 1));
        o.ant += 1.8 * up; o.wing += 2.2 * up; o.smile += 1.6 * up;
        if (u > 0.9 && !a.s) { a.s = true; sparkleBurst(14); }
      } },
      sleep: { dur: 5.2, start: function () { state.asleep = true; hooks.sound('sleep'); }, end: function () { hooks.event('asleep'); }, fn: function (u, o) {
        o.sleepOv = ease(seg(u, 0.05, 0.95));
        var yw = env(seg(u, 0.2, 0.45)); o.mouth += 0.9 * yw; o.headX -= 0.15 * yw;
        o.headZ += 0.2 * env(seg(u, 0.05, 0.35));
      } }
    };

    function play(name) {
      var d = defs[name]; if (!d) return false;
      if (state.asleep && name !== 'wake' && name !== 'sleep') return false;
      for (var i = active.length - 1; i >= 0; i--) { if (active[i].name === name || ((name === 'wake' || name === 'sleep') && (active[i].name === 'wake' || active[i].name === 'sleep'))) { if (active[i].def.end && active[i].name !== name) { /* skip */ } active.splice(i, 1); } }
      var entry = { name: name, def: d, t0: now, flags: {} };
      active.push(entry);
      if (d.start) d.start();
      return true;
    }

    /* ------------------------------ per-frame update ------------------------------ */
    var phaseWing = 0;
    function update(dt, t) {
      now = t;
      var o = { jump: 0, rotY: 0, headX: 0, headY: 0, headZ: 0, lAz: 0, lAx: 0, rAz: 0, rAx: 0, lEl: 0, rEl: 0, lLeg: 0, rLeg: 0, mouth: 0, smile: 0, squash: 0, roll: 0, wing: 0, ant: 0, belly: 0, eyeCap: 1, sleepOv: null };
      for (var i = active.length - 1; i >= 0; i--) {
        var a = active[i], u = (t - a.t0) / a.def.dur;
        a.def.fn(clamp(u, 0, 1), o, a.flags, dt);
        if (u >= 1) { if (a.def.end) a.def.end(); active.splice(i, 1); }
      }
      var s = o.sleepOv != null ? o.sleepOv : (state.asleep ? 1 : 0);
      state.sleepAmt = s;
      var aw = 1 - s;

      /* talking */
      var talking = state.talking || t < state.talkUntil;
      if (talking) {
        o.mouth += (0.25 + 0.4 * Math.abs(Math.sin(t * 12))) * (0.6 + 0.4 * Math.abs(Math.sin(t * 5.3)));
        o.headX += Math.sin(t * 5) * 0.04; o.headZ += Math.sin(t * 3.3) * 0.05; o.ant += 0.3; o.smile += 0.4;
      }
      /* idle */
      var bob = Math.sin(t * 1.7) * 0.035 * rm * (1 - 0.6 * s);
      o.headZ += Math.sin(t * 0.7) * 0.05 * rm * aw + 0.3 * s;
      o.headX += Math.sin(t * 0.5) * 0.02 * rm + 0.42 * s;
      look.x += (look.tx - look.x) * (1 - Math.exp(-dt * 6)); look.y += (look.ty - look.y) * (1 - Math.exp(-dt * 6));
      o.headY += look.x * 0.55 * aw; o.headX += -look.y * 0.3 * aw;
      o.lAz += (Math.sin(t * 0.9) * 0.05 * rm) * aw; o.rAz += (Math.sin(t * 0.9 + 1.7) * 0.05 * rm) * aw;
      o.lAx += -0.12 - 0.5 * s + Math.sin(t * 1.1) * 0.04 * rm * aw; o.rAx += -0.12 - 0.5 * s + Math.sin(t * 1.1 + 1) * 0.04 * rm * aw;
      o.lEl += Math.sin(t * 1.3) * 0.05 * rm * aw; o.rEl += Math.sin(t * 1.3 + 1) * 0.05 * rm * aw;
      o.lLeg += Math.sin(t * 1.1) * 0.03 * rm * aw; o.rLeg += Math.sin(t * 1.1 + 2) * 0.03 * rm * aw;
      o.smile += 0.5 * aw;
      o.wing += 0; o.ant += 0;

      /* blinking (never opens eyes while asleep) */
      if (t > state.nextBlink && s < 0.5) {
        state.blinkStart = t; state.blinkDur = Math.random() < 0.15 ? 0.7 : 0.16; state.nextBlink = t + rnd(2.2, 5.5);
      }
      var bu = (t - state.blinkStart) / state.blinkDur;
      state.blink = bu >= 0 && bu <= 1 ? Math.sin(Math.PI * bu) : 0;

      /* smoothing */
      var k = 1 - Math.exp(-dt * 14);
      CH.forEach(function (c) {
        var target = o[c];
        if (c === 'eyeCap') target = o.eyeCap;
        cur[c] += (target - cur[c]) * k;
      });

      /* apply: rig */
      rig.position.y = bob + o.jump;
      rig.rotation.y = o.rotY; rig.rotation.z = cur.roll;
      var sq = cur.squash; rig.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5);
      torso.scale.set(1, 1 + Math.sin(t * 2.0) * 0.015 * rm, 1);
      belly.scale.setScalar(1 + cur.belly);
      head.rotation.set(cur.headX, cur.headY, cur.headZ);
      armL.sh.rotation.set(cur.lAx, 0, -(0.16 + cur.lAz)); armR.sh.rotation.set(cur.rAx, 0, 0.16 + cur.rAz);
      armL.el.rotation.set(0, 0, -cur.lEl); armR.el.rotation.set(0, 0, cur.rEl);
      hipL.rotation.set(cur.lLeg, -0.12, 0); hipR.rotation.set(cur.rLeg, 0.12, 0);

      /* face */
      var eo = clamp(cur.eyeCap * (1 - state.blink) * (1 - s), 0, 1), es = Math.max(0.07, eo);
      [eyeL, eyeR].forEach(function (e) {
        e.lid.scale.y = es; e.pupil.position.set(look.x * 0.07 * aw, look.y * 0.06 * aw, 0);
      });
      var mo = clamp(cur.mouth, 0, 1.1);
      openMouth.visible = mo > 0.04; mouthBall.scale.set(0.16 + 0.04 * mo, Math.max(0.01, mo * 0.16), 0.06);
      mouthG.visible = mo < 0.12;
      mouthG.scale.set(1 + cur.smile * 0.12, 1 + cur.smile * 0.45, 1);

      /* antennas + butterflies */
      var excite = 1 + cur.ant * 1.1;
      [antL, antR].forEach(function (A, idx) {
        var amp = (0.05 + 0.04 * excite) * rm;
        for (var i = 0; i < A.segs.length; i++) {
          var outward = (i === 0 ? 0.3 : 0.1) - 0.08 * cur.ant * (i === 0 ? 0.6 : 1) + 0.12 * s;
          A.segs[i].rotation.z = -A.side * outward + Math.sin(t * 1.3 * (1 + 0.2 * idx) + A.phase + i * 0.7) * amp * (0.6 + i * 0.3);
          A.segs[i].rotation.x = Math.sin(t * 1.1 + A.phase * 2 + i * 0.6) * amp * 0.8 + 0.1 * s * (i + 1) * 0.5;
        }
        var spd = (1 + cur.wing) * (1 - 0.88 * s) + 0.12; A.wingPh += dt * 7.5 * spd * A.speedMul * (reduceMotion ? 0.5 : 1);
        var f1 = 0.1 + 0.55 * (0.5 + 0.5 * Math.sin(A.wingPh)) + 0.5 * s;
        var f2 = 0.1 + 0.5 * (0.5 + 0.5 * Math.sin(A.wingPh - 0.7)) + 0.5 * s;
        A.bf.uR.rotation.y = f1; A.bf.uL.rotation.y = -f1; A.bf.lR.rotation.y = f2; A.bf.lL.rotation.y = -f2;
        A.bf.g.rotation.z = Math.sin(t * 1.4 + A.phase) * 0.15 * rm;
      });

      /* sleeping Zzz */
      if (s > 0.85 && t > (state.nextZ || 0)) {
        state.nextZ = t + 1.3;
        addSprite(zTex, new T.Vector3(0.8, 4.3, 0.8), 0.45, new T.Vector3(0.25, 0.5, 0), 3.2, 'z');
      }
      /* fx update */
      for (var j = fx.length - 1; j >= 0; j--) {
        var f = fx[j]; f.life -= dt;
        f.o.position.x += f.vel.x * dt; f.o.position.y += f.vel.y * dt;
        if (f.kind === 'bubble') {
          f.o.position.x += Math.sin(t * 2.2 + f.ph) * 0.4 * dt; f.o.position.z += Math.cos(t * 1.7 + f.ph) * 0.2 * dt;
          if (f.life < 0.25) f.o.scale.setScalar(f.r * (1 + (0.25 - f.life) * 2));
          if (f.life <= 0) { scene.remove(f.o); fx.splice(j, 1); }
        } else {
          var p = f.life / f.max; f.o.material.opacity = clamp(p * 1.6, 0, 1);
          f.o.scale.setScalar(f.s0 * (f.kind === 'z' ? (1.6 - p * 0.8) : (0.7 + 0.3 * p)));
          if (f.life <= 0) { scene.remove(f.o); f.o.material.dispose(); fx.splice(j, 1); }
        }
      }
      /* sparkle drift */
      var pa = spkGeo.attributes.position.array;
      for (var q = 0; q < spkN; q++) {
        pa[q * 3 + 1] += dt * (0.12 + (q % 5) * 0.03) * rm; pa[q * 3] += Math.sin(t + q) * dt * 0.05;
        if (pa[q * 3 + 1] > 6.2) pa[q * 3 + 1] = 0.4;
      }
      spkGeo.attributes.position.needsUpdate = true;
      starMat.size = 12 + Math.sin(t * 2.3) * 2.5;
      if (sunHalo) sunHalo.material.rotation = t * 0.05;
    }

    /* ------------------------------ pointer interaction ------------------------------ */
    var raycaster = new T.Raycaster(), ndc = new T.Vector2();
    var drag = { on: false, x: 0, y: 0, moved: 0, t0: 0 };
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', function (e) {
      drag.on = true; drag.x = e.clientX; drag.y = e.clientY; drag.moved = 0; drag.t0 = performance.now();
      try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!drag.on) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved += Math.abs(dx) + Math.abs(dy); drag.x = e.clientX; drag.y = e.clientY;
      if (drag.moved > 8) { view.azim = clamp(view.azim - dx * 0.008, -Math.PI, Math.PI); view.polar = clamp(view.polar - dy * 0.005, 1.0, 1.7); placeCamera(); }
    });
    function endDrag(e) {
      if (!drag.on) return; drag.on = false;
      if (drag.moved < 8 && performance.now() - drag.t0 < 600) tapAt(e);
    }
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', function () { drag.on = false; });
    global.addEventListener('pointermove', function (e) {
      var w = global.innerWidth || 1, h = global.innerHeight || 1;
      look.tx = clamp((e.clientX / w) * 2 - 1, -1, 1); look.ty = clamp(-((e.clientY / h) * 2 - 1), -1, 1);
    });
    function tapAt(e) {
      var r = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      var hits = raycaster.intersectObject(rig, true);
      if (!hits.length) return;
      var kind = hits[0].point.y > 3.0 ? 'head' : 'body';
      if (state.asleep) { hooks.tap({ asleep: true, kind: kind }); return; }
      var list = kind === 'head' ? ['nod', 'giggle', 'wiggle', 'happy'] : ['giggle', 'wiggle', 'kick', 'clap', 'wave', 'jump', 'nod'];
      var pick; do { pick = list[Math.floor(Math.random() * list.length)]; } while (pick === state.lastTapAction && list.length > 1);
      state.lastTapAction = pick; play(pick);
      heartBurst(3); sparkleBurst(3, hits[0].point);
      hooks.tap({ asleep: false, kind: kind, action: pick });
    }

    /* ------------------------------ main loop ------------------------------ */
    var clock = new T.Clock(), lastAuto = 0, running = true;
    function loop() {
      if (!running) return;
      global.requestAnimationFrame(loop);
      var dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
      if (t - lastAuto > 20) { lastAuto = t; autoMode = autoFromClock(); }
      updateEnv(dt); update(dt, t);
      renderer.render(scene, camera);
    }
    autoMode = autoFromClock(); W = { d: 0, s: 0, n: 0 }; W[modeKey(autoMode)] = 1;
    fit(); loop();

    /* ------------------------------ public API ------------------------------ */
    return {
      hooks: hooks,
      actions: Object.keys(defs),
      play: play,
      isAsleep: function () { return state.asleep; },
      setAsleep: function (v) { state.asleep = !!v; },
      setTalking: function (v) { state.talking = !!v; },
      talkFor: function (ms) { state.talkUntil = now + ms / 1000; },
      setEnvOverride: function (m) { envOverride = m || null; },
      getEnvMode: function () { return envOverride || autoMode; },
      heartBurst: heartBurst, sparkleBurst: sparkleBurst,
      resetView: function () { view.azim = 0; view.polar = 1.45; placeCamera(); },
      resize: fit,
      _debug: { scene: scene, camera: camera, rig: rig, view: view, update: update, state: state, eyeL: eyeL }
    };
  }

  global.CutyRobot = CutyRobot;
})(typeof window !== 'undefined' ? window : globalThis);
