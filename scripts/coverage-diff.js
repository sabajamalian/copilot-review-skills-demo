#!/usr/bin/env node
/* eslint-disable */
/**
 * coverage-diff.js
 *
 * Compares two Jest coverage-summary.json files (base vs head) and emits:
 *   - a markdown summary (stdout, or --md <path>)
 *   - a plain-text summary intended for an LLM prompt (--txt <path>)
 *
 * Usage:
 *   node scripts/coverage-diff.js \
 *     --base coverage-base.json \
 *     --head coverage-head.json \
 *     --md coverage-delta.md \
 *     --txt coverage-delta.txt \
 *     [--repo-root /github/workspace]
 *
 * Either file may be missing; the script handles that gracefully.
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

function safeRead(p) {
  if (!p) return null;
  try {
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function pct(node, key) {
  if (!node || !node[key]) return null;
  const v = node[key].pct;
  if (typeof v !== 'number' || Number.isNaN(v)) return null;
  return v;
}

function fmtPct(v) {
  if (v === null || v === undefined) return 'n/a';
  return `${v.toFixed(2)}%`;
}

function fmtDelta(b, h) {
  if (b === null && h === null) return 'n/a';
  if (b === null) return `+${h.toFixed(2)} (new)`;
  if (h === null) return `-${b.toFixed(2)} (gone)`;
  const d = h - b;
  const sign = d > 0 ? '+' : '';
  return `${sign}${d.toFixed(2)}`;
}

function relativizeKey(key, repoRoot) {
  if (!key) return key;
  if (repoRoot && key.startsWith(repoRoot)) {
    return key.slice(repoRoot.length).replace(/^[\\/]+/, '');
  }
  return key;
}

function buildRows(base, head, repoRoot) {
  const keys = new Set();
  if (base) Object.keys(base).forEach((k) => keys.add(k));
  if (head) Object.keys(head).forEach((k) => keys.add(k));
  keys.delete('total');

  const rows = [];
  for (const key of keys) {
    const b = base ? base[key] : null;
    const h = head ? head[key] : null;
    const metrics = ['lines', 'statements', 'functions', 'branches'];
    const values = {};
    let anyChange = false;
    for (const m of metrics) {
      const bp = pct(b, m);
      const hp = pct(h, m);
      values[m] = { base: bp, head: hp };
      if (bp !== hp) anyChange = true;
    }
    rows.push({
      file: relativizeKey(key, repoRoot),
      values,
      anyChange,
      headLines: pct(h, 'lines'),
    });
  }
  rows.sort((a, b) => {
    const ah = a.headLines === null ? 101 : a.headLines;
    const bh = b.headLines === null ? 101 : b.headLines;
    return ah - bh;
  });
  return rows;
}

function buildMarkdown(base, head, repoRoot) {
  const lines = [];
  lines.push('### Coverage delta (base vs head)');
  lines.push('');
  if (!base && !head) {
    lines.push('_No coverage data available for either base or head._');
    return lines.join('\n');
  }

  const totalBase = base ? base.total : null;
  const totalHead = head ? head.total : null;
  lines.push('| Metric | Base | Head | Delta |');
  lines.push('| --- | ---: | ---: | ---: |');
  for (const m of ['lines', 'statements', 'functions', 'branches']) {
    const bp = pct(totalBase, m);
    const hp = pct(totalHead, m);
    lines.push(
      `| ${m} | ${fmtPct(bp)} | ${fmtPct(hp)} | ${fmtDelta(bp, hp)} |`
    );
  }
  lines.push('');

  const rows = buildRows(base, head, repoRoot);
  const changed = rows.filter((r) => r.anyChange);
  if (changed.length === 0) {
    lines.push('_No per-file coverage changes detected._');
    return lines.join('\n');
  }

  lines.push('<details><summary>Per-file changes</summary>');
  lines.push('');
  lines.push('| File | Lines (base to head) | Branches | Functions | Statements |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const r of changed.slice(0, 50)) {
    const cell = (m) =>
      `${fmtPct(r.values[m].base)} to ${fmtPct(r.values[m].head)} (${fmtDelta(r.values[m].base, r.values[m].head)})`;
    lines.push(
      `| \`${r.file}\` | ${cell('lines')} | ${cell('branches')} | ${cell('functions')} | ${cell('statements')} |`
    );
  }
  if (changed.length > 50) {
    lines.push('');
    lines.push(`_...and ${changed.length - 50} more files with coverage changes._`);
  }
  lines.push('');
  lines.push('</details>');
  return lines.join('\n');
}

function buildPlainText(base, head, repoRoot) {
  const out = [];
  out.push('Coverage delta (base vs head):');
  if (!base && !head) {
    out.push('  (no coverage data)');
    return out.join('\n');
  }
  const totalBase = base ? base.total : null;
  const totalHead = head ? head.total : null;
  for (const m of ['lines', 'statements', 'functions', 'branches']) {
    const bp = pct(totalBase, m);
    const hp = pct(totalHead, m);
    out.push(`  total ${m}: ${fmtPct(bp)} -> ${fmtPct(hp)} (${fmtDelta(bp, hp)})`);
  }

  const rows = buildRows(base, head, repoRoot).filter((r) => r.anyChange);
  if (rows.length) {
    out.push('');
    out.push('Per-file changes (worst-covered head first, top 20):');
    for (const r of rows.slice(0, 20)) {
      out.push(
        `  ${r.file}: lines ${fmtPct(r.values.lines.base)} -> ${fmtPct(r.values.lines.head)}, branches ${fmtPct(r.values.branches.base)} -> ${fmtPct(r.values.branches.head)}, functions ${fmtPct(r.values.functions.base)} -> ${fmtPct(r.values.functions.head)}`
      );
    }
  }
  return out.join('\n');
}

function main() {
  const args = parseArgs(process.argv);
  const base = safeRead(args.base);
  const head = safeRead(args.head);
  const repoRoot = args['repo-root'] || process.cwd();

  const md = buildMarkdown(base, head, repoRoot);
  const txt = buildPlainText(base, head, repoRoot);

  if (args.md) {
    fs.mkdirSync(path.dirname(path.resolve(args.md)), { recursive: true });
    fs.writeFileSync(args.md, md + '\n', 'utf8');
  } else {
    process.stdout.write(md + '\n');
  }
  if (args.txt) {
    fs.mkdirSync(path.dirname(path.resolve(args.txt)), { recursive: true });
    fs.writeFileSync(args.txt, txt + '\n', 'utf8');
  }
}

main();
