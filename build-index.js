// build-index.js -- generate index.html that runs the real Umoria engine
// (our own patched build, engine/umoria.min.js: real dungeons-of-moria source
// + the personal mods -- multiple lives, per-life screen colour, mellon easter
// egg) wrapped in the UMORIA CRT/audio/menu shell.
//
// The engine renders its 80x24 screen into <div id="screen"> (one <div id="N">
// per row). js/bridge.js reads that grid each frame and redraws it through the
// CRT renderer. Re-run after rebuilding the engine:  node build-index.js
var fs = require('fs');
var path = require('path');

var ENGINE_JS = path.join(__dirname, 'engine', 'umoria.min.js');
var OUT = path.join(__dirname, 'index.html');

if (!fs.existsSync(ENGINE_JS)) {
  console.error('Missing ' + ENGINE_JS + ' -- build the engine first (see _tools/build-umoria.ps1).');
  process.exit(1);
}

// Cache-bust the engine and shell scripts so a new deploy is never served
// stale from the browser cache (a query on the sub-resource URLs does NOT
// reach window.location.search, so it can't be mistaken for a save-game arg).
var v = '?v=' + Date.now();

var html = '<!DOCTYPE html>\n' +
'<html lang="en">\n' +
'<head>\n' +
'  <meta charset="utf-8">\n' +
'  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">\n' +
'  <title>UMORIA — The Dungeons of Moria</title>\n' +
'  <link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'  <link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet">\n' +
'  <style>\n' +
'    /* --- engine styles: needed so the engine builds & measures its DOM --- */\n' +
'    html, body { height: 100%; }\n' +
'    body { margin: 0; overflow: hidden; background: #000; color: #fff;\n' +
'           display: grid; justify-content: center; align-content: center;\n' +
'           font-family: monospace; font-size: 22.5px; }\n' +
'    #cursor { position: absolute; width: 1ch; background-color: #fff; color: #000;\n' +
'              animation-name: blink; animation-duration: 1.25s; animation-iteration-count: 9; }\n' +
'    @keyframes blink { 0%,49% { background-color:#fff; color:#000; } 50%,100% { background-color:#000; color:#fff; } }\n' +
'    /* keep the engine screen laid out (for measurements) but invisible */\n' +
'    #screen { position: fixed !important; left: -100000px !important; top: 0 !important;\n' +
'              opacity: 0 !important; pointer-events: none !important; }\n' +
'    #terminal { display: none !important; width: 80ch; }\n' +
'    /* --- shell styles --- */\n' +
'    #bezel { padding: 26px; border-radius: 28px;\n' +
'             background: linear-gradient(145deg, #2b2b30, #0e0e10);\n' +
'             box-shadow: 0 10px 70px #000, inset 0 0 22px rgba(0,0,0,.95); }\n' +
'    #crt { display: block; border-radius: 16px; background: #000; }\n' +
'    #hint { position: fixed; left: 0; right: 0; bottom: 7px; text-align: center;\n' +
'            color: #75757f; font: 13px/1.4 monospace; pointer-events: none; }\n' +
'    #gear { position: fixed; top: 10px; right: 16px; color: #8a8a93; font: 20px monospace;\n' +
'            cursor: pointer; user-select: none; z-index: 5; }\n' +
'    #gear:hover { color: #d0d0d8; }\n' +
'    #reload { position: fixed; top: 10px; right: 50px; color: #8a8a93; font: 20px monospace;\n' +
'              cursor: pointer; user-select: none; z-index: 5; }\n' +
'    #reload:hover { color: #d0d0d8; }\n' +
'    body.fs #reload { display: none; }\n' +
'    body.light { background: #a8a193; }\n' +
'    body.light #bezel { background: linear-gradient(145deg, #d9d3c5, #b1aa9c);\n' +
'                        box-shadow: 0 10px 50px rgba(0,0,0,.35), inset 0 0 16px rgba(0,0,0,.25); }\n' +
'    body.light #crt { background: #e9e2d0; }\n' +
'    body.light #hint { color: #5a5446; }\n' +
'    body.fs #bezel { padding: 0; border-radius: 0; box-shadow: none; background: #000; }\n' +
'    body.fs.light #bezel { background: #e9e2d0; }\n' +
'    body.fs #crt { border-radius: 0; }\n' +
'    body.fs #hint, body.fs #gear { display: none; }\n' +
'  </style>\n' +
'</head>\n' +
'<body>\n' +
'  <div id="bezel"><canvas id="crt" width="800" height="480"></canvas></div>\n' +
'  <div id="reload" title="Reload / continue your saved game">⟳</div>\n' +
'  <div id="gear" title="Options (F1)">⚙</div>\n' +
'  <div id="hint">F1 Options · F2 Phosphor · F3 Display · F4 Music · F11 Fullscreen' +
' — everything else is the real Umoria (press ? in game)</div>\n' +
'  <script src="engine/umoria.min.js' + v + '"></script>\n' +
'  <script src="js/settings.js' + v + '"></script>\n' +
'  <script src="js/terminal.js' + v + '"></script>\n' +
'  <script src="js/crt.js' + v + '"></script>\n' +
'  <script src="js/audio.js' + v + '"></script>\n' +
'  <script src="js/bridge.js' + v + '"></script>\n' +
'</body>\n' +
'</html>\n';

fs.writeFileSync(OUT, html);
console.log('Wrote ' + OUT + ' (' + html.length + ' bytes), engine = engine/umoria.min.js');
