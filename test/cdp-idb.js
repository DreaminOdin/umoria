// cdp-idb.js -- test whether a blocked/hanging IndexedDB stalls the engine on
// the loading screen (reproduces Brave Shields / private-mode style failures).
const { spawn } = require('child_process');
const os = require('os'); const path = require('path');
const URL = process.argv[2] || 'https://dreaminodin.github.io/umoria/';
const MODE = process.argv[3] || 'hang'; // 'hang' | 'throw' | 'normal'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9700 + Math.floor(Math.random() * 200);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const BREAK = {
  hang: `Object.defineProperty(window,'indexedDB',{configurable:true,get:function(){return {open:function(){return {result:null,addEventListener:function(){},removeEventListener:function(){}};},deleteDatabase:function(){return {addEventListener:function(){}};}};}});`,
  throw: `Object.defineProperty(window,'indexedDB',{configurable:true,get:function(){throw new Error('IndexedDB blocked');}});`,
  normal: `void 0;`
};

async function main() {
  const profile = path.join(os.tmpdir(), 'idb_' + Date.now());
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=' + PORT, '--remote-allow-origins=*', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
  let wsUrl = null;
  for (let i = 0; i < 60 && !wsUrl; i++) { await sleep(500); try { const r = await fetch('http://127.0.0.1:' + PORT + '/json/list'); const l = await r.json(); const p = l.find((t) => t.type === 'page' && t.webSocketDebuggerUrl); if (p) wsUrl = p.webSocketDebuggerUrl; } catch (e) {} }
  if (!wsUrl) { console.log('NO WS'); chrome.kill(); return; }
  const ws = new WebSocket(wsUrl); let id = 0; const pending = new Map();
  ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  await new Promise((r) => ws.addEventListener('open', r));
  const cmd = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await cmd('Page.enable'); await cmd('Runtime.enable');
  await cmd('Page.addScriptToEvaluateOnNewDocument', { source: '(function(){try{' + BREAK[MODE] + '}catch(e){}})();' });
  await cmd('Page.navigate', { url: URL });
  let booted = false;
  for (let i = 0; i < 20; i++) {
    await sleep(1000);
    const r = await cmd('Runtime.evaluate', { expression: `(function(){var sc=document.getElementById('screen');return sc?[].slice.call(sc.children).filter(function(d){return /^\\d+$/.test(d.id);}).length:-1;})()`, returnByValue: true });
    const rows = r.result && r.result.result ? r.result.result.value : -1;
    if (rows > 0) { booted = true; console.log('[' + MODE + '] BOOTED after ' + (i + 1) + 's (rows=' + rows + ')'); break; }
  }
  if (!booted) console.log('[' + MODE + '] *** STUCK on loading (no #screen in 20s) ***');
  ws.close(); chrome.kill(); setTimeout(() => process.exit(0), 300);
}
main();
