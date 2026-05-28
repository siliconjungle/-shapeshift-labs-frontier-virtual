import {
  createFixedLayout,
  createTextLayout,
  createVariableLayout,
  flattenVirtualTree,
  materializeRange,
  materializeWindowSource,
  scheduleMaterializeWindowSource,
  scheduleVirtualize,
  scheduleVirtualizeFrustum,
  scheduleVirtualizeGrid,
  scheduleVirtualizeSpatial,
  serializeLayoutState,
  virtualize,
  virtualizeFrustum,
  virtualizeGrid,
  virtualizeSpatial,
  type FrontierVirtualLayoutProvider,
  type FrontierVirtualResult,
  type FrontierVirtualSchedulerTask,
  type FrontierVirtualWindowSource
} from '../dist/index.js';

const rows = [{ id: 'a', body: 'Alpha' }];
const fixed: FrontierVirtualLayoutProvider = createFixedLayout(20);
const variable = createVariableLayout({ defaultSize: 20, sizes: [['a', 24]] });
const text = createTextLayout({ field: 'body', font: '14px Inter', lineHeight: 20, width: 200 });
const result: FrontierVirtualResult = virtualize({
  items: rows,
  keyBy: 'id',
  viewport: { offset: 0, size: 100 },
  layout: text,
  overscan: 2
});

const materialized = materializeRange(result, (item) => item.key);
const source: FrontierVirtualWindowSource = {
  readWindow(start, end) {
    return rows.slice(start, end);
  },
  count() {
    return rows.length;
  }
};
const windowed = materializeWindowSource(result, source);
const grid = virtualizeGrid({
  rowCount: 10,
  columnCount: 10,
  rowLayout: fixed,
  columnLayout: variable,
  viewport: { offset: 0, size: 100, crossOffset: 0, crossSize: 100 }
});
const spatial = virtualizeSpatial([{ key: 'a', x: 0, y: 0, width: 1, height: 1 }], { x: 0, y: 0, width: 10, height: 10 });
const frustum = virtualizeFrustum(
  [{ key: 'a', minX: 0, minY: 0, minZ: 0, maxX: 1, maxY: 1, maxZ: 1 }],
  { planes: [{ x: 1, y: 0, z: 0, w: 10 }] }
);
const scheduler = {
  schedule(task: FrontierVirtualSchedulerTask): unknown {
    task.run();
    return task;
  }
};
const scheduledRange = scheduleVirtualize({
  items: rows,
  keyBy: 'id',
  viewport: { offset: 0, size: 100 },
  layout: fixed
}, {
  scheduler,
  onResult(next: FrontierVirtualResult) {
    void next.totalItems;
  }
});
const scheduledGrid = scheduleVirtualizeGrid({
  rowCount: 10,
  columnCount: 10,
  rowLayout: fixed,
  columnLayout: variable,
  viewport: { offset: 0, size: 100, crossOffset: 0, crossSize: 100 }
}, {
  scheduler,
  onResult(next) {
    void next.cells;
  }
});
const scheduledSpatial = scheduleVirtualizeSpatial(spatial, { x: 0, y: 0, width: 10, height: 10 }, {
  scheduler,
  onResult(next) {
    void next.length;
  }
});
const scheduledFrustum = scheduleVirtualizeFrustum(frustum, { planes: [{ x: 1, y: 0, z: 0, w: 10 }] }, {
  scheduler,
  onResult(next) {
    void next.length;
  }
});
const scheduledWindow = scheduleMaterializeWindowSource(result, source, {
  scheduler,
  onResult(next) {
    void next.items;
  }
});
const tree = flattenVirtualTree([{ key: 'root', value: rows }], ['root']);
const state = serializeLayoutState(text);

void materialized;
void windowed;
void grid;
void spatial;
void frustum;
void scheduledRange;
void scheduledGrid;
void scheduledSpatial;
void scheduledFrustum;
void scheduledWindow;
void tree;
void state;
