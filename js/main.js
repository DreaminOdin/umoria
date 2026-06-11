// main.js -- bootstrap: canvas sizing, settings wiring, input, render loop
(function () {
  var started = false;

  function start() {
    if (started) return;
    started = true;

    var term = new Terminal(80, 24);
    var canvas = document.getElementById('screen');
    var crt = null;
    try { crt = new CRT(canvas, term.canvas); } catch (e) { /* effects unavailable */ }
    var game = new Game(term);

    function isFullscreen() {
      return !!(document.fullscreenElement || document.webkitFullscreenElement);
    }
    function toggleFullscreen() {
      if (isFullscreen()) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      } else {
        var el = document.documentElement;
        (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
      }
    }
    game.onToggleFullscreen = toggleFullscreen;

    function resize() {
      var fs = isFullscreen();
      document.body.classList.toggle('fs', fs);
      var availW = window.innerWidth - (fs ? 0 : 110);
      var availH = window.innerHeight - (fs ? 0 : 110);
      var scale = Math.max(0.4, Math.min(availW / 800, availH / 480));
      var w = Math.floor(800 * scale), h = Math.floor(480 * scale);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      game.dirty = true;
    }

    function applySettings() {
      term.theme = SETTINGS.theme;
      term.setScale(SETTINGS.display === 'sharp' ? 2 : 1);
      if (crt) crt.enabled = SETTINGS.display === 'crt';
      document.body.classList.toggle('light', SETTINGS.theme === 'light');
      if (window.AudioSys) AudioSys.setMusic(SETTINGS.music);
      game.dirty = true;
    }
    SETTINGS.onChange = applySettings;
    applySettings();
    resize();
    window.addEventListener('resize', resize);
    function onFsChange() {
      resize();
      if (isFullscreen() && (game.state === 'play' || game.state === 'store')) {
        game.msg('[Fullscreen: SPACE closes menus, = options, ESC leaves fullscreen]');
        game.dirty = true;
      }
    }
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);

    window.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'F5' || e.key === 'F12') return;
      // In fullscreen the browser reserves ESC for leaving fullscreen; don't
      // also trigger the in-game ESC action. SPACE serves as cancel instead.
      if (e.key === 'Escape' && isFullscreen()) return;
      if (e.key === 'F11') { // run fullscreen through our own toggle
        e.preventDefault();
        toggleFullscreen();
        return;
      }
      if (window.AudioSys) { AudioSys.unlock(); AudioSys.setMusic(SETTINGS.music); }
      if (e.key === 'F2') {
        var cyc = Terminal.CYCLE;
        SETTINGS.phosphor = cyc[(cyc.indexOf(SETTINGS.phosphor) + 1) % cyc.length];
        SETTINGS.changed();
        e.preventDefault();
        return;
      }
      if (e.key === 'F3') {
        SETTINGS.display = SETTINGS.display === 'crt' ? 'sharp' : 'crt';
        SETTINGS.changed();
        e.preventDefault();
        return;
      }
      if (e.key === 'F4') {
        SETTINGS.music = !SETTINGS.music;
        SETTINGS.changed();
        e.preventDefault();
        return;
      }
      e.preventDefault();
      game.handleKey(e);
      game.dirty = true;
    });

    function loop(t) {
      var blink = Math.floor(t / 530) % 2 === 0;
      if (blink !== game.blinkOn) {
        game.blinkOn = blink;
        if (game.wantsBlink()) game.dirty = true;
      }
      if (game.dirty) {
        game.render();
        term.render();
        game.dirty = false;
      }
      if (crt) crt.render(t / 1000);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  window.addEventListener('load', function () {
    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load('20px "VT323"'), document.fonts.ready])
        .then(start, start);
      setTimeout(start, 1500); // belt and braces if fonts hang
    } else {
      start();
    }
  });
})();
