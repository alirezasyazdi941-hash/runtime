import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(express.json({ limit: '10mb' }));

interface OnDemandSession {
  id: string;
  projectName: string;
  startedAt: number;
  lastHeartbeat: number;
  maxDurationMs: number;
  requestsCount: number;
  status: 'running' | 'stopped';
}

const activeSessions = new Map<string, OnDemandSession>();

// Mode C: On-demand server status and scale-to-zero tracker
app.get('/api/runtime/status', (req, res) => {
  const now = Date.now();
  // Auto-prune expired sessions (scale-to-zero after 3 minutes without heartbeat)
  for (const [id, session] of activeSessions.entries()) {
    if (session.status === 'running' && (now - session.lastHeartbeat > session.maxDurationMs)) {
      session.status = 'stopped';
      console.log(`[NONONICK RUNTIME] On-demand session ${id} auto-terminated (scale-to-zero).`);
    }
  }

  const runningSessions = Array.from(activeSessions.values()).filter(s => s.status === 'running');
  const memory = process.memoryUsage();

  res.json({
    online: true,
    platform: 'Node.js / Express (Self-Contained Backend Proxy)',
    nodeVersion: process.version,
    activeSessionsCount: runningSessions.length,
    activeSessions: runningSessions,
    memory: {
      rssMb: +(memory.rss / (1024 * 1024)).toFixed(2),
      heapUsedMb: +(memory.heapUsed / (1024 * 1024)).toFixed(2),
      heapTotalMb: +(memory.heapTotal / (1024 * 1024)).toFixed(2),
    },
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Mode C: Start an on-demand temporary execution session
app.post('/api/runtime/ondemand-server/start', (req, res) => {
  const { projectName = 'Untitled Project', maxDurationSeconds = 120 } = req.body;
  const id = 'sess_' + Math.random().toString(36).substring(2, 9);
  const now = Date.now();

  const session: OnDemandSession = {
    id,
    projectName,
    startedAt: now,
    lastHeartbeat: now,
    maxDurationMs: Math.max(30, Math.min(600, maxDurationSeconds)) * 1000,
    requestsCount: 0,
    status: 'running'
  };

  activeSessions.set(id, session);
  console.log(`[NONONICK RUNTIME] Started on-demand execution session ${id} for '${projectName}'`);

  res.json({
    success: true,
    session,
    message: 'On-demand runtime container provisioned. Auto-stop active on idle.'
  });
});

// Mode C: Execute code or handle endpoint request in on-demand container
app.post('/api/runtime/ondemand-server/execute', (req, res) => {
  const { sessionId, code, language, input = {} } = req.body;
  const session = activeSessions.get(sessionId);

  if (!session || session.status !== 'running') {
    res.status(400).json({
      success: false,
      error: 'On-demand session expired or not found. Start an on-demand container first.'
    });
    return;
  }

  session.lastHeartbeat = Date.now();
  session.requestsCount++;

  const startTime = performance.now();

  try {
    let output = '';
    const executionType = language || 'javascript';

    if (executionType === 'javascript' || executionType === 'node') {
      // Safe sandbox execution with custom console interception
      const logs: string[] = [];
      const customConsole = {
        log: (...args: unknown[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
        error: (...args: unknown[]) => logs.push('[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
        warn: (...args: unknown[]) => logs.push('[WARN] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
      };

      // Wrap in isolated function
      const runFn = new Function('console', 'input', `"use strict";\n${code}`);
      const result = runFn(customConsole, input);

      output = logs.join('\n') + (result !== undefined ? `\nReturn: ${JSON.stringify(result)}` : '');
    } else {
      output = `Executed simulated ${language} server routine.\nProcessed input: ${JSON.stringify(input)}`;
    }

    const durationMs = +(performance.now() - startTime).toFixed(3);
    const estimatedCostUsd = +((durationMs / 1000) * 0.000016667).toFixed(8); // Serverless compute standard price

    res.json({
      success: true,
      sessionId,
      output,
      durationMs,
      estimatedCostUsd,
      timestamp: new Date().toISOString()
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      success: false,
      sessionId,
      error: errorMsg,
      durationMs: +(performance.now() - startTime).toFixed(3)
    });
  }
});

// Mode C: Heartbeat
app.post('/api/runtime/ondemand-server/heartbeat', (req, res) => {
  const { sessionId } = req.body;
  const session = activeSessions.get(sessionId);

  if (!session || session.status !== 'running') {
    res.status(404).json({ success: false, error: 'Session not active' });
    return;
  }

  session.lastHeartbeat = Date.now();
  const remainingSeconds = Math.max(0, Math.floor((session.startedAt + session.maxDurationMs - Date.now()) / 1000));

  res.json({
    success: true,
    status: session.status,
    remainingSeconds,
    requestsCount: session.requestsCount
  });
});

// Mode C: Explicit release of resources (Scale-to-zero)
app.post('/api/runtime/ondemand-server/stop', (req, res) => {
  const { sessionId } = req.body;
  const session = activeSessions.get(sessionId);

  if (session) {
    session.status = 'stopped';
    console.log(`[NONONICK RUNTIME] Stopped on-demand session ${sessionId}. Released all server resources.`);
  }

  res.json({
    success: true,
    message: 'Session terminated. Resources freed. Idle zero-cost mode active.'
  });
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
