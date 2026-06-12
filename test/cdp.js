// cdp.js -- drive the live game via Chrome DevTools Protocol to reproduce the
// save/reload flow. Node 24 has global fetch + WebSocket, so no deps needed.
// Usage: node test/cdp.js <url> "<comma,separated,keys>" [persistentProfileDir]
const { spawn } = require('child_process');
const os = require('os');
const path = require('path');

const URL = process.argv[2] || 'https://dreaminodin.github.io/umoria/';
const KEYS = (process.argv[3] || '').length ? process.argv[3].split(',') : [];
const PROFILE = process.argv[4] || path.join(os.tmpdir(), 'umoria_cdp_' + Date.now());
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222 + Math.floor(Math.random() * 500);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const VK = { Enter: 13, Escape: 27, ' ': 32, Backspace: 8 };
function keyParams(k) {
  let ctrl = false;
  if (k.startsWith('C-')) { ctrl = true; k = k.slice(2); }
  let key = k, code, vk, text;
  if (k === 'Enter') { code = 'Enter'; vk = 13; text = '\r'; }
  else if (k === 'Escape') { code = 'Escape'; vk = 27; text = undefined; }
  else if (k === 'Space') { key = ' '; code = 'Space'; vk = 32; text = ' '; }
  else if (k === 'Backspace') { code = 'Backspace'; vk = 8; text = undefined; }
  else if (/^[a-z]$/.test(k)) { code = 'Key' + k.toUpperCase(); vk = k.toUpperCase().charCodeAt(0); text = k; }
  else if (/^[A-Z]$/.test(k)) { code = 'Key' + k; vk = k.charCodeAt(0); text = k; }
  else if (/^[0-9]$/.test(k)) { code = 'Digit' + k; vk = k.charCodeAt(0); text = k; }
  else { code = 'Unidentified'; vk = k.charCodeAt(0) || 0; text = k; }
  if (ctrl) text = undefined; // control combos send no text
  return { key, code, vk, text, ctrl };
}

async function main() {
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=' + PORT, '--remote-allow-origins=*',
    '--user-data-dir=' + PROFILE, '--window-size=1000,720', URL
  ], { stdio: 'ignore' });

  let wsUrl = null;
  for (let i = 0; i < 60 && !wsUrl; i++) {
    await sleep(500);
    try {
      const r = await fetch('http://127.0.0.1:' + PORT + '/json/list');
      const list = await r.json();
      const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) wsUrl = page.webSocketDebuggerUrl;
    } catch (e) {}
  }
  if (!wsUrl) { console.log('NO WS URL'); chrome.kill(); return; }

  const ws = new WebSocket(wsUrl);
  let id = 0; const pending = new Map(); const logs = [];
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    else if (m.method === 'Runtime.consoleAPICalled') logs.push('console: ' + (m.params.args || []).map((a) => a.value !== undefined ? a.value : (a.description || '')).join(' '));
    else if (m.method === 'Runtime.exceptionThrown') logs.push('EXCEPTION: ' + (m.params.exceptionDetails.exception && m.params.exceptionDetails.exception.description || m.params.exceptionDetails.text));
    else if (m.method === 'Log.entryAdded') logs.push('log[' + m.params.entry.level + ']: ' + m.params.entry.text);
  });
  await new Promise((r) => ws.addEventListener('open', r));
  const cmd = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

  await cmd('Runtime.enable');
  await cmd('Log.enable');
  await cmd('Page.enable');

  async function evalJS(expr) {
    const r = await cmd('Runtime.evaluate', { expression: expr, returnByValue: true });
    if (r.result && r.result.exceptionDetails) return '[evalerr] ' + r.result.exceptionDetails.text;
    return r.result && r.result.result ? r.result.result.value : undefined;
  }
  const DUMP = `(function(){var sc=document.getElementById('screen');if(!sc){var t=document.getElementById('terminal');return '[NO #screen] terminal="'+((t?t.textContent:'')||'').replace(/\\s+/g,' ').slice(0,160)+'"';}var rows=[].slice.call(sc.children).filter(function(d){return /^\\d+$/.test(d.id);});return rows.map(function(d){return d.textContent.replace(/\\u00a0/g,' ').replace(/\\s+$/,'');}).join('\\n');})()`;

  async function key(k) {
    const p = keyParams(k);
    const base = { key: p.key, code: p.code, windowsVirtualKeyCode: p.vk, nativeVirtualKeyCode: p.vk };
    if (p.ctrl) base.modifiers = 2;
    await cmd('Input.dispatchKeyEvent', Object.assign({ type: p.text ? 'keyDown' : 'rawKeyDown' }, base, p.text ? { text: p.text } : {}));
    await cmd('Input.dispatchKeyEvent', Object.assign({ type: 'keyUp' }, base));
  }

  // wait for boot (either #screen rows appear, or it stays stuck)
  let booted = false;
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    const rows = await evalJS(`(function(){var sc=document.getElementById('screen');return sc?[].slice.call(sc.children).filter(function(d){return /^\\d+$/.test(d.id);}).length:-1;})()`);
    if (rows > 0) { booted = true; console.log('booted: #screen has ' + rows + ' rows after ' + (i + 1) + 's'); break; }
  }
  if (!booted) console.log('NOT BOOTED after 30s (stuck on loading screen)');

  console.log('\n===== screen after boot =====');
  console.log(await evalJS(DUMP));

  for (const k of KEYS) {
    const t = k.trim();
    if (t === 'RELOAD') {
      console.log('\n===== RELOADING PAGE =====');
      await cmd('Page.reload', { ignoreCache: false });
      let rb = false;
      for (let i = 0; i < 30; i++) {
        await sleep(1000);
        const rows = await evalJS(`(function(){var sc=document.getElementById('screen');return sc?[].slice.call(sc.children).filter(function(d){return /^\\d+$/.test(d.id);}).length:-1;})()`);
        if (rows > 0) { rb = true; console.log('re-booted after ' + (i + 1) + 's'); break; }
      }
      if (!rb) console.log('*** STUCK after reload: no #screen in 30s ***');
      await sleep(500);
      console.log(await evalJS(DUMP));
      continue;
    }
    if (t.startsWith('WAIT')) { await sleep(parseInt(t.slice(4)) || 1000); continue; }
    await key(t);
    await sleep(800);
    console.log('\n===== after key [' + t + '] =====');
    console.log(await evalJS(DUMP));
  }

  console.log('\n===== console / exceptions =====');
  console.log(logs.length ? logs.join('\n') : '(none)');

  ws.close(); chrome.kill();
  setTimeout(() => process.exit(0), 500);
}
main().catch((e) => { console.log('ERR', e); process.exit(1); });
