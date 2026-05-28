import assert from 'node:assert';
import { createFixedLayout, createVariableLayout, virtualize } from '../dist/index.js';

const args = parseArgs(process.argv.slice(2));
const cases = readPositiveInt(args.cases, 200);
const steps = readPositiveInt(args.steps, 50);
const seed = readPositiveInt(args.seed, 0xf17);
const rng = mulberry32(seed);

for (let caseId = 0; caseId < cases; caseId++) {
  const local = mulberry32((rng() * 0xffffffff) >>> 0);
  runCase(caseId, local);
}

console.log('frontier virtual fuzz passed cases=' + cases + ' steps=' + steps + ' seed=' + seed);

function runCase(caseId, rng) {
  const count = 1 + randomInt(rng, 200);
  const rows = Array.from({ length: count }, (_, index) => ({ id: 'c' + caseId + '-' + index }));
  const sizes = {};
  for (let index = 0; index < count; index++) sizes[rows[index].id] = 1 + randomInt(rng, 50);
  const layout = randomInt(rng, 2) === 0 ? createFixedLayout(10) : createVariableLayout({ defaultSize: 10, sizes });
  for (let step = 0; step < steps; step++) {
    const viewport = { offset: randomInt(rng, count * 30), size: randomInt(rng, 300) };
    const range = virtualize({
      items: rows,
      keyBy: 'id',
      viewport,
      layout,
      overscan: randomInt(rng, 5),
      overscanPx: randomInt(rng, 20)
    });
    assert.ok(range.startIndex <= range.endIndex);
    assert.ok(range.startIndex >= 0);
    assert.ok(range.endIndex <= rows.length);
    assert.strictEqual(range.items.length, range.endIndex - range.startIndex);
    let previousOffset = -1;
    for (const item of range.items) {
      assert.ok(item.offset >= previousOffset);
      assert.ok(item.size >= 0);
      previousOffset = item.offset;
    }
  }
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--cases') out.cases = argv[++i];
    else if (arg === '--steps') out.steps = argv[++i];
    else if (arg === '--seed') out.seed = argv[++i];
    else throw new Error('unknown argument: ' + arg);
  }
  return out;
}

function readPositiveInt(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

function randomInt(rng, max) {
  return Math.floor(rng() * max);
}

function mulberry32(seed) {
  let value = seed >>> 0;
  return function next() {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
