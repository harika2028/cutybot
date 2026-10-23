/* ==========================================================================
   Cuty Bot - app logic: chat, kid Q&A, learning memory, voice, mic, stats, UI
   ========================================================================== */

/* ======================= EDIT ME: VOICE SETTINGS ======================= */
var SPEECH_PITCH = 1.35;          // 0.1 - 2   (higher = cuter)
var SPEECH_RATE = 0.9;            // 0.1 - 10  (lower = slower)
var SPEECH_VOLUME = 1.0;          // 0 - 1
var DEFAULT_LANG = 'en-GB';       // en-GB, en-IN, en-US, ta-IN, hi-IN
var PREFERRED_VOICE_NAME = '';    // e.g. 'Google UK English Female' (leave '' for automatic)
var PREFERRED_VOICE_HINTS = ['Google UK English Female', 'Libby', 'Sonia', 'Hazel', 'Serena', 'Kate', 'Susan', 'Fiona', 'Samantha', 'Female'];
/* ======================================================================= */

(function () {
  'use strict';
  var C = window.CUTY;
  function $(id) { return document.getElementById(id); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ------------------------- storage ------------------------- */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('cutybot.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('cutybot.' + k, JSON.stringify(v)); } catch (e) {} },
    clear: function () { try { Object.keys(localStorage).filter(function (k) { return k.indexOf('cutybot.') === 0; }).forEach(function (k) { localStorage.removeItem(k); }); } catch (e) {} }
  };
  var prefs = { lang: DEFAULT_LANG, voice: PREFERRED_VOICE_NAME, speak: true, sound: true, volume: 0.7, theme: 'light', pitch: SPEECH_PITCH, rate: SPEECH_RATE };
  var saved = store.get('prefs', {}); for (var pk in saved) prefs[pk] = saved[pk];
  var user = store.get('user', { name: '', likes: [] });
  var learned = store.get('learned', {});
  var stats = store.get('stats', null) || { full: 80, clean: 80, happy: 80, ts: Date.now() };
  (function offlineDecay() {
    var mins = Math.max(0, (Date.now() - (stats.ts || Date.now())) / 60000);
    ['full', 'clean', 'happy'].forEach(function (k) { stats[k] = clamp(Math.max(Math.min(stats[k], 30), stats[k] - Math.min(mins * 0.15, 30)), 0, 100); });
  })();
  function savePrefs() { store.set('prefs', prefs); }

  /* ------------------------- robot ------------------------- */
  var robot = null;
  try {
    if (!window.THREE) throw new Error('three.min.js did not load');
    robot = window.CutyRobot($('scene'));
  } catch (err) {
    $('sceneError').hidden = false;
    $('sceneError').textContent = '3D could not start on this device/browser (WebGL needed). Chat still works. ' + err.message;
    robot = { hooks: {}, play: function () {}, isAsleep: function () { return false; }, setAsleep: function () {}, setTalking: function () {}, talkFor: function () {}, setEnvOverride: function () {}, heartBurst: function () {}, resetView: function () {}, getEnvMode: function () { return 'day'; } };
  }

  /* ------------------------- state machine ------------------------- */
  var mode = 'idle';   // idle | listening | processing | speaking | paused | stopped
  var micOn = false, speaking = false, repeatMode = false, teachPending = null, timerId = null, timerEnd = 0;
  var lastReply = '';
  function setMode(m) {
    mode = m; document.body.setAttribute('data-state', m);
    var map = { idle: 'Idle', listening: 'Listening...', processing: 'Thinking...', speaking: 'Speaking', paused: 'Paused', stopped: 'Mic stopped' };
    $('stateLabel').textContent = map[m] || m;
    $('micBtn').classList.toggle('on', micOn);
    $('micBtn').setAttribute('aria-pressed', micOn ? 'true' : 'false');
  }

  /* ------------------------- sounds (Web Audio) ------------------------- */
  var ac = null, master = null;
  function audio() {
    if (!prefs.sound) return null;
    try {
      if (!ac) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ac = new AC(); master = ac.createGain(); master.gain.value = prefs.volume; master.connect(ac.destination); }
      if (ac.state === 'suspended') ac.resume();
      master.gain.value = prefs.volume;
      return ac;
    } catch (e) { return null; }
  }
  function tone(f0, f1, dur, type, vol, delay, lp) {
    var a = audio(); if (!a) return;
    var t = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain(), node = o;
    o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    if (lp) { var f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); node = f; }
    node.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, delay, freq) {
    var a = audio(); if (!a) return;
    var t = a.currentTime + (delay || 0), n = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = a.createBufferSource(); s.buffer = buf; var f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 900; f.Q.value = 1.2;
    var g = a.createGain(); g.gain.value = vol || 0.3; s.connect(f); f.connect(g); g.connect(master); s.start(t);
  }
  var SFX = {
    meow: function () { tone(520, 900, 0.25, 'sawtooth', 0.12, 0, 1800); tone(900, 450, 0.4, 'sawtooth', 0.12, 0.25, 1500); },
    bark: function () { tone(380, 190, 0.14, 'sawtooth', 0.2, 0, 900); tone(420, 200, 0.16, 'sawtooth', 0.2, 0.22, 900); },
    munch: function () { for (var i = 0; i < 6; i++) noise(0.09, 0.35, i * 0.22, 700 + (i % 2) * 300); },
    jump: function () { tone(300, 760, 0.2, 'sine', 0.2); },
    chime: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, f, 0.22, 'sine', 0.14, i * 0.1); }); },
    sleep: function () { tone(330, 220, 0.9, 'sine', 0.07); tone(262, 196, 1.1, 'sine', 0.05, 0.4); },
    giggle: function () { [700, 850, 760].forEach(function (f, i) { tone(f, f * 1.2, 0.09, 'triangle', 0.14, i * 0.1); }); },
    whoosh: function () { noise(0.5, 0.12, 0, 1800); },
    pop: function () { tone(800, 300, 0.07, 'sine', 0.18); }
  };
  function playSound(n) { if (SFX[n]) SFX[n](); }

  /* ------------------------- speech synthesis ------------------------- */
  var synth = window.speechSynthesis || null;
  var emojiRe; try { emojiRe = new RegExp('[\\p{Extended_Pictographic}\\uFE0F\\u200D]', 'gu'); } catch (e) { emojiRe = /[\uD800-\uDFFF☀-➿️]/g; }
  var voices = [];
  function langPrefix(l) { return (l || 'en').slice(0, 2).toLowerCase(); }
  function loadVoices() {
    if (!synth) return;
    voices = synth.getVoices() || [];
    var sel = $('voiceSel'), want = prefs.lang, pre = langPrefix(want);
    var list = voices.slice().sort(function (a, b) {
      var sa = a.lang.toLowerCase() === want.toLowerCase() ? 0 : (langPrefix(a.lang) === pre ? 1 : 2), sb = b.lang.toLowerCase() === want.toLowerCase() ? 0 : (langPrefix(b.lang) === pre ? 1 : 2);
      return sa - sb || a.name.localeCompare(b.name);
    });
    sel.innerHTML = '';
    var auto = document.createElement('option'); auto.value = ''; auto.textContent = 'Auto (best match)'; sel.appendChild(auto);
    list.forEach(function (v) { var op = document.createElement('option'); op.value = v.name; op.textContent = v.name + ' (' + v.lang + ')'; sel.appendChild(op); });
    sel.value = prefs.voice || '';
    if (sel.value !== (prefs.voice || '')) sel.value = '';
    updateVoiceNote();
  }
  function updateVoiceNote() {
    var n = $('voiceNote'); if (!synth) { n.textContent = 'Speech output is not supported in this browser. Text replies still work.'; return; }
    var base = 'Available voices depend on your operating system and browser.';
    var has = voices.some(function (v) { return langPrefix(v.lang) === langPrefix(prefs.lang); });
    n.textContent = voices.length ? (has ? base : base + ' No ' + prefs.lang + ' voice was found, so the closest voice is used.') : base + ' Voices are still loading...';
  }
  function pickVoice(lang) {
    if (!voices.length) return null;
    if (prefs.voice) { var m = voices.filter(function (v) { return v.name === prefs.voice; })[0]; if (m) return m; }
    var pre = langPrefix(lang);
    var exact = voices.filter(function (v) { return v.lang.replace('_', '-').toLowerCase() === lang.toLowerCase(); });
    var same = voices.filter(function (v) { return langPrefix(v.lang) === pre; });
    var pool = exact.length ? exact : (same.length ? same : []);
    if (!pool.length) return null;
    for (var i = 0; i < PREFERRED_VOICE_HINTS.length; i++) {
      var h = PREFERRED_VOICE_HINTS[i].toLowerCase(), f = pool.filter(function (v) { return v.name.toLowerCase().indexOf(h) >= 0; })[0];
      if (f) return f;
    }
    return pool[0];
  }
  var guard = null;
  function speak(text, langCode) {
    var clean = text.replace(emojiRe, '').replace(/\s+/g, ' ').trim();
    if (!synth || !clean) { robot.talkFor(Math.min(4500, 600 + clean.length * 55)); setTimeout(afterSpeech, Math.min(4500, 600 + clean.length * 55)); return; }
    try { synth.cancel(); } catch (e) {}
    var u = new SpeechSynthesisUtterance(clean);
    var v = pickVoice(langCode); if (v) { u.voice = v; u.lang = v.lang; } else u.lang = langCode;
    u.pitch = prefs.pitch; u.rate = prefs.rate; u.volume = SPEECH_VOLUME;
    speaking = true; pauseRecognition(); setMode('speaking'); robot.setTalking(true);
    var done = false;
    function fin() { if (done) return; done = true; clearTimeout(guard); speaking = false; robot.setTalking(false); afterSpeech(); }
    u.onend = fin; u.onerror = fin;
    clearTimeout(guard); guard = setTimeout(fin, 2500 + clean.length * 160);
    try { synth.speak(u); } catch (e) { fin(); }
  }
  function afterSpeech() {
    if (micOn) { setMode('paused'); setTimeout(function () { if (!speaking) resumeRecognition(); }, 450); }
    else setMode(micOn ? 'listening' : 'idle');
  }

  /* ------------------------- bubble + say ------------------------- */
  var bubbleTimer = null;
  function showBubble(text) {
    var b = $('bubbleText'); b.textContent = text; var bb = $('bubble'); bb.classList.remove('pop'); void bb.offsetWidth; bb.classList.add('pop');
  }
  function fill(s) { return s.replace('{name}', user.name || 'friend'); }
  function say(text, opts) {
    opts = opts || {};
    text = fill(text); lastReply = text; showBubble(text);
    if (opts.silent || !prefs.speak || robot.isAsleep() && !opts.force) { if (!opts.silent) robot.talkFor(Math.min(3500, 500 + text.length * 40)); setMode(micOn ? 'listening' : 'idle'); if (micOn && !speaking) afterSpeechSoon(); return; }
    speak(text, opts.lang || speechLang());
  }
  function afterSpeechSoon() { setTimeout(function () { if (!speaking && micOn) resumeRecognition(); }, 700); }
  function speechLang() { return (prefs.lang === 'ta-IN' || prefs.lang === 'hi-IN') ? 'en-IN' : prefs.lang; }

  /* ------------------------- stats ------------------------- */
  var BARS = { full: 'barFull', clean: 'barClean', happy: 'barHappy' };
  var lastLow = { full: 0, clean: 0, happy: 0 };
  function renderStats() {
    Object.keys(BARS).forEach(function (k) {
      var el = $(BARS[k]); el.style.width = clamp(stats[k], 0, 100) + '%'; el.parentNode.setAttribute('aria-valuenow', Math.round(stats[k]));
      el.parentNode.parentNode.classList.toggle('low', stats[k] < 25);
    });
  }
  function bump(k, amt) { stats[k] = clamp(stats[k] + amt, 0, 100); stats.ts = Date.now(); store.set('stats', stats); renderStats(); }
  setInterval(function () {
    var m = robot.isAsleep() ? 0.3 : 1;
    stats.full = clamp(stats.full - 0.5 * m, 0, 100); stats.clean = clamp(stats.clean - 0.35 * m, 0, 100); stats.happy = clamp(stats.happy - 0.45 * m, 0, 100);
    stats.ts = Date.now(); store.set('stats', stats); renderStats();
    if (robot.isAsleep() || speaking) return;
    var nowT = Date.now();
    [['full', 'lowFull'], ['clean', 'lowClean'], ['happy', 'lowHappy']].forEach(function (p) {
      if (stats[p[0]] < 20 && nowT - lastLow[p[0]] > 180000) { lastLow[p[0]] = nowT; robot.play('nod'); say(pick(C.say[p[1]]), { silent: !prefs.speak }); }
    });
  }, 10000);

  /* ------------------------- helpers: matching ------------------------- */
  function re(s) { try { return new RegExp(s, 'i'); } catch (e) { return null; } }
  function matchAny(patterns, text) { for (var i = 0; i < patterns.length; i++) { var r = re(patterns[i]); if (r && r.test(text)) return true; } return false; }
  function cleanText(t) {
    var s = t.toLowerCase().replace(/[!?.,;]+/g, ' ').replace(/\s+/g, ' ').trim();
    C.callNames.forEach(function (n) { s = s.replace(new RegExp('(^|\\s)(hey |hi |ok |okay )?' + n + '(\\s|$)', 'g'), ' '); });
    return s.replace(/\s+/g, ' ').trim();
  }
  function normKey(t) {
    var stop = C.stopWords, toks = t.toLowerCase().replace(/[^a-z0-9஀-௿ऀ-ॿ ]/g, ' ').split(/\s+/).filter(function (w) { return w && stop.indexOf(w) < 0; });
    return toks.join(' ');
  }
  function jaccard(a, b) {
    var A = a.split(' '), B = b.split(' '), inter = 0; A.forEach(function (w) { if (B.indexOf(w) >= 0) inter++; });
    var uni = A.length + B.length - inter; return uni ? inter / uni : 0;
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function title(s) { return s.replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }); }

  /* ------------------------- kid knowledge ------------------------- */
  var ALIAS = { 'usa': 'usa', 'us': 'usa', 'u s a': 'usa', 'the usa': 'usa', 'the us': 'usa', 'the uk': 'uk', 'u k': 'uk', 'honey bee': 'honey bee', 'honeybee': 'honey bee', 'bees': 'bee', 'dogs': 'dog', 'cats': 'cat', 'hibiscus flower': 'hibiscus', 'rose flower': 'rose', 'lotus flower': 'lotus' };
  function term(s) { s = s.toLowerCase().replace(/[?!.,]/g, '').replace(/^(a |an |the )/, '').replace(/\s+/g, ' ').trim(); return ALIAS[s] || s; }
  function lookupIn(map, key) { if (map[key]) return map[key]; var ks = key.replace(/s$/, ''); if (map[ks]) return map[ks]; return null; }
  function mathAnswer(t) {
    var s = t.toLowerCase().replace(/^(what is|what's|whats|calculate|solve|tell me)\s+/, '').replace(/\?$/, '').trim();
    s = s.replace(/multiplied by|times|into/g, '*').replace(/divided by|over/g, '/').replace(/plus|add(ed to)?/g, '+').replace(/minus|subtract(ed by)?|take away/g, '-').replace(/[x×]/g, '*').replace(/÷/g, '/').replace(/\s+/g, '');
    if (!/^[\d+\-*/().]+$/.test(s) || !/\d[+\-*/]\d/.test(s)) return null;
    try {
      var v = Function('"use strict";return (' + s + ')')();
      if (typeof v !== 'number' || !isFinite(v)) return 'Hmm, I can\'t divide by zero! That is a tricky one. 🤔';
      v = Math.round(v * 1000000) / 1000000;
      return s.replace(/\*/g, '×').replace(/\//g, '÷').replace(/([+\-×÷])/g, ' $1 ') + ' = ' + v + '! You are so clever. ⭐';
    } catch (e) { return null; }
  }
  function kidAnswer(raw) {
    var t = raw.toLowerCase().replace(/[?!]+/g, '').replace(/\s+/g, ' ').trim(), m;
    /* learned first (user teaches override built-ins) */
    var k = normKey(t), best = null, bs = 0;
    if (k) { Object.keys(learned).forEach(function (q) { var sc = q === k ? 2 : jaccard(q, k); if (sc > bs) { bs = sc; best = q; } }); }
    if (best && bs >= 0.75) return learned[best].a + '! You taught me that. ⭐';
    var K = C.kid;
    if ((m = t.match(/capital(?: city)? of ([a-z .&']+)$/))) { var c = lookupIn(K.capitals, term(m[1])); if (c) return 'The capital of ' + title(term(m[1])).replace(/^Usa$/, 'the USA').replace(/^Uk$/, 'the UK').replace(/^Uae$/, 'the UAE') + ' is ' + c + '! 🏙️'; }
    if ((m = t.match(/(?:scientific|botanical|latin|biological) name (?:of|for) ([a-z .&']+)$/)) || (m = t.match(/(?:what is |what's )?([a-z .&']+?)(?:'s| s)? (?:scientific|botanical) name$/))) {
      var sn = lookupIn(K.scientific, term(m[1])); if (sn) return 'The scientific name of ' + term(m[1]) + ' is ' + sn + '! 🔬';
    }
    if ((m = t.match(/what (?:sound|noise) (?:does|do) (?:a |an |the )?([a-z ]+?)(?: make| do)?$/)) || (m = t.match(/(?:a |an |the )?([a-z ]+?) (?:sound|noise)$/))) {
      var sd = lookupIn(K.sounds, term(m[1])); if (sd) return 'A ' + term(m[1]) + ' says ' + sd + ' 🐾';
    }
    if ((m = t.match(/baby (?:of|name of) (?:a |an |the )?([a-z ]+)$/)) || (m = t.match(/what is (?:a |an |the )?([a-z ]+?)'?s? baby (?:called|name)$/)) || (m = t.match(/(?:a |an |the )?([a-z ]+?)'s baby$/))) {
      var bb = lookupIn(K.babies, term(m[1])); if (bb) return 'A baby ' + term(m[1]) + ' is called a ' + bb + '! 🍼';
    }
    if ((m = t.match(/^spell ([a-z]+)$/))) return cap(m[1]) + ' is spelled ' + m[1].toUpperCase().split('').join('-') + '! 🔤';
    if ((m = t.match(/^count (?:to|till|up to) (\d{1,2})$/))) { var n = Math.min(parseInt(m[1], 10), 20), a = []; for (var i = 1; i <= n; i++) a.push(i); return a.join(', ') + '! Great counting! 🔢'; }
    var ma = mathAnswer(t); if (ma) return ma;
    for (var j = 0; j < K.facts.length; j++) { if (matchAny(K.facts[j].keys, t)) return K.facts[j].a + ' 🌟'; }
    return null;
  }

  /* ------------------------- learning ------------------------- */
  function learn(q, a) {
    var key = normKey(q); if (!key || !a) return false;
    learned[key] = { a: a.trim(), q: q.trim(), ts: Date.now() }; store.set('learned', learned); renderMemory(); return true;
  }
  function tryTeachCommand(text) {
    var m = text.match(/^(?:please )?(?:teach|learn|remember)\s*(?:me |you )?(?:that |this )?[:,-]?\s*(.+?)\s*(?:=>|->|=|:|\bis\b|\bare\b|\bmeans\b)\s*(.+)$/i);
    if (!m) return null;
    if (/^i (like|love)\b/i.test(m[1] + ' ' + m[2])) return null;
    var q = m[1].replace(/^(what is|what's|the answer to)\s+/i, ''), a = m[2];
    if (!normKey(q)) return null;
    return { q: q, a: a };
  }

  /* ------------------------- remembering the user ------------------------- */
  function tryMemory(text) {
    var m;
    if ((m = text.match(/\bmy name is ([a-zA-Z][a-zA-Z '\-]{0,28})$/i)) || (m = text.match(/\bcall me ([a-zA-Z][a-zA-Z '\-]{0,28})$/i))) {
      user.name = cap(m[1].trim()); store.set('user', user); renderMemory(); return pick(C.say.nameSaved).replace('{name}', user.name);
    }
    if (/^(what is|what's|whats|do you know) my name/i.test(text)) return user.name ? pick(C.say.knowName).replace('{name}', user.name) : pick(C.say.noName);
    if (/^(what do i like|what are my likes|do you know what i like)/i.test(text)) return user.likes.length ? pick(C.say.knowLikes).replace('{likes}', user.likes.join(', ')) : pick(C.say.noLikes);
    if ((m = text.match(/^(?:remember (?:that )?)?i (?:like|love|enjoy) ([a-zA-Z][a-zA-Z ,'\-]{1,40})$/i)) && !/^you\b/i.test(m[1])) {
      var like = m[1].trim().toLowerCase(); if (user.likes.indexOf(like) < 0) user.likes.push(like); user.likes = user.likes.slice(-12); store.set('user', user); renderMemory();
      return pick(C.say.likeSaved).replace('{like}', like);
    }
    if ((m = text.match(/^remember (?:that )?my favou?rite ([a-z ]+) is ([a-zA-Z ]+)$/i)) || (m = text.match(/^my favou?rite ([a-z ]+) is ([a-zA-Z ]+)$/i))) {
      var fav = 'favourite ' + m[1].trim().toLowerCase() + ': ' + m[2].trim().toLowerCase(); if (user.likes.indexOf(fav) < 0) user.likes.push(fav); store.set('user', user); renderMemory();
      return pick(C.say.likeSaved).replace('{like}', m[2].trim().toLowerCase());
    }
    return null;
  }

  /* ------------------------- actions ------------------------- */
  var ACTIONS = {
    jump: function () { robot.play('jump'); bump('happy', 4); return 'jump'; },
    turn: function () { robot.play('turn'); bump('happy', 3); return 'turn'; },
    wave: function () { robot.play('wave'); bump('happy', 3); return 'wave'; },
    meow: function () { robot.play('meow'); bump('happy', 3); return 'meow'; },
    bark: function () { robot.play('bark'); bump('happy', 3); return 'bark'; },
    treat: function () { robot.play('eat'); return 'treat'; },
    bath: function () { robot.play('bath'); return 'bath'; },
    nod: function () { robot.play('nod'); bump('happy', 2); return 'nod'; },
    dance: function () { robot.play('wiggle'); bump('happy', 5); return 'dance'; },
    clap: function () { robot.play('clap'); bump('happy', 3); return 'clap'; },
    kick: function () { robot.play('kick'); bump('happy', 3); return 'kick'; },
    happy: function () { robot.play('happy'); bump('happy', 8); return 'happy'; }
  };
  var envTimer = null;
  function doWake() {
    if (robot.isAsleep() || true) robot.play('wake');
    robot.setEnvOverride('day'); clearTimeout(envTimer); envTimer = setTimeout(function () { if (!robot.isAsleep()) robot.setEnvOverride(null); }, 10 * 60 * 1000);
    bump('happy', 4); say(pick(C.say.wake), { force: true });
  }
  function doSleep() {
    robot.play('sleep'); robot.setEnvOverride('night'); clearTimeout(envTimer);
    say(pick(C.say.sleep), { force: true });
  }
  function setTheme(t) { prefs.theme = t; document.documentElement.setAttribute('data-theme', t); $('themeBtn').textContent = t === 'dark' ? '☀️' : '🌙'; savePrefs(); }
  function setRepeat(on) {
    repeatMode = on; $('repeatBtn').textContent = on ? '🔁 Repeat ON' : '🔁 Repeat OFF'; $('repeatBtn').classList.toggle('on', on); $('repeatBtn').setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  function parseTimer(text) {
    var m = text.match(/(\d+(?:\.\d+)?)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)/i); if (!m) return null;
    var n = parseFloat(m[1]), u = m[2].toLowerCase(), mult = u.charAt(0) === 's' ? 1 : (u.charAt(0) === 'm' ? 60 : 3600);
    var label = (n % 1 ? n : Math.round(n)) + ' ' + (u.charAt(0) === 's' ? 'second' : u.charAt(0) === 'm' ? 'minute' : 'hour') + (n === 1 ? '' : 's');
    return { ms: n * mult * 1000, label: label };
  }
  function runCommand(id, text) {
    if (id === 'wake') { doWake(); return true; }
    if (id === 'sleep') { doSleep(); return true; }
    if (id === 'stopListening') { stopMic(); say(pick(C.say.stopListening), { silent: false }); return true; }
    if (id === 'darkOn') { setTheme('dark'); say(pick(C.say.darkOn)); return true; }
    if (id === 'darkOff') { setTheme('light'); say(pick(C.say.darkOff)); return true; }
    if (id === 'repeatOn') { setRepeat(true); say(pick(C.say.repeatOn)); return true; }
    if (id === 'time') { say(pick(C.say.time).replace('{t}', new Date().toLocaleTimeString(prefs.lang, { hour: 'numeric', minute: '2-digit' }))); return true; }
    if (id === 'date') { say(pick(C.say.date).replace('{t}', new Date().toLocaleDateString(prefs.lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))); return true; }
    if (id === 'timerCancel') { if (timerId) { clearTimeout(timerId); timerId = null; say(pick(C.say.timerCancel)); } else say(pick(C.say.timerNone)); return true; }
    if (id === 'timerSet') {
      var p = parseTimer(text); if (!p || p.ms <= 0 || p.ms > 86400000) { say(pick(C.say.timerBad)); return true; }
      clearTimeout(timerId); timerId = setTimeout(function () { timerId = null; playSound('chime'); robot.play('happy'); say(pick(C.say.timerDone)); }, p.ms);
      say(pick(C.say.timerSet).replace('{t}', p.label)); return true;
    }
    if (ACTIONS[id]) {
      if (robot.isAsleep()) { say(pick(C.say.sleepyCantDo), { silent: true }); return true; }
      ACTIONS[id](); say(pick(C.say[id] || C.say.happy)); return true;
    }
    return false;
  }

  /* ------------------------- main input handler ------------------------- */
  function handleInput(raw, source) {
    var text = (raw || '').trim(); if (!text) return;
    $('youSaid').textContent = 'You: ' + text;
    setMode('processing');
    var low = text.toLowerCase().replace(/[!?.,;]+/g, ' ').replace(/\s+/g, ' ').trim();

    /* repeat mode: echo exactly, only "stop" exits */
    if (repeatMode) {
      if (low === 'stop') { setRepeat(false); say(pick(C.say.repeatOff)); return; }
      lastReply = text; showBubble(text); robot.play('nod');
      if (prefs.speak && !robot.isAsleep()) speak(text, speechLang()); else { robot.talkFor(1500); afterSpeechSoon(); }
      return;
    }
    var cleaned = cleanText(text);
    /* asleep: only wake/sleep/system commands work */
    if (robot.isAsleep()) {
      var cmdA = findCommand(cleaned);
      if (cmdA && ['wake', 'sleep', 'stopListening', 'darkOn', 'darkOff'].indexOf(cmdA) >= 0) { runCommand(cmdA, cleaned); return; }
      say(pick(C.say.asleep), { silent: true }); afterSpeechSoon(); setMode(micOn ? 'listening' : 'idle'); return;
    }
    /* teaching flow */
    var tc = tryTeachCommand(text);
    if (tc) { teachPending = null; learn(tc.q, tc.a); bump('happy', 5); robot.play('happy'); say(pick(C.say.teachSaved)); return; }
    if (teachPending) {
      var q = teachPending; teachPending = null;
      if (/^(no|nope|skip|cancel|never ?mind|stop|i don'?t know)$/i.test(low)) { say(pick(C.say.teachSkip)); return; }
      learn(q, text); bump('happy', 5); robot.play('happy'); say(pick(C.say.teachSaved)); return;
    }
    if (/^teach\b/i.test(text)) { say(pick(C.say.teachBad)); return; }
    /* memory about the user */
    var mem = tryMemory(text); if (mem) { bump('happy', 3); robot.play('nod'); say(mem); return; }
    /* commands */
    var cmd = findCommand(cleaned); if (cmd && runCommand(cmd, cleaned)) { return; }
    /* kid knowledge + learned */
    var ka = kidAnswer(cleaned);
    if (ka) { bump('happy', 3); robot.play('nod'); say(ka); return; }
    /* chat rules */
    var rule = findRule(cleaned);
    if (rule) {
      bump('happy', 2);
      var lang = prefs.lang, rep, spoken = null;
      if (lang === 'ta-IN' && rule.ta) { rep = pick(rule.ta); spoken = 'ta-IN'; } else if (lang === 'hi-IN' && rule.hi) { rep = pick(rule.hi); spoken = 'hi-IN'; } else rep = pick(rule.replies);
      if (['hello', 'thanks', 'love', 'praise', 'happy'].indexOf(rule.id) >= 0) robot.play(rule.id === 'hello' ? 'wave' : 'happy');
      say(rep, spoken ? { lang: spoken } : {}); return;
    }
    /* unknown: questions start teach mode */
    var isQ = /\?$/.test(text) || /^(what|who|where|when|why|how|which|whose|is|are|can|do|does|tell)\b/i.test(low);
    if (isQ && normKey(low)) { teachPending = low; say(pick(C.fallback)); }
    else say(pick(C.fallbackChat));
  }
  function findCommand(cleaned) {
    for (var i = 0; i < C.commands.length; i++) { if (matchAny(C.commands[i].patterns, cleaned)) return C.commands[i].id; }
    return null;
  }
  function findRule(cleaned) {
    var rules = C.rules.slice().sort(function (a, b) { return b.priority - a.priority; });
    for (var i = 0; i < rules.length; i++) { if (matchAny(rules[i].keys, cleaned)) return rules[i]; }
    return null;
  }

  /* ------------------------- speech recognition ------------------------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition, rec = null, recActive = false, restartTimes = [], restartTimer = null;
  function micMessage(msg, bad) { var e = $('micStatus'); e.textContent = msg || ''; e.classList.toggle('err', !!bad); }
  function startMic() {
    if (!SR) { micMessage('Voice input is not supported in this browser. Try Chrome or Edge, or type instead.', true); return; }
    audio();
    micOn = true; restartTimes = []; micMessage('Listening... tap the mic again to stop.'); say(pick(C.say.micOn), { silent: !prefs.speak });
    if (!prefs.speak) startRecognition(); setMode('listening');
  }
  function stopMic() {
    micOn = false; clearTimeout(restartTimer); try { if (rec) rec.abort(); } catch (e) {} recActive = false; micMessage('Microphone stopped.'); setMode('stopped');
    setTimeout(function () { if (!micOn && !speaking && mode === 'stopped') setMode('idle'); }, 1200);
  }
  function pauseRecognition() { clearTimeout(restartTimer); try { if (rec && recActive) rec.abort(); } catch (e) {} recActive = false; }
  function resumeRecognition() { if (micOn && !speaking && !recActive) startRecognition(); }
  function startRecognition() {
    if (!SR || !micOn || speaking || recActive) return;
    var nowT = Date.now(); restartTimes = restartTimes.filter(function (t) { return nowT - t < 10000; });
    if (restartTimes.length >= 6) { micOn = false; setMode('stopped'); micMessage('Listening stopped because the microphone kept restarting. Check microphone permission and tap the mic to try again.', true); return; }
    restartTimes.push(nowT);
    rec = new SR(); rec.lang = prefs.lang; rec.continuous = false; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onstart = function () { recActive = true; setMode('listening'); };
    rec.onresult = function (ev) {
      var r = ev.results[ev.results.length - 1]; if (!r || !r.isFinal) return;
      var tr = r[0].transcript; restartTimes = [];
      if (speaking) return;
      pauseRecognition(); handleInput(tr, 'voice');
    };
    rec.onerror = function (ev) {
      recActive = false;
      if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') { micOn = false; setMode('stopped'); micMessage('Microphone permission was blocked. Click the lock icon in the address bar, allow Microphone, and reload.', true); }
      else if (ev.error === 'audio-capture') { micOn = false; setMode('stopped'); micMessage('No microphone was found. Plug one in and try again.', true); }
      else if (ev.error === 'network') { micOn = false; setMode('stopped'); micMessage('Speech recognition needs an internet connection in this browser (network error).', true); }
    };
    rec.onend = function () {
      recActive = false;
      if (micOn && !speaking && mode !== 'processing') { clearTimeout(restartTimer); restartTimer = setTimeout(startRecognition, 500); }
    };
    try { rec.start(); } catch (e) { recActive = false; }
  }

  /* ------------------------- memory dialog ------------------------- */
  function renderMemory() {
    var box = $('memList'); if (!box) return; box.innerHTML = '';
    function line(t) { var d = document.createElement('div'); d.className = 'memline'; d.textContent = t; box.appendChild(d); return d; }
    line('Name: ' + (user.name || '(not told yet)')); line('Likes: ' + (user.likes.length ? user.likes.join(', ') : '(nothing yet)'));
    var ks = Object.keys(learned); line('Things taught to Cuty Bot: ' + ks.length);
    ks.slice(-30).reverse().forEach(function (k) {
      var d = line(''); var sp = document.createElement('span'); sp.textContent = (learned[k].q || k) + '  →  ' + learned[k].a; d.appendChild(sp);
      var b = document.createElement('button'); b.type = 'button'; b.className = 'tiny'; b.textContent = '✕'; b.setAttribute('aria-label', 'Forget this'); b.onclick = function () { delete learned[k]; store.set('learned', learned); renderMemory(); }; d.appendChild(b);
    });
  }

  /* ------------------------- robot hooks ------------------------- */
  var lastTapSay = 0;
  robot.hooks.sound = playSound;
  robot.hooks.event = function (n) {
    if (n === 'ate') { bump('full', 25); bump('happy', 6); }
    if (n === 'bathed') { bump('clean', 35); bump('happy', 5); playSound('chime'); }
  };
  robot.hooks.tap = function (info) {
    audio();
    if (info.asleep) { var nt = Date.now(); if (nt - lastTapSay > 2500) { lastTapSay = nt; say(pick(C.say.asleep), { silent: true }); } return; }
    bump('happy', 2);
    var nowT = Date.now(); if (nowT - lastTapSay < 3000 || speaking) return;
    lastTapSay = nowT; say(pick(C.tap));
  };

  /* ------------------------- UI wiring ------------------------- */
  document.querySelectorAll('[data-action]').forEach(function (b) {
    b.addEventListener('click', function () {
      audio(); var a = b.getAttribute('data-action');
      if (a === 'wake') { doWake(); return; }
      if (a === 'sleep') { doSleep(); return; }
      runCommand(a, a);
    });
  });
  $('chatForm').addEventListener('submit', function (e) { e.preventDefault(); audio(); var v = $('msg').value; $('msg').value = ''; handleInput(v, 'typed'); });
  $('micBtn').addEventListener('click', function () { if (micOn) { stopMic(); } else { startMic(); } });
  $('repeatBtn').addEventListener('click', function () { setRepeat(!repeatMode); if (!repeatMode) say(pick(C.say.repeatOff)); else say(pick(C.say.repeatOn)); });
  $('againBtn').addEventListener('click', function () { if (lastReply) say(lastReply, { force: true }); });
  $('speakChk').addEventListener('change', function () { prefs.speak = this.checked; savePrefs(); if (!prefs.speak && synth) { try { synth.cancel(); } catch (e) {} speaking = false; robot.setTalking(false); } });
  $('langSel').addEventListener('change', function () { prefs.lang = this.value; prefs.voice = ''; savePrefs(); loadVoices(); micMessage(''); if (micOn) { pauseRecognition(); afterSpeechSoon(); } });
  $('voiceSel').addEventListener('change', function () { prefs.voice = this.value; savePrefs(); });
  $('themeBtn').addEventListener('click', function () { setTheme(prefs.theme === 'dark' ? 'light' : 'dark'); });
  $('soundBtn').addEventListener('click', function () { prefs.sound = !prefs.sound; $('soundBtn').textContent = prefs.sound ? '🔊' : '🔇'; savePrefs(); if (prefs.sound) { audio(); playSound('chime'); } });
  $('volRange').addEventListener('input', function () { prefs.volume = this.value / 100; if (master) master.gain.value = prefs.volume; savePrefs(); });
  $('pitchRange').addEventListener('input', function () { prefs.pitch = parseFloat(this.value); savePrefs(); });
  $('rateRange').addEventListener('input', function () { prefs.rate = parseFloat(this.value); savePrefs(); });
  $('viewBtn').addEventListener('click', function () { robot.resetView(); });
  $('memBtn').addEventListener('click', function () { renderMemory(); var d = $('memDialog'); if (d.showModal) d.showModal(); else d.setAttribute('open', ''); });
  $('memClose').addEventListener('click', function () { var d = $('memDialog'); if (d.close) d.close(); else d.removeAttribute('open'); });
  $('memClear').addEventListener('click', function () {
    if (!window.confirm('Clear everything Cuty Bot remembers (your name, likes, taught facts, settings and pet stats)?')) return;
    store.clear(); learned = {}; user = { name: '', likes: [] }; stats = { full: 80, clean: 80, happy: 80, ts: Date.now() }; renderStats(); renderMemory(); say('All clear! I have forgotten everything. Fresh start! 🌸');
  });

  /* ------------------------- init ------------------------- */
  $('speakChk').checked = !!prefs.speak; $('langSel').value = prefs.lang; $('volRange').value = Math.round(prefs.volume * 100);
  $('pitchRange').value = prefs.pitch; $('rateRange').value = prefs.rate; $('soundBtn').textContent = prefs.sound ? '🔊' : '🔇';
  setTheme(prefs.theme); setRepeat(false); renderStats(); renderMemory(); setMode('idle');
  if (!SR) micMessage('Voice input is not available in this browser (try Chrome or Edge). Typing works fully.', true);
  if (synth) { loadVoices(); if (synth.addEventListener) synth.addEventListener('voiceschanged', loadVoices); else synth.onvoiceschanged = loadVoices; } else updateVoiceNote();
  var hello = user.name ? 'Welcome back, ' + user.name + '! I missed you. Ask me anything! 💗' : 'Hi, I\'m Cuty Bot! Ask me little questions like "capital of India". 🐝';
  showBubble(hello); lastReply = hello;
})();
