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

interface GeminiClientLike {
  models: {
    generateContent(params: {
      model: string;
      contents: string;
      config?: {
        systemInstruction?: string;
        responseMimeType?: string;
      };
    }): Promise<{ text?: string }>;
  };
}

// Initialize Gemini Client
const geminiApiKey = process.env['GEMINI_API_KEY'] || '';
let aiClient: GeminiClientLike | null = null;
if (geminiApiKey) {
  try {
    const { GoogleGenAI } = await import('@google/genai');
    aiClient = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    }) as unknown as GeminiClientLike;
  } catch (err) {
    console.warn('Failed to load @google/genai:', err);
  }
}

const REALITY_MASTER_SYSTEM_INSTRUCTION = `You are REALITY MASTER AI, the central engineering intelligence of NONONICK REALITY FORGE.
You are an elite Spatial Computing & XR software architect holding 14 master roles:
1. Senior XR Software Architect
2. AR/VR Development Engineer
3. Three.js & WebGL Specialist
4. WebXR Specialist
5. Unity & OpenXR Specialist
6. ARKit & RealityKit Specialist
7. ARCore Specialist
8. 3D Graphics Engineer
9. Spatial Computing Researcher
10. Computer Vision Engineer
11. AI Research Assistant
12. Technical Teacher & Mentor
13. Debugging & Optimization Engineer
14. Security Engineer

STRICT CORE PRINCIPLES:
- Answer scientifically and technically, citing authoritative standards (Khronos Group, W3C WebXR Device API, MDN, Three.js Docs, OpenXR, ARKit, ARCore, Apple VisionOS, Meta Horizon SDK).
- Provide real, complete, executable code without lazy placeholders, mock functions, or 'left as exercise'.
- When information or hardware capability is uncertain, explicitly state constraints (e.g. iOS Safari WebXR requires WebXR Viewer or iOS 17+ experimental flags; hit-testing requires 'hit-test' feature flag).
- Teach clearly from beginner to advanced with mathematical intuition (quaternions, transformation matrices, PBR shaders, raymarching, spatial audio).
- Automatically match the language of the prompt (Persian if user asks in Persian, English if user asks in English).
- Explain the rationale for architectural and technical choices.`;

// REALITY MASTER AI Chat Endpoint
app.post('/api/reality-master/chat', async (req, res): Promise<void> => {
  try {
    const { message, history, context, language } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    if (!aiClient) {
      res.json({
        reply: language === 'fa'
          ? 'کلید Gemini API هنوز در محیط سرور تنظیم نشده است. می‌توانید درخواست‌های خود را آزمایش کنید.'
          : 'Gemini API key is not configured on the server. Please check the Secrets panel in AI Studio.',
        citations: ['W3C WebXR Specification', 'Three.js Documentation (r160+)'],
        codeSnippets: []
      });
      return;
    }

    const conversationPrompt = `
User Language Preference: ${language || 'en'}
Current Active Project / Scene Context: ${JSON.stringify(context || {})}
Chat History:
${(history || []).slice(-6).map((h: { role?: string; text?: string }) => `${h.role}: ${h.text}`).join('\n')}

User Message:
${message}
`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: conversationPrompt,
      config: {
        systemInstruction: REALITY_MASTER_SYSTEM_INSTRUCTION,
      },
    });

    res.json({
      reply: response.text || '',
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Internal server error processing AI request';
    console.error('Error in /api/reality-master/chat:', error);
    res.status(500).json({
      error: errorMsg,
    });
  }
});

// AI Project Generator Endpoint
app.post('/api/reality-master/generate-project', async (req, res): Promise<void> => {
  try {
    const { prompt, targetHardware, engine, language } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    if (!aiClient) {
      res.status(503).json({
        error: 'Gemini AI service not initialized. Please verify API key.'
      });
      return;
    }

    const genPrompt = `
Generate a complete, fully engineered XR application blueprint and runnable code.
Prompt: "${prompt}"
Target Hardware: ${targetHardware || 'WebXR (Desktop/Mobile/Headset)'}
Primary Engine: ${engine || 'Three.js (WebGL2 / WebXR)'}
Language: ${language || 'en'}

Return ONLY a valid JSON object matching this schema without markdown fences:
{
  "projectId": "xr-proj-${Date.now()}",
  "name": "Project Name",
  "description": "Comprehensive engineering description",
  "engine": "${engine || 'Three.js'}",
  "targetHardware": "${targetHardware || 'WebXR'}",
  "architectureSummary": "Architectural breakdown and design decisions",
  "hardwareRequirements": ["WebXR Device API", "WebGL2 Context", "Camera access if AR"],
  "fileStructure": [
    {"path": "index.html", "purpose": "App entry point"},
    {"path": "src/scene.js", "purpose": "Three.js Scene, Camera, WebXR setup"},
    {"path": "src/interaction.js", "purpose": "Raycasting and controller handling"}
  ],
  "runnableCode": "// Complete, copy-pasteable runnable Three.js or WebXR code here",
  "testSuite": "// Executable tests or validation checks (e.g. check WebGL2 context, check WebXR session support)",
  "deploymentGuide": "Step-by-step deployment and runtime instructions",
  "limitationsAndFallbacks": "Known browser limitations and fallbacks"
}
`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: genPrompt,
      config: {
        systemInstruction: REALITY_MASTER_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to generate project with AI';
    console.error('Error in /api/reality-master/generate-project:', error);
    res.status(500).json({
      error: errorMsg,
    });
  }
});

// Code Analysis & Debugger Endpoint
app.post('/api/reality-master/analyze-code', async (req, res): Promise<void> => {
  try {
    const { code, errorLog, goal, language } = req.body;
    if (!code) {
      res.status(400).json({ error: 'Code is required' });
      return;
    }

    if (!aiClient) {
      res.status(503).json({ error: 'Gemini AI service not initialized' });
      return;
    }

    const debugPrompt = `
Analyze, debug, and optimize the following XR / 3D / WebXR / Three.js code.
User Goal: ${goal || 'Identify bugs, performance bottlenecks, and version issues'}
Error Log (if any): ${errorLog || 'None reported'}
Language: ${language || 'en'}

Code to analyze:
\`\`\`
${code}
\`\`\`

Return a JSON object matching this structure:
{
  "summary": "High-level diagnostic summary",
  "detectedIssues": [
    {"type": "error|warning|performance|version", "line": 0, "message": "Issue details", "suggestion": "How to fix"}
  ],
  "versionCompatibility": "Assessment of Three.js / WebXR / browser version compatibility",
  "optimizedCode": "// Fully corrected, runnable, pristine code without bugs",
  "explanation": "Why these changes were made with mathematical and engineering reasons"
}
`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: debugPrompt,
      config: {
        systemInstruction: REALITY_MASTER_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to analyze code';
    console.error('Error in /api/reality-master/analyze-code:', error);
    res.status(500).json({ error: errorMsg });
  }
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
