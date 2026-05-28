import type { Plugin, Connect } from 'vite';
import Anthropic from '@anthropic-ai/sdk';

// ---------------------------------------------------------------------------
// Dev-server endpoint: POST /api/score-descriptions
//
// Batches vacation-rental descriptions and returns a 0–10 quality score per
// listing id using Claude Haiku 4.5. The ANTHROPIC_API_KEY lives here, on the
// server — it is NEVER sent to the browser. If no key is set the endpoint
// returns 503 and the client silently falls back to the heuristic score.
//
// Cost control: the rubric system prompt is marked for prompt caching, the
// client only sends listings it hasn't scored before, and the client caches
// every result in localStorage so each listing is graded at most once.
//
// NOTE: this runs in Vite's dev server. A production static deploy would move
// this exact logic into a serverless function (same request/response shape).
// ---------------------------------------------------------------------------

const MODEL = 'claude-haiku-4-5'; // cheap + fast, as requested
const MAX_BATCH = 50;

// Stable rubric → marked for prompt caching so repeated batches reuse it.
const RUBRIC = `You score vacation-rental listing DESCRIPTIONS for quality on a 0–10 scale.

You are grading ONLY how well-written and informative the description text is — not the price, location, or reviews. Judge:
- Specificity: concrete details (layout, beds, amenities, neighborhood, distances) beat vague claims.
- Completeness: does it cover what a guest needs to decide (space, sleeping, location, vibe)?
- Clarity & structure: well-organized, readable, free of filler and fluff.
- Honesty signals: specific and grounded rather than generic marketing hype.

Scoring guide:
- 9–10: rich, specific, well-structured; a guest could book confidently.
- 6–8: solid, covers the basics with some specifics.
- 3–5: thin or generic; a few useful facts but mostly vague.
- 0–2: almost no useful information.

Return a score for EVERY listing id provided, using the structured output schema.`;

interface ScoreItem {
  id: string;
  title: string;
  description: string;
}

const SCORE_SCHEMA = {
  type: 'object',
  properties: {
    scores: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          score: { type: 'number' },
        },
        required: ['id', 'score'],
        additionalProperties: false,
      },
    },
  },
  required: ['scores'],
  additionalProperties: false,
} as const;

function readJsonBody(req: Connect.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) reject(new Error('payload too large'));
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

export function aiScorePlugin(): Plugin {
  return {
    name: 'tipi-ai-score',
    configureServer(server) {
      server.middlewares.use('/api/score-descriptions', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end('Method Not Allowed');
        }

        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          // No key configured → tell the client to fall back to heuristics.
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }));
        }

        try {
          const body = (await readJsonBody(req)) as { items?: ScoreItem[] };
          const items = (body.items ?? []).slice(0, MAX_BATCH);
          if (!items.length) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ scores: {} }));
          }

          const client = new Anthropic({ apiKey });

          const listingsBlock = items
            .map((it) => `[id: ${it.id}]\nTitle: ${it.title}\nDescription: ${it.description}`)
            .join('\n\n');

          const response = await client.messages.create({
            model: MODEL,
            max_tokens: 4096,
            // Rubric marked for prompt caching — reused across batches.
            system: [{ type: 'text', text: RUBRIC, cache_control: { type: 'ephemeral' } }],
            output_config: { format: { type: 'json_schema', schema: SCORE_SCHEMA } },
            messages: [
              {
                role: 'user',
                content: `Score the description of each listing below.\n\n${listingsBlock}`,
              },
            ],
          });

          const text = response.content.find((b) => b.type === 'text');
          const parsed = text && 'text' in text ? JSON.parse(text.text) : { scores: [] };

          const scores: Record<string, number> = {};
          for (const s of parsed.scores ?? []) {
            const n = Math.max(0, Math.min(10, Number(s.score)));
            if (typeof s.id === 'string' && !Number.isNaN(n)) scores[s.id] = n;
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ scores }));
        } catch (err) {
          server.config.logger.error(`[tipi-ai-score] ${(err as Error).message}`);
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'scoring failed' }));
        }
      });
    },
  };
}
