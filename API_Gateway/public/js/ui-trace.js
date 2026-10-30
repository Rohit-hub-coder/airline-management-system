// ui-trace.js - Distributed Pipeline Visualizer, Terminal Activity Log, Request Inspector & RabbitMQ Proof
const UITrace = (() => {

  function render(pipelineMountId, logsMountId, rmqMountId) {
    renderPipeline(pipelineMountId);
    renderLogs(logsMountId);
    renderRabbitMQ(rmqMountId);
  }

  // 1. Visual Pipeline Diagram
  function renderPipeline(mountId = 'pipelineMount') {
    const el = document.getElementById(mountId);
    if (!el) return;

    el.innerHTML = `
      <section class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <h3 class="font-bold text-sm text-white flex items-center gap-2">
              <span>⚡ Live Distributed Transaction Pipeline</span>
            </h3>
            <p class="text-xs text-slate-400">Visualizing real-time propagation across microservices & asynchronous message broker</p>
          </div>
          <span id="pipelineStatusPill" class="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            Idle • Ready
          </span>
        </div>

        <!-- Pipeline Nodes Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-2 text-center text-xs">
          <!-- Node 1: Browser -->
          <div id="pnode-browser" title="Client UI: Browser originating HTTP requests" class="pipeline-node bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div class="text-base">💻</div>
            <div class="font-bold text-white text-[11px]">Client UI</div>
            <div class="text-[10px] text-slate-500 font-mono">Browser</div>
          </div>

          <!-- Node 2: Gateway -->
          <div id="pnode-gateway" title="API Gateway: Perimeter proxy validating JWT signature" class="pipeline-node bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div class="text-base">🛡️</div>
            <div class="font-bold text-white text-[11px]">API Gateway</div>
            <div class="text-[10px] text-slate-500 font-mono">:3004 • JWT</div>
          </div>

          <!-- Node 3: Service -->
          <div id="pnode-service" title="Booking Service: Manages reservations and local ACID transaction" class="pipeline-node bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div class="text-base">🎫</div>
            <div class="font-bold text-white text-[11px]">Booking Svc</div>
            <div class="text-[10px] text-slate-500 font-mono">:3002 • ACID</div>
          </div>

          <!-- Node 4: Flights -->
          <div id="pnode-flights" title="Flight Service: Atomic conditional seat updates" class="pipeline-node bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div class="text-base">✈️</div>
            <div class="font-bold text-white text-[11px]">Flights Svc</div>
            <div class="text-[10px] text-slate-500 font-mono">:3000 • Atomic</div>
          </div>

          <!-- Node 5: MySQL & Outbox -->
          <div id="pnode-outbox" title="Outbox Table: Stores events in MySQL inside the ACID booking transaction. Background poller runs every 5 seconds." class="pipeline-node bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 cursor-help">
            <div class="text-base">📦</div>
            <div class="font-bold text-white text-[11px]">Outbox Table</div>
            <div class="text-[10px] text-slate-500 font-mono">MySQL 8.0</div>
          </div>

          <!-- Node 6: RabbitMQ -->
          <div id="pnode-rabbitmq" title="RabbitMQ Broker: Receives events when the 5s Outbox poller runs. This node lights up when the published counter increments." class="pipeline-node bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 cursor-help">
            <div class="text-base">🐰</div>
            <div class="font-bold text-white text-[11px]">RabbitMQ</div>
            <div class="text-[10px] text-slate-500 font-mono">AMQP :5672</div>
          </div>

          <!-- Node 7: Reminder -->
          <div id="pnode-reminder" title="Reminder Service: AMQP consumer worker processing REMINDER_QUEUE. Lights up when acknowledged counter increments." class="pipeline-node bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div class="text-base">📢</div>
            <div class="font-bold text-white text-[11px]">Reminder Svc</div>
            <div class="text-[10px] text-slate-500 font-mono">:3003 • Worker</div>
          </div>

          <!-- Node 8: Email (Ethereal sandbox) -->
          <div id="pnode-email" title="Email: Dispatched to Ethereal sandbox SMTP. Lights up when message is acknowledged." class="pipeline-node bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div class="text-base">✉️</div>
            <div class="font-bold text-white text-[11px]">Email</div>
            <div class="text-[10px] text-slate-500 font-mono">Ethereal sandbox</div>
          </div>
        </div>

        <!-- Interview Mode Note for Outbox Poller (Requirement 3) -->
        <div class="interview-callout ${State.get().interviewMode ? 'block' : 'hidden'} text-xs bg-blue-950/40 border border-blue-500/30 text-blue-200 rounded-xl p-3 space-y-1">
          <div class="font-bold flex items-center gap-1.5 text-blue-400">
            <span>⏱️ 5-Second Transactional Outbox Poller Notice</span>
          </div>
          <p class="text-[11px] text-slate-300">
            The Booking Service runs a background poller every <strong>5 seconds</strong> via <code>setInterval</code>. When you click <em>Book Seats</em>, the booking record and outbox event are immediately committed in MySQL. The <strong>RabbitMQ</strong> node lights up when the published counter increments, and the <strong>Reminder Svc ➔ Email</strong> nodes light up when the message is acknowledged!
          </p>
        </div>
      </section>
    `;
  }

  function pulseNode(nodeId, isSuccess = true, duration = 1400) {
    const el = document.getElementById(nodeId);
    if (!el) return;
    el.classList.remove('active-success', 'active-error');
    void el.offsetWidth;
    el.classList.add(isSuccess ? 'active-success' : 'active-error');
    setTimeout(() => {
      el.classList.remove('active-success', 'active-error');
    }, duration);
  }

  // Trigger visual wave across pipeline nodes based on real responses/changes
  function triggerPipelineAnimation(trace) {
    if (!trace) return;
    const { method, path, success, status } = trace;
    const pill = document.getElementById('pipelineStatusPill');

    // 1. Every HTTP request comes from Browser -> Gateway
    pulseNode('pnode-browser', success);
    setTimeout(() => pulseNode('pnode-gateway', success), 120);

    // 2. Booking Creation Flow: Browser -> Gateway -> Booking -> Flights -> Outbox -> RabbitMQ -> Reminder -> Email
    if (path.includes('/api/v1/bookings') && method === 'POST') {
      if (success) {
        setTimeout(() => pulseNode('pnode-service', true), 240);
        setTimeout(() => pulseNode('pnode-flights', true), 360);
        setTimeout(() => pulseNode('pnode-outbox', true), 480);

        if (pill) {
          pill.textContent = 'Booking Confirmed • Waiting for 5s Outbox Poller...';
          pill.className = 'text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20';
        }

        // Real response proof: poll RabbitMQ published and acknowledged counters independently
        const initialPublished = Number(State.get().health?.rabbitmq?.stats?.published) || 0;
        const initialAcked = Number(State.get().health?.rabbitmq?.stats?.acknowledged ?? State.get().health?.rabbitmq?.stats?.delivered) || 0;
        let rabbitLit = false;
        let reminderLit = false;
        let pollCount = 0;

        const outboxInterval = setInterval(async () => {
          pollCount++;
          const rmqRes = await API.checkRabbitMQStatus();
          State.setHealth({ rabbitmq: rmqRes });
          const currentPublished = Number(rmqRes.stats?.published) || 0;
          const currentAcked = Number(rmqRes.stats?.acknowledged ?? rmqRes.stats?.delivered) || 0;

          // A. Light RabbitMQ node when published counter increments
          if (!rabbitLit && (currentPublished > initialPublished || (initialPublished === 0 && currentPublished > 0))) {
            rabbitLit = true;
            pulseNode('pnode-rabbitmq', true, 2500);
            if (pill && !reminderLit) {
              pill.textContent = 'Outbox Polled ➔ Published to RabbitMQ';
              pill.className = 'text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20';
            }
          }

          // B. Light Reminder and Email nodes only when acknowledged (or delivered) counter increments
          if (!reminderLit && (currentAcked > initialAcked || (initialAcked === 0 && currentAcked > 0))) {
            reminderLit = true;
            if (!rabbitLit) {
              rabbitLit = true;
              pulseNode('pnode-rabbitmq', true, 2000);
            }
            setTimeout(() => pulseNode('pnode-reminder', true, 2000), 100);
            setTimeout(() => pulseNode('pnode-email', true, 2000), 250);

            if (pill) {
              pill.textContent = 'Acknowledged by Reminder Svc ➔ Email Dispatched';
              pill.className = 'text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            }
          }

          if ((rabbitLit && reminderLit) || pollCount >= 8) {
            clearInterval(outboxInterval);
          }
        }, 1500);
      } else {
        setTimeout(() => pulseNode('pnode-service', false), 240);
        if (pill) {
          pill.textContent = `Refused: HTTP ${status}`;
          pill.className = 'text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20';
        }
      }
      return;
    }

    // 3. Booking Cancellation Flow: Browser -> Gateway -> Booking -> Flights (compensate restore)
    if (path.includes('/cancel')) {
      if (success) {
        setTimeout(() => pulseNode('pnode-service', true), 240);
        setTimeout(() => pulseNode('pnode-flights', true), 360);
        if (pill) {
          pill.textContent = 'Cancelled • Seats Restored';
          pill.className = 'text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
        }
      }
      return;
    }

    // 4. Flights Catalog Flow: Browser -> Gateway -> Flights
    if (path.includes('/flights')) {
      setTimeout(() => pulseNode('pnode-flights', success), 240);
      if (pill) {
        pill.textContent = success ? 'Flights Catalog Queried' : `Error: HTTP ${status}`;
        pill.className = `text-[11px] font-mono px-2.5 py-0.5 rounded-full ${success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`;
      }
      return;
    }

    // 5. Auth / General Flow
    if (pill) {
      pill.textContent = success ? `Success: HTTP ${status}` : `Error: HTTP ${status}`;
      pill.className = `text-[11px] font-mono px-2.5 py-0.5 rounded-full ${success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`;
    }
  }

  // 2. Terminal-Style Activity Log
  function renderLogs(mountId = 'logsMount') {
    const el = document.getElementById(mountId);
    if (!el) return;

    const traces = State.get().traceEvents || [];

    el.innerHTML = `
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-rose-500/80"></div>
            <div class="w-3 h-3 rounded-full bg-amber-500/80"></div>
            <div class="w-3 h-3 rounded-full bg-emerald-500/80"></div>
            <h4 class="font-bold text-xs text-white ml-1 font-mono">Distributed Activity Log</h4>
          </div>
          <span class="text-[10px] text-slate-500 font-mono">Click entry to inspect payload</span>
        </div>

        <div id="terminalLogList" class="terminal-scroll space-y-1.5 font-mono text-[11px] max-h-60 overflow-y-auto pr-1">
          ${traces.length === 0 ? `
            <div class="text-slate-500 py-6 text-center">No transactions recorded yet. Perform an action to see real-time HTTP traces.</div>
          ` : traces.map((t, idx) => {
            const time = new Date(t.timestamp).toLocaleTimeString();
            const isSuccess = t.success;
            return `
              <div onclick="UITrace.openInspector(${idx})" class="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 hover:border-blue-500/50 hover:bg-slate-950 cursor-pointer transition flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 truncate">
                  <span class="text-slate-500 text-[10px]">[${time}]</span>
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${isSuccess ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}">${t.method}</span>
                  <span class="text-slate-300 truncate">${t.path}</span>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                  <span class="${isSuccess ? 'text-emerald-400' : 'text-rose-400'} font-semibold">${t.status}</span>
                  <span class="text-slate-500 text-[10px]">${t.durationMs}ms</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // 3. RabbitMQ Management Telemetry Panel
  function renderRabbitMQ(mountId = 'rabbitmqMount') {
    const el = document.getElementById(mountId);
    if (!el) return;

    const rmq = State.get().health.rabbitmq || {};
    const stats = rmq.stats || {};

    const readyText = stats.messages_ready !== undefined && stats.messages_ready !== 'n/a' ? stats.messages_ready : '0';
    const consumersText = stats.consumers !== undefined && stats.consumers !== 'n/a' ? stats.consumers : '1';
    const publishedText = stats.published !== undefined && stats.published !== 'n/a' ? stats.published : 'no events yet';

    el.innerHTML = `
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-2">
            <span class="text-base">🐰</span>
            <h4 class="font-bold text-xs text-white">RabbitMQ Queue Telemetry</h4>
          </div>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded-full ${rmq.status === 'up' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}">
            ${rmq.status === 'up' ? 'Broker Connected' : 'Broker Offline'}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2.5 text-xs font-mono">
          <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
            <div class="text-[10px] text-slate-500">Queue Name:</div>
            <div class="font-bold text-blue-400 truncate">${stats.name || 'REMINDER_QUEUE'}</div>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
            <div class="text-[10px] text-slate-500">Ready Messages:</div>
            <div class="font-bold ${readyText === 0 ? 'text-emerald-400' : 'text-amber-400'}">${readyText}</div>
            <div class="text-[9px] text-slate-500 italic">Ready = 0 (Consumed immediately)</div>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
            <div class="text-[10px] text-slate-500">Active Consumers:</div>
            <div class="font-bold text-white">${consumersText} worker</div>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
            <div class="text-[10px] text-slate-500">Events Published:</div>
            <div class="font-bold text-emerald-400">${publishedText}</div>
          </div>
        </div>

        <!-- Dashboard Link Button -->
        <div class="flex items-center justify-between pt-1">
          <a href="http://localhost:15672" target="_blank" class="text-xs px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 transition flex items-center gap-1.5">
            <span>Open RabbitMQ Dashboard (guest / guest) ↗</span>
          </a>
          <button onclick="UITrace.refreshRabbitMQ()" class="text-xs text-slate-400 hover:text-slate-200">
            🔄 Refresh
          </button>
        </div>
      </div>
    `;
  }

  // 4. Request / Response Inspector Drawer
  function openInspector(traceIndex) {
    const traces = State.get().traceEvents || [];
    const t = traces[traceIndex];
    if (!t) return;

    let drawer = document.getElementById('traceInspectorModal');
    if (!drawer) {
      drawer = document.createElement('div');
      drawer.id = 'traceInspectorModal';
      document.body.appendChild(drawer);
    }

    drawer.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm';
    drawer.innerHTML = `
      <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-mono text-xs">
        <!-- Header -->
        <div class="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${t.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}">
              ${t.method}
            </span>
            <span class="text-white font-bold truncate">${t.path}</span>
          </div>
          <button onclick="document.getElementById('traceInspectorModal').remove()" class="text-slate-400 hover:text-white text-base">✕</button>
        </div>

        <!-- Body -->
        <div class="p-5 space-y-4 overflow-y-auto flex-1">
          <!-- Metadata -->
          <div class="grid grid-cols-3 gap-2 text-[11px]">
            <div class="p-2 rounded bg-slate-950 border border-slate-800">
              <span class="text-slate-500">Status:</span> <span class="${t.success ? 'text-emerald-400' : 'text-rose-400'}">${t.status}</span>
            </div>
            <div class="p-2 rounded bg-slate-950 border border-slate-800">
              <span class="text-slate-500">Latency:</span> <span class="text-blue-400">${t.durationMs}ms</span>
            </div>
            <div class="p-2 rounded bg-slate-950 border border-slate-800 truncate">
              <span class="text-slate-500">Correlation ID:</span> <span class="text-slate-300 truncate">${t.id}</span>
            </div>
          </div>

          <!-- Request Payload -->
          <div>
            <div class="text-[10px] text-slate-400 mb-1">Request Payload:</div>
            <pre class="p-3 rounded-xl bg-slate-950 text-blue-300 border border-slate-800 overflow-x-auto text-[11px]">${JSON.stringify(t.reqBody || 'None', null, 2)}</pre>
          </div>

          <!-- Response Payload -->
          <div>
            <div class="text-[10px] text-slate-400 mb-1">Response JSON:</div>
            <pre class="p-3 rounded-xl bg-slate-950 text-emerald-300 border border-slate-800 overflow-x-auto text-[11px]">${JSON.stringify(t.resBody || 'Empty', null, 2)}</pre>
          </div>
        </div>
      </div>
    `;
  }

  async function refreshRabbitMQ() {
    const res = await API.checkRabbitMQStatus();
    State.setHealth({ rabbitmq: res });
    renderRabbitMQ('rabbitmqMount');
  }

  // Subscribe to changes
  State.subscribe('traceEvents', () => {
    renderLogs('logsMount');
    const lastTrace = State.get().traceEvents[0];
    if (lastTrace) {
      triggerPipelineAnimation(lastTrace);
    }
  });
  State.subscribe('health', () => renderRabbitMQ('rabbitmqMount'));
  State.subscribe('interviewMode', () => {
    renderPipeline('pipelineMount');
  });

  return {
    render,
    openInspector,
    refreshRabbitMQ,
    triggerPipelineAnimation
  };
})();

window.UITrace = UITrace;
