// build-index.js -- generate index.html by wrapping the real Umoria engine
// (the prebuilt browser-based-umoria, which is built from the actual
// dungeons-of-moria/umoria source) in the UMORIA CRT/audio/menu shell.
//
// The engine renders its 80x24 screen into <div id="screen"> with one
// <div id="N"> per row. The shell (js/bridge.js) reads that grid each frame
// and redraws it through the CRT renderer, so the authentic game keeps the
// phosphor look, chiptune music and options menu. Re-run after swapping the
// engine file:   node build-index.js
var fs = require('fs');
var path = require('path');

var ENGINE = path.join(__dirname, 'engine', 'umoria.html');
var OUT = path.join(__dirname, 'index.html');

var html = fs.readFileSync(ENGINE, 'utf8');

var headInject =
  '\n  <link rel="preconnect" href="https://fonts.googleapis.com">\n' +
  '  <link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet">\n' +
  '  <style id="shell-style">\n' +
  '    html, body { height: 100%; }\n' +
  '    body { margin: 0; overflow: hidden; }\n' +
  '    /* keep the engine screen laid out (for measurements) but invisible */\n' +
  '    #screen { position: fixed !important; left: -100000px !important; top: 0 !important;\n' +
  '              opacity: 0 !important; pointer-events: none !important; }\n' +
  '    #terminal { display: none !important; }\n' +
  '    #bezel { padding: 26px; border-radius: 28px;\n' +
  '             background: linear-gradient(145deg, #2b2b30, #0e0e10);\n' +
  '             box-shadow: 0 10px 70px #000, inset 0 0 22px rgba(0,0,0,.95); }\n' +
  '    #crt { display: block; border-radius: 16px; background: #000; }\n' +
  '    #hint { position: fixed; left: 0; right: 0; bottom: 7px; text-align: center;\n' +
  '            color: #75757f; font: 13px/1.4 monospace; pointer-events: none; }\n' +
  '    #gear { position: fixed; top: 10px; right: 16px; color: #8a8a93; font: 20px monospace;\n' +
  '            cursor: pointer; user-select: none; z-index: 5; }\n' +
  '    #gear:hover { color: #d0d0d8; }\n' +
  '    body.light { background: #a8a193 !important; }\n' +
  '    body.light #bezel { background: linear-gradient(145deg, #d9d3c5, #b1aa9c);\n' +
  '                        box-shadow: 0 10px 50px rgba(0,0,0,.35), inset 0 0 16px rgba(0,0,0,.25); }\n' +
  '    body.light #crt { background: #e9e2d0; }\n' +
  '    body.light #hint { color: #5a5446; }\n' +
  '    body.fs #bezel { padding: 0; border-radius: 0; box-shadow: none; background: #000; }\n' +
  '    body.fs.light #bezel { background: #e9e2d0; }\n' +
  '    body.fs #crt { border-radius: 0; }\n' +
  '    body.fs #hint, body.fs #gear { display: none; }\n' +
  '  </style>\n';

var bodyInject =
  '\n  <div id="bezel"><canvas id="crt" width="800" height="480"></canvas></div>\n' +
  '  <div id="gear" title="Options (F1)">⚙</div>\n' +
  '  <div id="hint">F1 Options · F2 Phosphor · F3 Display · F4 Music · F11 Fullscreen' +
  ' — everything else is the real Umoria</div>\n' +
  '  <script src="js/settings.js"></script>\n' +
  '  <script src="js/terminal.js"></script>\n' +
  '  <script src="js/crt.js"></script>\n' +
  '  <script src="js/audio.js"></script>\n' +
  '  <script src="js/bridge.js"></script>\n';

if (html.indexOf('shell-style') >= 0) {
  console.error('index already wrapped? aborting to avoid double-injection.');
  process.exit(1);
}
html = html.replace('</head>', headInject + '</head>');
html = html.replace('</body>', bodyInject + '</body>');

fs.writeFileSync(OUT, html);
console.log('Wrote ' + OUT + ' (' + html.length + ' bytes)');
