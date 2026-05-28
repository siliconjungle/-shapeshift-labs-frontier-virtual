import { getCachedPointerPath, getPath } from '@shapeshift-labs/frontier/pointer';
import type { JsonPath, JsonValue, Patch } from '@shapeshift-labs/frontier';

export type FrontierVirtualWatchPath = string | JsonPath;

export interface FrontierVirtualPatchSubscription {
  unsubscribe(): void;
}

export interface FrontierVirtualViewport {
  offset: number;
  size: number;
  crossOffset?: number;
  crossSize?: number;
}

export interface FrontierVirtualItemContext {
  key: string;
  index: number;
  value: JsonValue | undefined;
  viewport: FrontierVirtualViewport;
  crossSize?: number;
}

export interface FrontierVirtualLayoutProvider {
  kind: string;
  version?: number;
  defaultSize?: number;
  getSize(item: FrontierVirtualItemContext): number;
  setSize?(key: string, size: number): void;
  serialize?(): FrontierVirtualSerializedLayoutState;
}

export interface FrontierVirtualSerializedLayoutState {
  kind: 'frontier.virtual.layout';
  version: 1;
  provider: string;
  defaultSize?: number;
  sizes?: Array<[string, number]>;
  metadata?: Record<string, JsonValue | undefined>;
}

export interface FrontierVirtualizeOptions {
  source?: JsonValue | undefined;
  path?: FrontierVirtualWatchPath;
  items?: JsonValue | undefined;
  keyBy?: string | number | FrontierVirtualKeyGetter;
  viewport: FrontierVirtualViewport;
  layout: FrontierVirtualLayoutProvider;
  overscan?: number;
  overscanPx?: number;
  anchorPolicy?: FrontierVirtualAnchorPolicy;
}

export type FrontierVirtualAnchorPolicy = 'start' | 'center' | 'end' | 'preserve';

export type FrontierVirtualKeyGetter = (
  value: JsonValue | undefined,
  index: number,
  collectionKey: string | number
) => string | number | null | undefined;

export interface FrontierVirtualItem {
  key: string;
  index: number;
  value: JsonValue | undefined;
  offset: number;
  size: number;
}

export interface FrontierVirtualResult {
  kind: 'frontier.virtual.result';
  totalItems: number;
  totalSize: number;
  startIndex: number;
  endIndex: number;
  offsetBefore: number;
  offsetAfter: number;
  viewport: FrontierVirtualViewport;
  overscan: number;
  overscanPx: number;
  anchorPolicy: FrontierVirtualAnchorPolicy;
  items: FrontierVirtualItem[];
}

export interface FrontierVirtualWindowSource {
  readWindow(start: number, end: number): JsonValue[] | Promise<JsonValue[]>;
  count?(): number | Promise<number>;
  watchWindow?(
    range: { start: number; end: number },
    callback: (patch: Patch) => void
  ): FrontierVirtualPatchSubscription;
}

export interface FrontierVirtualWindowResult {
  kind: 'frontier.virtual.window';
  start: number;
  end: number;
  totalItems?: number;
  items: JsonValue[];
}

export interface FrontierFixedLayoutOptions {
  itemSize: number;
}

export interface FrontierVariableLayoutOptions {
  defaultSize: number;
  sizes?: Map<string, number> | Record<string, number> | Array<[string, number]> | FrontierVirtualSerializedLayoutState;
}

export interface FrontierTextLayoutEngine {
  prepare(text: string, font: string, options?: unknown): unknown;
  layout(prepared: unknown, width: number, lineHeight: number): { height: number; lineCount?: number };
}

export interface FrontierTextLayoutOptions {
  field?: FrontierVirtualWatchPath;
  font: string;
  lineHeight: number;
  width?: number | ((item: FrontierVirtualItemContext) => number);
  engine?: FrontierTextLayoutEngine;
  prepareOptions?: unknown;
  averageCharWidth?: number;
  minSize?: number;
}

export interface FrontierVirtualGridOptions {
  rowCount: number;
  columnCount: number;
  rowLayout: FrontierVirtualLayoutProvider;
  columnLayout: FrontierVirtualLayoutProvider;
  viewport: FrontierVirtualViewport;
  overscanRows?: number;
  overscanColumns?: number;
}

export interface FrontierVirtualGridResult {
  kind: 'frontier.virtual.grid';
  rows: FrontierVirtualResult;
  columns: FrontierVirtualResult;
  cells: FrontierVirtualGridCell[];
}

export interface FrontierVirtualGridCell {
  rowIndex: number;
  columnIndex: number;
  rowOffset: number;
  columnOffset: number;
  rowSize: number;
  columnSize: number;
}

export interface FrontierVirtualSpatialItem {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  value?: JsonValue | undefined;
}

export interface FrontierVirtualSpatialViewport {
  x: number;
  y: number;
  width: number;
  height: number;
  overscan?: number;
}

export interface FrontierVirtualAabb3Item {
  key: string;
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
  value?: JsonValue | undefined;
}

export interface FrontierVirtualFrustumPlane {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface FrontierVirtualFrustum {
  planes: FrontierVirtualFrustumPlane[];
  overscan?: number;
}

export interface FrontierVirtualSchedulerTask {
  id?: string;
  type?: string;
  input?: unknown;
  lane?: string;
  area?: string;
  priority?: unknown;
  units?: number;
  key?: string;
  metadata?: Record<string, unknown>;
  run(context?: unknown): unknown;
}

export interface FrontierVirtualSchedulerLike {
  schedule(task: FrontierVirtualSchedulerTask): unknown;
  run?(options?: unknown): unknown;
  requestRun?(options?: unknown): unknown;
}

export interface FrontierVirtualScheduleOptions<TResult> {
  scheduler: FrontierVirtualSchedulerLike;
  id?: string;
  lane?: string;
  area?: string;
  priority?: unknown;
  units?: number;
  key?: string;
  autoRun?: boolean;
  runOptions?: unknown;
  onResult(result: TResult): void;
  onError?(error: unknown): void;
}

export interface FrontierVirtualTreeNode<T = JsonValue> {
  key: string;
  value: T;
  children?: Array<FrontierVirtualTreeNode<T>>;
}

export interface FrontierVirtualTreeRow<T = JsonValue> {
  key: string;
  value: T;
  depth: number;
  parentKey?: string;
}

export function createFixedLayout(options: number | FrontierFixedLayoutOptions): FrontierVirtualLayoutProvider {
  const itemSize = typeof options === 'number' ? options : options.itemSize;
  if (!Number.isFinite(itemSize) || itemSize < 0) throw new TypeError('frontier virtual fixed item size must be non-negative');
  return {
    kind: 'fixed',
    version: 1,
    defaultSize: itemSize,
    getSize() {
      return itemSize;
    },
    serialize() {
      return {
        kind: 'frontier.virtual.layout',
        version: 1,
        provider: 'fixed',
        defaultSize: itemSize
      };
    }
  };
}

export function createVariableLayout(options: FrontierVariableLayoutOptions): FrontierVirtualLayoutProvider {
  if (!Number.isFinite(options.defaultSize) || options.defaultSize < 0) {
    throw new TypeError('frontier virtual variable default size must be non-negative');
  }
  const sizes = new Map<string, number>();
  readSizeEntries(options.sizes, sizes);
  return {
    kind: 'variable',
    version: 1,
    defaultSize: options.defaultSize,
    getSize(item) {
      return sizes.get(item.key) ?? options.defaultSize;
    },
    setSize(key, size) {
      if (!Number.isFinite(size) || size < 0) throw new TypeError('frontier virtual measured size must be non-negative');
      sizes.set(key, size);
    },
    serialize() {
      return {
        kind: 'frontier.virtual.layout',
        version: 1,
        provider: 'variable',
        defaultSize: options.defaultSize,
        sizes: Array.from(sizes.entries())
      };
    }
  };
}

export const createMeasuredLayout = createVariableLayout;

export function createTextLayout(options: FrontierTextLayoutOptions): FrontierVirtualLayoutProvider {
  if (!Number.isFinite(options.lineHeight) || options.lineHeight <= 0) {
    throw new TypeError('frontier virtual text lineHeight must be positive');
  }
  const fieldPath = options.field === undefined ? undefined : normalizePath(options.field);
  const fieldKey = fieldPath && fieldPath.length === 1 ? fieldPath[0] : undefined;
  const averageCharWidth = options.averageCharWidth ?? 7;
  const minSize = options.minSize ?? options.lineHeight;
  const cache = new Map<string, { text: string; width: number; size: number }>();
  return {
    kind: 'text',
    version: 1,
    defaultSize: minSize,
    getSize(item) {
      const text = String(readTextLayoutValue(item.value, fieldPath, fieldKey) ?? '');
      const width = typeof options.width === 'function'
        ? options.width(item)
        : options.width ?? item.crossSize ?? item.viewport.crossSize ?? item.viewport.size;
      const cached = cache.get(item.key);
      if (cached !== undefined && cached.text === text && cached.width === width) return cached.size;
      let size: number;
      if (options.engine) {
        const prepared = options.engine.prepare(text, options.font, options.prepareOptions);
        size = options.engine.layout(prepared, width, options.lineHeight).height;
      } else {
        size = estimateTextHeight(text, width, options.lineHeight, averageCharWidth);
      }
      if (!Number.isFinite(size) || size < 0) size = minSize;
      size = Math.max(minSize, size);
      cache.set(item.key, { text, width, size });
      return size;
    },
    serialize() {
      return {
        kind: 'frontier.virtual.layout',
        version: 1,
        provider: 'text',
        defaultSize: minSize,
        metadata: {
          field: fieldPath ? '/' + fieldPath.map(String).join('/') : undefined,
          font: options.font,
          lineHeight: options.lineHeight
        }
      };
    }
  };
}

export function virtualize(options: FrontierVirtualizeOptions): FrontierVirtualResult {
  const viewport = normalizeViewport(options.viewport);
  const collection = options.items !== undefined
    ? options.items
    : options.path === undefined
      ? options.source
      : readPath(options.source, normalizePath(options.path));
  const fixedSize = readFixedSize(options.layout);
  if (fixedSize !== null && Array.isArray(collection)) {
    return virtualizeFixedArray(collection, options, viewport, fixedSize);
  }
  if (Array.isArray(collection)) return virtualizeMeasuredArray(collection, options, viewport);
  const entries = enumerateVirtualCollection(collection, options.keyBy ?? 'id');
  const sizes = new Array<number>(entries.length);
  const offsets = new Array<number>(entries.length + 1);
  offsets[0] = 0;
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index];
    const size = sanitizeSize(options.layout.getSize({
      key: entry.key,
      index,
      value: entry.value,
      viewport,
      crossSize: viewport.crossSize
    }), options.layout.defaultSize ?? 0);
    sizes[index] = size;
    offsets[index + 1] = offsets[index] + size;
  }
  const totalSize = offsets[entries.length] ?? 0;
  const overscan = Math.max(0, Math.floor(options.overscan ?? 0));
  const overscanPx = Math.max(0, options.overscanPx ?? 0);
  const windowStart = Math.max(0, viewport.offset - overscanPx);
  const windowEnd = Math.min(totalSize, viewport.offset + viewport.size + overscanPx);
  let startIndex = lowerBoundOffset(offsets, windowStart);
  let endIndex = lowerBoundOffset(offsets, windowEnd);
  if (endIndex < entries.length && offsets[endIndex] < windowEnd) endIndex++;
  startIndex = Math.max(0, startIndex - overscan);
  endIndex = Math.min(entries.length, Math.max(startIndex, endIndex + overscan));
  const items = new Array<FrontierVirtualItem>(Math.max(0, endIndex - startIndex));
  for (let index = startIndex; index < endIndex; index++) {
    const entry = entries[index];
    items[index - startIndex] = {
      key: entry.key,
      index,
      value: entry.value,
      offset: offsets[index],
      size: sizes[index]
    };
  }
  return {
    kind: 'frontier.virtual.result',
    totalItems: entries.length,
    totalSize,
    startIndex,
    endIndex,
    offsetBefore: offsets[startIndex] ?? 0,
    offsetAfter: totalSize - (offsets[endIndex] ?? totalSize),
    viewport,
    overscan,
    overscanPx,
    anchorPolicy: options.anchorPolicy ?? 'start',
    items
  };
}

export function scheduleVirtualize(
  options: FrontierVirtualizeOptions,
  schedule: FrontierVirtualScheduleOptions<FrontierVirtualResult>
): unknown {
  return scheduleVirtualWork('frontier.virtual.range', () => virtualize(options), schedule);
}

function virtualizeMeasuredArray(
  collection: JsonValue[],
  options: FrontierVirtualizeOptions,
  viewport: FrontierVirtualViewport
): FrontierVirtualResult {
  const totalItems = collection.length;
  const sizes = new Array<number>(totalItems);
  const offsets = new Array<number>(totalItems + 1);
  const keyBy = options.keyBy ?? 'id';
  const layout = options.layout;
  const fallbackSize = layout.defaultSize ?? 0;
  const crossSize = viewport.crossSize;
  offsets[0] = 0;
  for (let index = 0; index < totalItems; index++) {
    const value = collection[index];
    const key = readItemKey(value, index, index, keyBy);
    const size = sanitizeSize(layout.getSize({ key, index, value, viewport, crossSize }), fallbackSize);
    sizes[index] = size;
    offsets[index + 1] = offsets[index] + size;
  }
  const totalSize = offsets[totalItems] ?? 0;
  const overscan = Math.max(0, Math.floor(options.overscan ?? 0));
  const overscanPx = Math.max(0, options.overscanPx ?? 0);
  const windowStart = Math.max(0, viewport.offset - overscanPx);
  const windowEnd = Math.min(totalSize, viewport.offset + viewport.size + overscanPx);
  let startIndex = lowerBoundOffset(offsets, windowStart);
  let endIndex = lowerBoundOffset(offsets, windowEnd);
  if (endIndex < totalItems && offsets[endIndex] < windowEnd) endIndex++;
  startIndex = Math.max(0, startIndex - overscan);
  endIndex = Math.min(totalItems, Math.max(startIndex, endIndex + overscan));
  const items = new Array<FrontierVirtualItem>(Math.max(0, endIndex - startIndex));
  for (let index = startIndex; index < endIndex; index++) {
    const value = collection[index];
    items[index - startIndex] = {
      key: readItemKey(value, index, index, keyBy),
      index,
      value,
      offset: offsets[index],
      size: sizes[index]
    };
  }
  return {
    kind: 'frontier.virtual.result',
    totalItems,
    totalSize,
    startIndex,
    endIndex,
    offsetBefore: offsets[startIndex] ?? 0,
    offsetAfter: totalSize - (offsets[endIndex] ?? totalSize),
    viewport,
    overscan,
    overscanPx,
    anchorPolicy: options.anchorPolicy ?? 'start',
    items
  };
}

function virtualizeFixedArray(
  collection: JsonValue[],
  options: FrontierVirtualizeOptions,
  viewport: FrontierVirtualViewport,
  itemSize: number
): FrontierVirtualResult {
  const totalItems = collection.length;
  const totalSize = totalItems * itemSize;
  const overscan = Math.max(0, Math.floor(options.overscan ?? 0));
  const overscanPx = Math.max(0, options.overscanPx ?? 0);
  const windowStart = Math.max(0, viewport.offset - overscanPx);
  const windowEnd = Math.min(totalSize, viewport.offset + viewport.size + overscanPx);
  let startIndex = itemSize > 0 ? Math.floor(windowStart / itemSize) : 0;
  let endIndex = itemSize > 0 ? Math.ceil(windowEnd / itemSize) : 0;
  startIndex = Math.min(totalItems, startIndex);
  endIndex = Math.min(totalItems, endIndex);
  startIndex = Math.max(0, startIndex - overscan);
  endIndex = Math.min(totalItems, Math.max(startIndex, endIndex + overscan));
  const keyBy = options.keyBy ?? 'id';
  const items = new Array<FrontierVirtualItem>(Math.max(0, endIndex - startIndex));
  for (let index = startIndex; index < endIndex; index++) {
    const value = collection[index];
    items[index - startIndex] = {
      key: readItemKey(value, index, index, keyBy),
      index,
      value,
      offset: index * itemSize,
      size: itemSize
    };
  }
  return {
    kind: 'frontier.virtual.result',
    totalItems,
    totalSize,
    startIndex,
    endIndex,
    offsetBefore: startIndex * itemSize,
    offsetAfter: totalSize - endIndex * itemSize,
    viewport,
    overscan,
    overscanPx,
    anchorPolicy: options.anchorPolicy ?? 'start',
    items
  };
}

export function materializeRange<T>(
  range: FrontierVirtualResult,
  callback: (item: FrontierVirtualItem, localIndex: number) => T
): T[] {
  const out = new Array<T>(range.items.length);
  for (let i = 0; i < range.items.length; i++) out[i] = callback(range.items[i], i);
  return out;
}

export async function materializeWindowSource(
  range: Pick<FrontierVirtualResult, 'startIndex' | 'endIndex'>,
  source: FrontierVirtualWindowSource
): Promise<FrontierVirtualWindowResult> {
  const items = await source.readWindow(range.startIndex, range.endIndex);
  const totalItems = source.count ? await source.count() : undefined;
  return {
    kind: 'frontier.virtual.window',
    start: range.startIndex,
    end: range.endIndex,
    totalItems,
    items
  };
}

export function scheduleMaterializeWindowSource(
  range: Pick<FrontierVirtualResult, 'startIndex' | 'endIndex'>,
  source: FrontierVirtualWindowSource,
  schedule: FrontierVirtualScheduleOptions<FrontierVirtualWindowResult>
): unknown {
  return scheduleVirtualWork('frontier.virtual.window', () => materializeWindowSource(range, source), schedule);
}

export function serializeLayoutState(provider: FrontierVirtualLayoutProvider): FrontierVirtualSerializedLayoutState {
  if (provider.serialize) return provider.serialize();
  return {
    kind: 'frontier.virtual.layout',
    version: 1,
    provider: provider.kind,
    defaultSize: provider.defaultSize
  };
}

export function deserializeLayoutState(state: FrontierVirtualSerializedLayoutState): FrontierVirtualSerializedLayoutState {
  if (state === null || typeof state !== 'object') throw new TypeError('invalid frontier virtual layout state');
  if (state.kind !== 'frontier.virtual.layout') throw new TypeError('invalid frontier virtual layout state kind');
  if (state.version !== 1) throw new TypeError('unsupported frontier virtual layout state version');
  return state;
}

export function virtualizeGrid(options: FrontierVirtualGridOptions): FrontierVirtualGridResult {
  const rows = virtualize({
    items: makeIndexItems(options.rowCount),
    keyBy: 'id',
    viewport: { offset: options.viewport.offset, size: options.viewport.size },
    layout: options.rowLayout,
    overscan: options.overscanRows ?? 0
  });
  const columns = virtualize({
    items: makeIndexItems(options.columnCount),
    keyBy: 'id',
    viewport: {
      offset: options.viewport.crossOffset ?? 0,
      size: options.viewport.crossSize ?? 0
    },
    layout: options.columnLayout,
    overscan: options.overscanColumns ?? 0
  });
  const cells: FrontierVirtualGridCell[] = [];
  for (let row = 0; row < rows.items.length; row++) {
    for (let column = 0; column < columns.items.length; column++) {
      cells[cells.length] = {
        rowIndex: rows.items[row].index,
        columnIndex: columns.items[column].index,
        rowOffset: rows.items[row].offset,
        columnOffset: columns.items[column].offset,
        rowSize: rows.items[row].size,
        columnSize: columns.items[column].size
      };
    }
  }
  return { kind: 'frontier.virtual.grid', rows, columns, cells };
}

export function scheduleVirtualizeGrid(
  options: FrontierVirtualGridOptions,
  schedule: FrontierVirtualScheduleOptions<FrontierVirtualGridResult>
): unknown {
  return scheduleVirtualWork('frontier.virtual.grid', () => virtualizeGrid(options), schedule);
}

export function virtualizeSpatial(
  items: FrontierVirtualSpatialItem[],
  viewport: FrontierVirtualSpatialViewport
): FrontierVirtualSpatialItem[] {
  const overscan = viewport.overscan ?? 0;
  const left = viewport.x - overscan;
  const top = viewport.y - overscan;
  const right = viewport.x + viewport.width + overscan;
  const bottom = viewport.y + viewport.height + overscan;
  const out: FrontierVirtualSpatialItem[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.x + item.width < left || item.x > right || item.y + item.height < top || item.y > bottom) continue;
    out[out.length] = item;
  }
  return out;
}

export function scheduleVirtualizeSpatial(
  items: FrontierVirtualSpatialItem[],
  viewport: FrontierVirtualSpatialViewport,
  schedule: FrontierVirtualScheduleOptions<FrontierVirtualSpatialItem[]>
): unknown {
  return scheduleVirtualWork('frontier.virtual.spatial', () => virtualizeSpatial(items, viewport), schedule);
}

export function virtualizeFrustum(
  items: FrontierVirtualAabb3Item[],
  frustum: FrontierVirtualFrustum
): FrontierVirtualAabb3Item[] {
  const out: FrontierVirtualAabb3Item[] = [];
  const overscan = frustum.overscan ?? 0;
  for (let i = 0; i < items.length; i++) {
    if (aabbIntersectsFrustum(items[i], frustum.planes, overscan)) out[out.length] = items[i];
  }
  return out;
}

export function scheduleVirtualizeFrustum(
  items: FrontierVirtualAabb3Item[],
  frustum: FrontierVirtualFrustum,
  schedule: FrontierVirtualScheduleOptions<FrontierVirtualAabb3Item[]>
): unknown {
  return scheduleVirtualWork('frontier.virtual.frustum', () => virtualizeFrustum(items, frustum), schedule);
}

export function flattenVirtualTree<T>(
  roots: Array<FrontierVirtualTreeNode<T>>,
  expandedKeys: Set<string> | string[]
): Array<FrontierVirtualTreeRow<T>> {
  const expanded = Array.isArray(expandedKeys) ? new Set(expandedKeys) : expandedKeys;
  const rows: Array<FrontierVirtualTreeRow<T>> = [];
  for (let i = 0; i < roots.length; i++) appendTreeRows(roots[i], 0, undefined, expanded, rows);
  return rows;
}

function scheduleVirtualWork<TResult>(
  type: string,
  work: () => TResult | Promise<TResult>,
  options: FrontierVirtualScheduleOptions<TResult>
): unknown {
  const scheduler = options.scheduler;
  if (scheduler === null || typeof scheduler !== 'object' || typeof scheduler.schedule !== 'function') {
    throw new TypeError('frontier virtual scheduler must expose schedule()');
  }
  const scheduled = scheduler.schedule({
    id: options.id,
    type,
    lane: options.lane ?? 'virtual',
    area: options.area ?? 'virtual',
    priority: options.priority ?? 'normal',
    units: options.units ?? 1,
    key: options.key ?? type,
    run() {
      try {
        const result = work();
        if (isPromiseLike(result)) {
          result.then(options.onResult, options.onError ?? ((error) => { throw error; }));
        } else {
          options.onResult(result);
        }
      } catch (error) {
        if (options.onError) options.onError(error);
        else throw error;
      }
    }
  });
  if (options.autoRun === true) {
    if (typeof scheduler.requestRun === 'function') scheduler.requestRun(options.runOptions);
    else if (typeof scheduler.run === 'function') scheduler.run(options.runOptions);
  }
  return scheduled;
}

function appendTreeRows<T>(
  node: FrontierVirtualTreeNode<T>,
  depth: number,
  parentKey: string | undefined,
  expanded: Set<string>,
  rows: Array<FrontierVirtualTreeRow<T>>
): void {
  rows[rows.length] = { key: node.key, value: node.value, depth, parentKey };
  if (!expanded.has(node.key) || !node.children) return;
  for (let i = 0; i < node.children.length; i++) appendTreeRows(node.children[i], depth + 1, node.key, expanded, rows);
}

function enumerateVirtualCollection(
  collection: JsonValue | undefined,
  keyBy: string | number | FrontierVirtualKeyGetter
): Array<{ key: string; value: JsonValue | undefined }> {
  if (Array.isArray(collection)) {
    const items = new Array(collection.length);
    for (let index = 0; index < collection.length; index++) {
      const value = collection[index];
      items[index] = { key: readItemKey(value, index, index, keyBy), value };
    }
    return items;
  }
  if (collection !== null && typeof collection === 'object') {
    const keys = Object.keys(collection);
    const items = new Array(keys.length);
    for (let index = 0; index < keys.length; index++) {
      const key = keys[index];
      const value = (collection as Record<string, JsonValue>)[key];
      items[index] = { key: readItemKey(value, index, key, keyBy), value };
    }
    return items;
  }
  return [];
}

function readItemKey(
  value: JsonValue | undefined,
  index: number,
  collectionKey: string | number,
  keyBy: string | number | FrontierVirtualKeyGetter
): string {
  let key: string | number | null | undefined;
  if (typeof keyBy === 'function') {
    key = keyBy(value, index, collectionKey);
  } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    key = (value as Record<string | number, JsonValue>)[keyBy] as string | number | null | undefined;
  }
  if (key === null || key === undefined) key = collectionKey;
  return String(key);
}

function normalizeViewport(viewport: FrontierVirtualViewport): FrontierVirtualViewport {
  return {
    offset: Math.max(0, viewport.offset || 0),
    size: Math.max(0, viewport.size || 0),
    crossOffset: Math.max(0, viewport.crossOffset || 0),
    crossSize: viewport.crossSize === undefined ? undefined : Math.max(0, viewport.crossSize || 0)
  };
}

function lowerBoundOffset(offsets: number[], target: number): number {
  let low = 0;
  let high = Math.max(0, offsets.length - 1);
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (offsets[mid + 1] <= target) low = mid + 1;
    else high = mid;
  }
  return low;
}

function sanitizeSize(size: number, fallback: number): number {
  return Number.isFinite(size) && size >= 0 ? size : fallback;
}

function readFixedSize(layout: FrontierVirtualLayoutProvider): number | null {
  if (layout.kind !== 'fixed') return null;
  const size = layout.defaultSize;
  return Number.isFinite(size) && size >= 0 ? size as number : null;
}

function estimateTextHeight(text: string, width: number, lineHeight: number, averageCharWidth: number): number {
  if (text.length === 0) return lineHeight;
  const charsPerLine = Math.max(1, Math.floor(Math.max(1, width) / Math.max(1, averageCharWidth)));
  let lineStart = 0;
  let lines = 0;
  for (let i = 0; i <= text.length; i++) {
    if (i !== text.length && text.charCodeAt(i) !== 10) continue;
    lines += Math.max(1, Math.ceil((i - lineStart) / charsPerLine));
    lineStart = i + 1;
  }
  return lines * lineHeight;
}

function readTextLayoutValue(
  value: JsonValue | undefined,
  fieldPath: JsonPath | undefined,
  fieldKey: string | number | undefined
): JsonValue | undefined {
  if (fieldPath === undefined) return value;
  if (fieldKey !== undefined && value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return (value as Record<string | number, JsonValue>)[fieldKey];
  }
  return readPath(value, fieldPath);
}

function aabbIntersectsFrustum(
  box: FrontierVirtualAabb3Item,
  planes: FrontierVirtualFrustumPlane[],
  overscan: number
): boolean {
  for (let i = 0; i < planes.length; i++) {
    const plane = planes[i];
    const x = plane.x >= 0 ? box.maxX + overscan : box.minX - overscan;
    const y = plane.y >= 0 ? box.maxY + overscan : box.minY - overscan;
    const z = plane.z >= 0 ? box.maxZ + overscan : box.minZ - overscan;
    if (plane.x * x + plane.y * y + plane.z * z + plane.w < 0) return false;
  }
  return true;
}

function readSizeEntries(
  input: FrontierVariableLayoutOptions['sizes'],
  target: Map<string, number>
): void {
  if (!input) return;
  if (input instanceof Map) {
    for (const [key, value] of input) if (Number.isFinite(value) && value >= 0) target.set(String(key), value);
    return;
  }
  if (Array.isArray(input)) {
    for (const [key, value] of input) if (Number.isFinite(value) && value >= 0) target.set(String(key), value);
    return;
  }
  if ((input as FrontierVirtualSerializedLayoutState).kind === 'frontier.virtual.layout') {
    readSizeEntries((input as FrontierVirtualSerializedLayoutState).sizes, target);
    return;
  }
  for (const key of Object.keys(input)) {
    const value = (input as Record<string, number>)[key];
    if (Number.isFinite(value) && value >= 0) target.set(key, value);
  }
}

function makeIndexItems(count: number): JsonValue[] {
  const items = new Array(Math.max(0, Math.floor(count)));
  for (let i = 0; i < items.length; i++) items[i] = { id: String(i) };
  return items;
}

function isPromiseLike<T>(value: T | Promise<T>): value is Promise<T> {
  return value !== null && typeof value === 'object' && typeof (value as Promise<T>).then === 'function';
}

function normalizePath(path: FrontierVirtualWatchPath): JsonPath {
  if (Array.isArray(path)) return path.slice();
  if (path.charCodeAt(0) !== 47) return [path];
  return getCachedPointerPath(path).slice();
}

function readPath(source: JsonValue | undefined, path: JsonPath): JsonValue | undefined {
  if (source === undefined) return undefined;
  return getPath(source, path);
}
