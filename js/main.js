// main.js -- bootstrap: canvas sizing, input wiring, render loop
(function () {
  var SRC_W = 800, SRC_H = 480;
  var started = false;

  function start() {
    if (started) return;
    started = true;

    var term = new Terminal(80, 24);
    var canvas = document.getElementById('screen');
    var crt = null;
    try { crt = new CRT(canvas, term.canvas); } catch (e) { /* effects unavailable */ }
    var game = new Game(term);

    function resize() {
      var availW = window.innerWidth - 110, availH = window.innerHeight - 110;
      var scale = Math.max(0.4, Math.min(availW / SRC_W, availH / SRC_H));
      var w = Math.floor(SRC_W * scale), h = Math.floor(SRC_H * scale);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      game.dirty = true;
    }
    resize();
    window.addEventListener('resize', resize);

    window.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'F5' || e.key === 'F11' || e.key === 'F12') return;
      if (window.AudioSys) AudioSys.unlock();
      if (e.key === 'F2') { term.cyclePhosphor(); game.dirty = true; e.preventDefault(); return; }
      if (e.key === 'F3') { if (crt) crt.enabled = !crt.enabled; game.dirty = true; e.preventDefault(); return; }
      if (e.key === 'F4') { if (window.AudioSys) AudioSys.toggleMusic(); e.preventDefault(); return; }
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
