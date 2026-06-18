#!/usr/bin/env node
/* eslint-disable */
/**
 * build-copilot-prompt.js
 *
 * Builds the headless Copilot CLI prompt by composing:
 *   - a fixed instruction block,
 *   - the plain-text coverage delta,
 *   - the (truncated) git diff for the PR.
 *
 * Usage:
 *   node scripts/build-copilot-prompt.js \
 *     --coverage coverage-delta.txt \
 *     --diff pr.diff \
 *     --out prompt.txt \
 *     [--max-diff-bytes 150000]
 *
 * Zero external dependencies.
 */

'use strict';

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      out[a.slice(2)] = argv[i + 1];
      i++;
    }
  }
  return out;
}

function readSafe(p) {
  if (!p) return '';
  try {
    return fs.readFileSync(p, 'utf8');
  } catch (e) {
    return '';
  }
}

function truncate(s, maxBytes) {
  const buf = Buffer.from(s, 'utf8');
  if (buf.length <= maxBytes) return { text: s, truncated: false, originalBytes: buf.length };
  const slice = buf.slice(0, maxBytes).toString('utf8');
  return { text: slice, truncated: true, originalBytes: buf.length };
}

const INSTRUCTIONS = [
  'You are reviewing a pull request in a Node.js + TypeScript Express',
  'REST API that uses Jest + Supertest for tests under tests/.',
  '',
  'Your task: based on the coverage delta and the unified PR diff below,',
  'suggest concrete additional unit tests that would meaningfully improve',
  'test coverage of the changed code.',
  '',
  'Requirements for your output:',
  '- Pure GitHub-flavored markdown. No preamble, no closing pleasantries.',
  '- Do NOT include emojis. Do NOT use em dashes or en dashes; use commas,',
  '  colons, parentheses, or the word "to" for ranges.',
  '- Group suggestions by source file under level-3 headings (### path).',
  '- For each file, list 3 to 8 specific test ideas as bullet points.',
  '  Each bullet should describe the scenario, the expected behavior, and',
  '  the assertion target (status code, response shape, side effect, etc.).',
  '- Where helpful, include a short Jest + Supertest code snippet in a',
  '  fenced ```ts block. Keep snippets under ~25 lines each.',
  '- Prioritize: branches uncovered on head, new code paths introduced by',
  '  the diff, and error/edge-case handling.',
  '- If a changed file already has solid coverage and you have no useful',
  '  suggestions, say so in one short sentence under that file\'s heading',
  '  rather than padding.',
  '- End with a single "## Summary" section listing the top 3 highest-',
  '  value tests to add first.',
].join('\n');

function main() {
  const args = parseArgs(process.argv);
  const out = args.out || 'prompt.txt';
  const maxDiff = parseInt(args['max-diff-bytes'] || '150000', 10);

  const coverage = readSafe(args.coverage).trim();
  const rawDiff = readSafe(args.diff);
  const { text: diff, truncated, originalBytes } = truncate(rawDiff, maxDiff);

  const parts = [];
  parts.push(INSTRUCTIONS);
  parts.push('');
  parts.push('## Coverage delta');
  parts.push('');
  parts.push(coverage || '(no coverage data available)');
  parts.push('');
  parts.push('## PR diff (unified)');
  if (truncated) {
    parts.push('');
    parts.push(
      `_Diff truncated to ${maxDiff} bytes for prompt size; original was ${originalBytes} bytes._`
    );
  }
  parts.push('');
  parts.push('```diff');
  parts.push(diff || '(empty diff)');
  parts.push('```');

  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, parts.join('\n'), 'utf8');
  process.stderr.write(
    `Wrote prompt to ${out} (diff bytes: ${originalBytes}, truncated: ${truncated})\n`
  );
}

main();
