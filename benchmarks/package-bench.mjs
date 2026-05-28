import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import {
  createFixedLayout,
  createTextLayout,
  virtualize,
  virtualizeFrustum
} from '../dist/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(__dirname, '..');
const repoRoot = path.resolve(packageDir, '..', '..');
const args = parseArgs(process.argv.slice(2));
const rounds = readPositiveInt(args.rounds, 9);
const rows = readPositiveInt(args.rows, 5000);
const outPath = args.out ? path.resolve(repoRoot, args.out) : null;
let sink = 0;

const results = [
  measureVirtualizeFixedRows(rows),
  measureVirtualizeTextRows(Math.min(rows, 3000)),
  measureFrustumCull(rows)
];

const report = {
  package: '@shapeshift-labs/frontier-virtual',
  version: readPackageVersion(),
  generatedAt: new Date().toISOString(),
  node: process.version,
  platform: process.platform + ' ' + process.arch,
  rows,
  rounds,
  rowsOut: results
};

if (outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');
}

console.log(report.package + ' package benchmark');
console.log('Node ' + report.node + ' on ' + report.platform + ', rows=' + rows + ', rounds=' + rounds);
console.log('');
console.log(padRight('Fixture', 42) + padLeft('Median', 12) + padLeft('p95', 12));
for (const row of results) {
  console.log(padRight(row.fixture, 42) + padLeft(formatUs(row.medianUs), 12) + padLeft(formatUs(row.p95Us), 12));
}
if (outPath) console.log('\nwrote ' + path.relative(repoRoot, outPath));
if (sink === 42) console.log('sink=' + sink);

function measureVirtualizeFixedRows(rowCount) {
  const items = makeRows(rowCount);
  const layout = createFixedLayout(24);
  const samples = [];
  for (let round = 0; round < rounds; round++) {
    const offset = (round * 97) % Math.max(1, rowCount * 24 - 600);
    const start = performance.now();
    const range = virtualize({ items, keyBy: 'id', viewport: { offset, size: 600 }, layout, overscan: 4 });
    samples[samples.length] = (performance.now() - start) * 1000;
    sink += range.items.length;
  }
  return summarize('Virtualize fixed rows, ' + rowCount + ' rows', samples);
}

function measureVirtualizeTextRows(rowCount) {
  const items = makeRows(rowCount).map((row, index) => ({
    ...row,
    body: row.body + ' '.repeat(index % 20) + 'extra body copy'
  }));
  const layout = createTextLayout({ field: 'body', font: '14px Inter', lineHeight: 20, width: 320 });
  const samples = [];
  for (let round = 0; round < rounds; round++) {
    const offset = (round * 113) % Math.max(1, rowCount * 24 - 600);
    const start = performance.now();
    const range = virtualize({ items, keyBy: 'id', viewport: { offset, size: 600, crossSize: 320 }, layout, overscan: 4 });
    samples[samples.length] = (performance.now() - start) * 1000;
    sink += range.totalSize;
  }
  return summarize('Virtualize text rows, ' + rowCount + ' rows', samples);
}

function measureFrustumCull(rowCount) {
  const boxes = new Array(rowCount);
  for (let i = 0; i < rowCount; i++) {
    const x = i % 100;
    const y = Math.floor(i / 100);
    boxes[i] = { key: 'box-' + i, minX: x, minY: y, minZ: 0, maxX: x + 0.5, maxY: y + 0.5, maxZ: 1 };
  }
  const frustum = {
    planes: [
      { x: 1, y: 0, z: 0, w: 10 },
      { x: -1, y: 0, z: 0, w: 60 },
      { x: 0, y: 1, z: 0, w: 10 },
      { x: 0, y: -1, z: 0, w: 60 },
      { x: 0, y: 0, z: 1, w: 10 },
      { x: 0, y: 0, z: -1, w: 10 }
    ]
  };
  const samples = [];
  for (let round = 0; round < rounds; round++) {
    const start = performance.now();
    const visible = virtualizeFrustum(boxes, frustum);
    samples[samples.length] = (performance.now() - start) * 1000;
    sink += visible.length;
  }
  return summarize('Virtualize 3D frustum boxes, ' + rowCount + ' boxes', samples);
}

function summarize(fixture, samples) {
  samples.sort((left, right) => left - right);
  return {
    category: 'virtualization',
    fixture,
    library: 'frontier.virtual',
    status: 'ok',
    runs: samples.length,
    medianUs: round(percentile(samples, 0.5)),
    p95Us: round(percentile(samples, 0.95)),
    minUs: round(samples[0]),
    maxUs: round(samples[samples.length - 1]),
    note: 'DOM-neutral Frontier virtualization prototype'
  };
}

function makeRows(count) {
  const rows = new Array(count);
  for (let i = 0; i < count; i++) rows[i] = { id: 'row-' + i, body: 'Row ' + i };
  return rows;
}

function percentile(sorted, fraction) {
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1))];
}

function readPackageVersion() {
  return JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8')).version;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--rounds') out.rounds = argv[++i];
    else if (arg === '--rows') out.rows = argv[++i];
    else if (arg === '--out') out.out = argv[++i];
    else throw new Error('unknown argument: ' + arg);
  }
  return out;
}

function readPositiveInt(value, fallback) {
  if (value === undefined) return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) throw new Error('expected positive integer, got ' + value);
  return number;
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function formatUs(value) {
  return value >= 1000 ? (value / 1000).toFixed(2) + ' ms' : value.toFixed(2) + ' us';
}

function padRight(value, width) {
  return String(value).padEnd(width);
}

function padLeft(value, width) {
  return String(value).padStart(width);
}
