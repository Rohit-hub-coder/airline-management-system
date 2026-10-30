const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// 1. Resolve WebSocket implementation (built-in Node 21+ or 'ws' package)
let WSClient = typeof WebSocket !== 'undefined' ? WebSocket : null;
if (!WSClient) {
  try {
    WSClient = require('ws');
  } catch (_) {
    console.error(`
================================================================================
[DEPENDENCY ERROR] WebSocket client unavailable!
Node.js 21+ includes global WebSocket by default.
For earlier Node versions, please run: npm install ws
================================================================================
`);
    process.exit(1);
  }
}

// 2. Resolve Chromium browser executable path
function findBrowserExecutable() {
  const customPath = process.env.CHROME_PATH || process.env.BROWSER_PATH;
  if (customPath && fs.existsSync(customPath)) {
    return customPath;
  }

  const userHome = os.homedir();
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(userHome, 'AppData', 'Local', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    path.join(userHome, 'AppData', 'Local', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  console.error(`
================================================================================
[DEPENDENCY ERROR] No compatible Chromium-based browser found!
Checked paths:
${candidates.map(c => '  - ' + c).join('\n')}

Please install Google Chrome or Microsoft Edge, or set the CHROME_PATH environment
variable:
  $env:CHROME_PATH = "C:\\path\\to\\chrome.exe"
================================================================================
`);
  process.exit(1);
}

async function getWsUrl(port) {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        const data = await res.json();
        return data.webSocketDebuggerUrl;
      }
    } catch (_) {}
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error('Chrome remote debugging port not reachable on 127.0.0.1:' + port);
}

async function runBrowserTest() {
  const browserPath = findBrowserExecutable();
  console.log(`Using Chromium browser: ${browserPath}`);

  // Confirm API Gateway is alive
  try {
    const healthCheck = await fetch('http://localhost:3004/api/v1/health');
    if (!healthCheck.ok) throw new Error(`Gateway returned HTTP ${healthCheck.status}`);
  } catch (err) {
    console.error(`
================================================================================
[PRE-FLIGHT ERROR] API Gateway is not reachable at http://localhost:3004/api/v1/health
Reason: ${err.message}
Please ensure the Docker containers are running (docker compose up -d or .\\start.cmd).
================================================================================
`);
    process.exit(1);
  }

  const debugPort = 9222;
  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-e2e-'));
  console.log(`Spawning headless browser on remote debugging port ${debugPort}...`);
  const chromeProc = spawn(browserPath, [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${tmpProfile}`,
    '--disable-gpu',
    '--no-sandbox',
    'about:blank'
  ]);

  try {
    const wsUrl = await getWsUrl(debugPort);
    const ws = new WSClient(wsUrl);

    let id = 1;
    function send(method, params = {}, sessionId = undefined) {
      return new Promise((resolve, reject) => {
        const msgId = id++;
        const payload = { id: msgId, method, params };
        if (sessionId) payload.sessionId = sessionId;

        const handler = (evt) => {
          const raw = typeof evt.data === 'string' ? evt.data : evt;
          const msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (msg.id === msgId) {
            ws.removeEventListener('message', handler);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify(payload));
      });
    }

    await new Promise((resolve) => ws.onopen = resolve);

    const targetsRes = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
    const targets = await targetsRes.json();
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];

    const attachRes = await send('Target.attachToTarget', { targetId: pageTarget.id, flatten: true });
    const sessionId = attachRes.sessionId;

    ws.addEventListener('message', (evt) => {
      try {
        const raw = typeof evt.data === 'string' ? evt.data : evt;
        const msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (msg.method === 'Runtime.consoleAPICalled') {
          const text = msg.params.args.map(a => a.value || a.description).join(' ');
          if (!text.includes('tailwindcss')) {
            console.log(`[Browser Console] ${text}`);
          }
        } else if (msg.method === 'Runtime.exceptionThrown') {
          console.error(`[Browser Error] ${msg.params.exceptionDetails?.text} ${msg.params.exceptionDetails?.exception?.description}`);
        }
      } catch (_) {}
    });

    await send('Page.enable', {}, sessionId);
    await send('Runtime.enable', {}, sessionId);

    console.log('Navigating to http://localhost:3004/...');
    const loadPromise = new Promise(resolve => {
      const handler = (evt) => {
        try {
          const raw = typeof evt.data === 'string' ? evt.data : evt;
          const msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (msg.method === 'Page.loadEventFired') {
            ws.removeEventListener('message', handler);
            resolve();
          }
        } catch (_) {}
      };
      ws.addEventListener('message', handler);
    });

    await send('Page.navigate', { url: 'http://localhost:3004/' }, sessionId);
    await loadPromise;
    await new Promise(r => setTimeout(r, 1000));

    console.log('Invoking window.E2ERunner.runAll() in browser context...');
    const evalRes = await send('Runtime.evaluate', {
      expression: `(async () => {
        const res = await window.E2ERunner.runAll();
        const checks = window.E2ERunner.CHECKS.map((name, i) => {
          const el = document.getElementById('check_' + i);
          const isPassed = el ? el.classList.contains('text-emerald-300') : false;
          return { index: i + 1, name, passed: isPassed };
        });
        return { ...res, checklist: checks };
      })()`,
      awaitPromise: true,
      returnByValue: true
    }, sessionId);

    const result = evalRes.result?.value;
    console.log('\n--- Checklist Results ---');
    if (result?.checklist) {
      result.checklist.forEach(c => {
        console.log(`  ${c.passed ? '[PASS]' : '[FAIL]'} ${c.index}. ${c.name}`);
      });
    }

    console.log('\n--- Summary ---');
    console.log(`Passed: ${result?.passed}/${result?.total}, Failed: ${result?.failed}`);

    if (result && result.passed === result.total && result.failed === 0) {
      console.log(`\n🎉 BROWSER SELF-TEST SUCCESS: All ${result.passed} assertions passed!`);
    } else {
      process.exitCode = 1;
    }

    try { ws.close(); } catch (_) {}
  } finally {
    try {
      chromeProc.kill('SIGKILL');
    } catch (_) {}
    try {
      if (tmpProfile && fs.existsSync(tmpProfile)) {
        fs.rmSync(tmpProfile, { recursive: true, force: true });
      }
    } catch (_) {}
  }
}

runBrowserTest().catch(err => {
  console.error('Browser test runner encountered an error:', err);
  process.exit(1);
});
