import assert from 'node:assert';
import {
  captureVirtualAnchor,
  createFixedLayout,
  createTextLayout,
  createVariableLayout,
  flattenVirtualTree,
  materializeWindowSource,
  resolveVirtualAnchorOffset,
  scheduleMaterializeWindowSource,
  scheduleVirtualize,
  scheduleVirtualizeFrustum,
  scheduleVirtualizeGrid,
  scheduleVirtualizeSpatial,
  serializeLayoutState,
  virtualize,
  virtualizeAnchored,
  virtualizeFrustum,
  virtualizeGrid,
  virtualizeSpatial
} from '../dist/index.js';

const rows = Array.from({ length: 20 }, (_, index) => ({
  id: 'r' + index,
  body: 'row ' + index + ' body'
}));

const fixed = createFixedLayout(10);
const range = virtualize({
  items: rows,
  keyBy: 'id',
  viewport: { offset: 30, size: 30 },
  layout: fixed,
  overscan: 1
});
assert.deepStrictEqual(range.items.map((item) => item.key), ['r2', 'r3', 'r4', 'r5', 'r6']);
assert.strictEqual(serializeLayoutState(fixed).provider, 'fixed');

const variable = createVariableLayout({ defaultSize: 10, sizes: { r0: 40 } });
assert.strictEqual(variable.getSize({ key: 'r0', index: 0, value: rows[0], viewport: { offset: 0, size: 10 } }), 40);

{
  const anchorLayout = createVariableLayout({ defaultSize: 10 });
  const initial = virtualize({
    items: rows,
    keyBy: 'id',
    viewport: { offset: 25, size: 40 },
    layout: anchorLayout
  });
  const anchor = captureVirtualAnchor(initial, { policy: 'start' });
  assert.ok(anchor);
  assert.strictEqual(anchor.key, 'r2');
  anchorLayout.setSize('r0', 30);
  anchorLayout.setSize('r1', 15);
  const offset = resolveVirtualAnchorOffset({
    items: rows,
    keyBy: 'id',
    viewport: initial.viewport,
    layout: anchorLayout,
    anchor
  });
  assert.strictEqual(offset, 50);
  const restoredAnchor = JSON.parse(JSON.stringify(anchor));
  assert.strictEqual(resolveVirtualAnchorOffset({
    items: rows,
    keyBy: 'id',
    viewport: initial.viewport,
    layout: anchorLayout,
    anchor: restoredAnchor
  }), offset);
  const anchored = virtualizeAnchored({
    items: rows,
    keyBy: 'id',
    viewport: initial.viewport,
    layout: anchorLayout,
    anchor
  });
  const anchoredItem = anchored.items.find((item) => item.key === anchor.key);
  assert.ok(anchoredItem);
  assert.strictEqual(anchoredItem.offset + anchor.itemOffset - anchored.viewport.offset, anchor.viewportOffset);
}

const text = createTextLayout({ field: 'body', font: '14px Inter', lineHeight: 20, width: 80 });
assert.ok(text.getSize({ key: 'r0', index: 0, value: rows[0], viewport: { offset: 0, size: 10 } }) >= 20);
const multilineText = createTextLayout({ field: 'body', font: '14px Inter', lineHeight: 10, width: 3, averageCharWidth: 1 });
assert.strictEqual(
  multilineText.getSize({
    key: 'multiline',
    index: 0,
    value: { body: 'abc\ndefg\n' },
    viewport: { offset: 0, size: 10 }
  }),
  40
);

const grid = virtualizeGrid({
  rowCount: 100,
  columnCount: 50,
  rowLayout: createFixedLayout(20),
  columnLayout: createFixedLayout(80),
  viewport: { offset: 40, size: 40, crossOffset: 160, crossSize: 160 }
});
assert.deepStrictEqual(grid.cells[0], {
  rowIndex: 2,
  columnIndex: 2,
  rowOffset: 40,
  columnOffset: 160,
  rowSize: 20,
  columnSize: 80
});

assert.deepStrictEqual(
  virtualizeSpatial(
    [
      { key: 'inside', x: 5, y: 5, width: 5, height: 5 },
      { key: 'outside', x: 50, y: 50, width: 5, height: 5 }
    ],
    { x: 0, y: 0, width: 20, height: 20 }
  ).map((item) => item.key),
  ['inside']
);

assert.deepStrictEqual(
  virtualizeFrustum(
    [
      { key: 'near', minX: -1, minY: -1, minZ: -1, maxX: 1, maxY: 1, maxZ: 1 },
      { key: 'far', minX: 20, minY: 20, minZ: 20, maxX: 21, maxY: 21, maxZ: 21 }
    ],
    {
      planes: [
        { x: 1, y: 0, z: 0, w: 10 },
        { x: -1, y: 0, z: 0, w: 10 },
        { x: 0, y: 1, z: 0, w: 10 },
        { x: 0, y: -1, z: 0, w: 10 },
        { x: 0, y: 0, z: 1, w: 10 },
        { x: 0, y: 0, z: -1, w: 10 }
      ]
    }
  ).map((item) => item.key),
  ['near']
);

assert.deepStrictEqual(
  flattenVirtualTree([{ key: 'root', value: 'root', children: [{ key: 'child', value: 'child' }] }], ['root'])
    .map((row) => [row.key, row.depth]),
  [['root', 0], ['child', 1]]
);

const windowed = await materializeWindowSource(range, {
  readWindow(start, end) {
    return rows.slice(start, end);
  },
  count() {
    return rows.length;
  }
});
assert.deepStrictEqual(windowed.items.map((row) => row.id), range.items.map((item) => item.key));

{
  const scheduler = createFakeScheduler();
  let scheduledRange;
  let scheduledGrid;
  let scheduledSpatial;
  let scheduledFrustum;
  let scheduledWindow;
  scheduleVirtualize({
    items: rows,
    keyBy: 'id',
    viewport: { offset: 0, size: 20 },
    layout: fixed
  }, {
    scheduler,
    autoRun: true,
    onResult(result) {
      scheduledRange = result;
    }
  });
  scheduleVirtualizeGrid({
    rowCount: 4,
    columnCount: 4,
    rowLayout: fixed,
    columnLayout: fixed,
    viewport: { offset: 0, size: 20, crossOffset: 0, crossSize: 20 }
  }, {
    scheduler,
    autoRun: true,
    onResult(result) {
      scheduledGrid = result;
    }
  });
  scheduleVirtualizeSpatial([{ key: 'inside', x: 0, y: 0, width: 1, height: 1 }], { x: 0, y: 0, width: 2, height: 2 }, {
    scheduler,
    autoRun: true,
    onResult(result) {
      scheduledSpatial = result;
    }
  });
  scheduleVirtualizeFrustum([{ key: 'near', minX: 0, minY: 0, minZ: 0, maxX: 1, maxY: 1, maxZ: 1 }], { planes: [{ x: 1, y: 0, z: 0, w: 10 }] }, {
    scheduler,
    autoRun: true,
    onResult(result) {
      scheduledFrustum = result;
    }
  });
  scheduleMaterializeWindowSource(range, {
    readWindow(start, end) {
      return rows.slice(start, end);
    }
  }, {
    scheduler,
    autoRun: true,
    onResult(result) {
      scheduledWindow = result;
    }
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.strictEqual(scheduledRange.totalItems, rows.length);
  assert.strictEqual(scheduledGrid.kind, 'frontier.virtual.grid');
  assert.deepStrictEqual(scheduledSpatial.map((item) => item.key), ['inside']);
  assert.deepStrictEqual(scheduledFrustum.map((item) => item.key), ['near']);
  assert.strictEqual(scheduledWindow.kind, 'frontier.virtual.window');
}

console.log('frontier virtual smoke passed');

function createFakeScheduler() {
  return {
    tasks: [],
    schedule(task) {
      this.tasks.push(task);
      return task;
    },
    run() {
      while (this.tasks.length !== 0) this.tasks.shift().run();
    },
    requestRun() {
      this.run();
    }
  };
}
