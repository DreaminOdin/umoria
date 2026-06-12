// bridge.js -- reads the real Umoria engine's 80x24 character grid out of the
// DOM each frame and redraws it through the CRT renderer, so the authentic
// game gets the phosphor look, chiptune music and an options menu overlay.
// The engine itself handles all game logic and keyboard input; this layer is
// pure presentation plus a few F-key shortcuts that the game never uses.
(function () {
  var COLS = 80, ROWS = 24;
  var term, crt, grid = [], cursor = null, ready = false;
  var menuOpen = false, audioReady = false;
  var lastFeet = -1; // for triggering narrator voice clips on descent
  var lifeNum = -1;  // current "LIFE n" the engine prints, for per-life tint
  var exited = false, exitMsg = ''; // engine ended (saved / died / quit)

  // -------------------------------------------------------------- fullscreen
  function isFs() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function toggleFs() {
    if (isFs()) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else {
      var el = document.documentElement;
      (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    }
  }

  // --------------------------------------------------------------- settings
  function applySettings() {
    term.theme = SETTINGS.theme;
    term.setScale(SETTINGS.display === 'sharp' ? 2 : 1);
    if (crt) crt.enabled = SETTINGS.display === 'crt';
    document.body.classList.toggle('light', SETTINGS.theme === 'light');
    if (window.AudioSys) AudioSys.setMusic(SETTINGS.music);
  }

  function resize() {
    var fs = isFs();
    document.body.classList.toggle('fs', fs);
    var canvas = document.getElementById('crt');
    var availW = window.innerWidth - (fs ? 0 : 110);
    var availH = window.innerHeight - (fs ? 0 : 150);
    var scale = Math.max(0.4, Math.min(availW / 800, availH / 480));
    var w = Math.floor(800 * scale), h = Math.floor(480 * scale);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
  }

  // ------------------------------------------------------- read game screen
  function syncScreen() {
    var sc = document.getElementById('screen');
    if (!sc) {
      // The engine removes #screen and switches to terminal mode when the
      // game ends (after saving, dying or quitting). Surface its final
      // message instead of leaving a frozen screen behind.
      if (ready) {
        exited = true;
        var tEl = document.getElementById('terminal');
        if (tEl) {
          var txt = (tEl.textContent || '').replace(/\s+/g, ' ').trim();
          if (txt) exitMsg = txt;
        }
      }
      return;
    }
    var kids = sc.children, got = false;
    for (var i = 0; i < kids.length; i++) {
      var el = kids[i], id = el.id;
      if (id && /^\d+$/.test(id)) {
        grid[+id] = el.textContent || '';
        got = true;
      } else if (id === 'cursor') {
        cursor = {
          top: parseFloat(el.style.top) || 0,
          col: Math.round(parseFloat(el.style.left) || 0),
          h: el.clientHeight || 0,
          vis: (el.style.animationName || '') === 'blink'
        };
      }
    }
    if (got) { ready = true; watchDepth(); readLives(); }
  }

  // The patched engine prints "LIFE n" in the status column (n = lives left:
  // 3, 2 or 1). We tint the whole screen as the danger rises.
  function readLives() {
    for (var r = 0; r < ROWS; r++) {
      var mm = (grid[r] || '').match(/LIFE\s+(\d+)/);
      if (mm) { lifeNum = parseInt(mm[1], 10); return; }
    }
  }
  function effectivePhosphor() {
    if (SETTINGS.lifeColors && lifeNum === 2) return 'purple';
    if (SETTINGS.lifeColors && lifeNum >= 0 && lifeNum <= 1) return 'red';
    return SETTINGS.phosphor;
  }

  // Trigger a narrator voice clip (e.g. the bundled public-domain Beowulf
  // reading) each time the player descends past another 250-foot milestone.
  function watchDepth() {
    var bottom = grid[ROWS - 1] || '';
    var m = bottom.match(/(\d+)\s*feet/);
    if (!m) return;
    var feet = parseInt(m[1], 10);
    if (lastFeet >= 0 && feet > lastFeet &&
        Math.floor(feet / 250) > Math.floor(lastFeet / 250)) {
      if (window.AudioSys && AudioSys.voice) AudioSys.voice();
    }
    lastFeet = feet;
  }

  function cellChar(y, x) {
    var line = grid[y];
    if (!line) return ' ';
    var ch = line.charAt(x);
    if (!ch || ch === ' ') return ' ';
    return ch;
  }

  function drawGame() {
    term.clear();
    if (!ready) {
      term.center(10, 'U M O R I A');
      term.center(12, 'Summoning the Mines of Moria...', true);
      term.center(14, '(the real game is loading)', true);
      return;
    }
    for (var y = 0; y < ROWS; y++) {
      for (var x = 0; x < COLS; x++) term.put(x, y, cellChar(y, x));
    }
    // input cursor (e.g. when typing your character name)
    if (cursor && cursor.vis && cursor.h > 0) {
      var cy = Math.round(cursor.top / cursor.h);
      if (cy >= 0 && cy < ROWS && cursor.col >= 0 && cursor.col < COLS) {
        if (Math.floor(performance.now() / 530) % 2 === 0) {
          term.put(cursor.col, cy, cellChar(cy, cursor.col), false, true);
        }
      }
    }
  }

  function wrapText(s, width) {
    var words = s.split(' '), lines = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      if ((cur + ' ' + words[i]).trim().length > width) { lines.push(cur.trim()); cur = words[i]; }
      else { cur = (cur + ' ' + words[i]).trim(); }
    }
    if (cur) lines.push(cur.trim());
    return lines;
  }
  function drawExit() {
    term.clear();
    var msg = exitMsg || 'Thank you for playing Umoria.';
    var lines = wrapText(msg, 60).slice(0, 12);
    var startY = Math.max(2, Math.floor((ROWS - lines.length) / 2) - 2);
    for (var i = 0; i < lines.length; i++) term.center(startY + i, lines[i]);
    if (Math.floor(performance.now() / 600) % 2 === 0) {
      term.center(startY + lines.length + 2, '*** Reload the page (Ctrl+F5) to continue ***');
    }
  }

  // ------------------------------------------------------------ menu overlay
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function panel(x0, y0, w, h, title) {
    var x, y;
    for (y = y0; y < y0 + h; y++) for (x = x0; x < x0 + w; x++) term.put(x, y, ' ');
    for (x = x0; x < x0 + w; x++) { term.put(x, y0, '-'); term.put(x, y0 + h - 1, '-'); }
    for (y = y0; y < y0 + h; y++) { term.put(x0, y, '|'); term.put(x0 + w - 1, y, '|'); }
    term.put(x0, y0, '+'); term.put(x0 + w - 1, y0, '+');
    term.put(x0, y0 + h - 1, '+'); term.put(x0 + w - 1, y0 + h - 1, '+');
    if (title) term.str(x0 + 2, y0, ' ' + title + ' ');
  }
  function drawMenu() {
    var x0 = 21, w = 48;
    panel(x0, 3, w, 18, 'OPTIONS');
    var rows = [
      ['a', 'Display     : ' + (SETTINGS.display === 'crt' ? 'CRT (authentic 1983)' : 'Sharp (modern, crisp)')],
      ['b', 'Phosphor    : ' + cap(SETTINGS.phosphor)],
      ['c', 'Life colours: ' + (SETTINGS.lifeColors ? 'On (2nd life purple, 3rd red)' : 'Off')],
      ['d', 'Theme       : ' + (SETTINGS.theme === 'dark' ? 'Dark room' : 'Light room')],
      ['e', 'Music       : ' + (SETTINGS.music ? 'On' : 'Off')],
      ['f', 'Fullscreen  : toggle (or F11)']
    ];
    for (var i = 0; i < rows.length; i++) {
      term.str(x0 + 3, 6 + i * 2, rows[i][0] + ') ' + rows[i][1]);
    }
    term.str(x0 + 3, 19, 'F1/SPACE/ESC back · F2 F3 F4 are shortcuts', true);
  }
  function menuKey(k) {
    if (k === 'Escape' || k === 'F1' || k === ' ') { menuOpen = false; return; }
    switch (k) {
      case 'a': SETTINGS.display = SETTINGS.display === 'crt' ? 'sharp' : 'crt'; break;
      case 'b': var c = Terminal.CYCLE; SETTINGS.phosphor = c[(c.indexOf(SETTINGS.phosphor) + 1) % c.length]; break;
      case 'c': SETTINGS.lifeColors = !SETTINGS.lifeColors; break;
      case 'd': SETTINGS.theme = SETTINGS.theme === 'dark' ? 'light' : 'dark'; break;
      case 'e': SETTINGS.music = !SETTINGS.music; break;
      case 'f': toggleFs(); break;
      default: return;
    }
    SETTINGS.changed();
    applySettings();
  }

  // ----------------------------------------------------------------- input
  function stop(e) { e.preventDefault(); e.stopImmediatePropagation(); }
  function onKey(e) {
    if (!audioReady && window.AudioSys) { AudioSys.unlock(); audioReady = true; }
    if (window.AudioSys) AudioSys.setMusic(SETTINGS.music);
    switch (e.key) {
      case 'F1': stop(e); menuOpen = !menuOpen; return;
      case 'F2': stop(e); var c = Terminal.CYCLE;
        SETTINGS.phosphor = c[(c.indexOf(SETTINGS.phosphor) + 1) % c.length];
        SETTINGS.changed(); applySettings(); return;
      case 'F3': stop(e); SETTINGS.display = SETTINGS.display === 'crt' ? 'sharp' : 'crt';
        SETTINGS.changed(); applySettings(); return;
      case 'F4': stop(e); SETTINGS.music = !SETTINGS.music;
        SETTINGS.changed(); applySettings(); return;
      case 'F11': stop(e); toggleFs(); return;
    }
    if (menuOpen) { stop(e); menuKey(e.key); return; }
    // every other key falls through to the engine's own keydown handler
  }

  // ------------------------------------------------------------------- loop
  function loop(t) {
    syncScreen();
    term.theme = SETTINGS.theme;
    if (exited) {
      term.phosphor = SETTINGS.phosphor;
      drawExit();
    } else {
      term.phosphor = effectivePhosphor();
      drawGame();
      if (menuOpen) drawMenu();
    }
    term.render();
    if (crt) crt.render(t / 1000);
    requestAnimationFrame(loop);
  }

  function boot() {
    term = new Terminal(COLS, ROWS);
    var canvas = document.getElementById('crt');
    try { crt = new CRT(canvas, term.canvas); } catch (e) { /* effects unavailable */ }
    SETTINGS.onChange = applySettings;
    applySettings();
    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('fullscreenchange', resize);
    document.addEventListener('webkitfullscreenchange', resize);
    window.addEventListener('keydown', onKey, true); // capture, before the engine
    var gear = document.getElementById('gear');
    if (gear) gear.addEventListener('click', function () {
      if (!audioReady && window.AudioSys) { AudioSys.unlock(); audioReady = true; }
      menuOpen = !menuOpen;
    });
    requestAnimationFrame(loop);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(boot, 0);
  } else {
    window.addEventListener('DOMContentLoaded', boot);
  }
})();
