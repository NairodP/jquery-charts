export type ReshapeKey = string | number;

export type ReshapeAccessor<T> = keyof T & string | ((row: T) => unknown);

export type ReshapeAggregate<T> =
  | 'sum'
  | 'count'
  | 'min'
  | 'max'
  | ((values: unknown[], rows: T[]) => unknown);

export type PivotFill =
  | string
  | number
  | boolean
  | null
  | ((value: string, index: ReshapeKey, column: ReshapeKey) => unknown);

export interface PivotRowsOptions<T extends Record<string, any>> {
  index: ReshapeAccessor<T>;
  columns: ReshapeAccessor<T>;
  values: readonly (keyof T & string)[];
  aggregate?: ReshapeAggregate<T>;
  fill?: PivotFill;
  indexValues?: readonly ReshapeKey[];
  columnValues?: readonly ReshapeKey[];
  normalizeKey?: (value: unknown) => ReshapeKey;
  missingKey?: 'empty' | 'skip' | 'error';
  separator?: string;
  indexName?: string;
  columnName?: (valueField: string, column: ReshapeKey) => string;
}

export type PivotRow = Record<string, unknown>;

function readValue<T extends Record<string, any>>(row: T, accessor: ReshapeAccessor<T>): unknown {
  return typeof accessor === 'function' ? accessor(row) : row[accessor];
}

function defaultKey(value: unknown): ReshapeKey {
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }
  if (value == null) {
    return '';
  }
  return describeValue(value);
}

function getAccessorName<T extends Record<string, any>>(
  accessor: ReshapeAccessor<T>,
  explicitName: string | undefined,
  role: string
): string {
  if (explicitName) {
    return explicitName;
  }
  if (typeof accessor === 'string') {
    return accessor;
  }
  throw new Error(`[jquery-core] indexName est requis quand ${role} est une fonction.`);
}

function isPresent(value: unknown): boolean {
  return value !== undefined && value !== null;
}

function describeValue(value: unknown): string {
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value) ?? Object.prototype.toString.call(value);
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    || typeof value === 'bigint' || typeof value === 'symbol') {
    return String(value);
  }
  return typeof value;
}

function aggregateValues<T>(
  values: unknown[],
  rows: T[],
  aggregate: ReshapeAggregate<T>,
  fill: unknown
): unknown {
  if (typeof aggregate === 'function') {
    return aggregate(values, rows);
  }

  if (aggregate === 'count') {
    return values.filter(isPresent).length;
  }

  const presentValues = values.filter(isPresent);
  if (presentValues.length === 0) {
    return fill;
  }

  if (aggregate === 'sum') {
    return presentValues.reduce<number>((total, value) => {
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue)) {
        throw new TypeError(`[jquery-core] Impossible d'additionner la valeur "${describeValue(value)}".`);
      }
      return total + numericValue;
    }, 0);
  }

  if (aggregate === 'min' || aggregate === 'max') {
    const numericValues = presentValues.map((value) => {
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue)) {
        throw new TypeError(`[jquery-core] Impossible de comparer la valeur "${describeValue(value)}".`);
      }
      return numericValue;
    });
    return aggregate === 'min' ? Math.min(...numericValues) : Math.max(...numericValues);
  }

  throw new Error(`[jquery-core] Agrégation inconnue : "${String(aggregate)}".`);
}

function validateAggregate<T>(aggregate: ReshapeAggregate<T>): void {
  if (typeof aggregate === 'function') {
    return;
  }
  if (!['sum', 'count', 'min', 'max'].includes(aggregate)) {
    throw new TypeError(`[jquery-core] Agrégation inconnue : "${String(aggregate)}".`);
  }
}

type PivotGroup<T> = { value: ReshapeKey; cells: Map<ReshapeKey, T[]> };

function resolveFill(fill: PivotFill | undefined): PivotFill | number {
  if (fill === undefined) {
    return 0;
  }
  return fill;
}

function resolvePivotKey(
  value: unknown,
  normalizeKey: (value: unknown) => ReshapeKey,
  missingKey: 'empty' | 'skip' | 'error'
): ReshapeKey | undefined {
  if (isPresent(value)) {
    return normalizeKey(value);
  }
  if (missingKey === 'skip') {
    return undefined;
  }
  if (missingKey === 'error') {
    throw new TypeError('[jquery-core] Une clé index/colonne est absente.');
  }
  return normalizeKey(value);
}

function getOrCreateGroup<T>(
  grouped: Map<ReshapeKey, PivotGroup<T>>,
  indexValue: ReshapeKey
): PivotGroup<T> {
  const existing = grouped.get(indexValue);
  if (existing) {
    return existing;
  }
  const group = { value: indexValue, cells: new Map<ReshapeKey, T[]>() };
  grouped.set(indexValue, group);
  return group;
}

function buildOutputNames<T extends Record<string, any>>(
  indexName: string,
  columns: ReshapeKey[],
  values: readonly (keyof T & string)[],
  columnName: (valueField: string, column: ReshapeKey) => string
): Set<string> {
  const outputNames = new Set<string>([indexName]);
  for (const columnValue of columns) {
    for (const valueField of values) {
      const outputName = columnName(String(valueField), columnValue);
      if (outputName === '__proto__' || outputName === 'constructor' || outputName === 'prototype') {
        throw new TypeError(`[jquery-core] Nom de colonne interdit : "${outputName}".`);
      }
      if (outputNames.has(outputName)) {
        throw new TypeError(`[jquery-core] Collision de nom de colonne : "${outputName}".`);
      }
      outputNames.add(outputName);
    }
  }
  return outputNames;
}

export function pivotRows<T extends Record<string, any>>(
  rows: readonly T[],
  options: PivotRowsOptions<T>
): PivotRow[] {
  if (!options.values.length) {
    throw new Error('[jquery-core] pivotRows exige au moins une mesure dans values.');
  }

  const normalizeKey = options.normalizeKey ?? defaultKey;
  const aggregate = options.aggregate ?? 'sum';
  const fill = resolveFill(options.fill);
  const separator = options.separator ?? '_';
  const missingKey = options.missingKey ?? 'empty';
  const indexName = getAccessorName(options.index, options.indexName, 'index');
  if (indexName === '__proto__' || indexName === 'constructor' || indexName === 'prototype') {
    throw new TypeError(`[jquery-core] Nom de colonne interdit : "${indexName}".`);
  }
  const discoveredColumns: ReshapeKey[] = [];
  const discoveredColumnKeys = new Set<ReshapeKey>();
  const grouped = new Map<ReshapeKey, PivotGroup<T>>();

  validateAggregate(aggregate);

  const addColumn = (value: unknown): ReshapeKey => {
    const key = normalizeKey(value);
    if (!discoveredColumnKeys.has(key)) {
      discoveredColumnKeys.add(key);
      discoveredColumns.push(key);
    }
    return key;
  };

  for (const value of options.columnValues ?? []) {
    addColumn(value);
  }

  for (const value of options.indexValues ?? []) {
    const indexValue = normalizeKey(value);
    getOrCreateGroup(grouped, indexValue);
  }

  for (const row of rows) {
    const rawIndex = readValue(row, options.index);
    const rawColumn = readValue(row, options.columns);
    const indexValue = resolvePivotKey(rawIndex, normalizeKey, missingKey);
    const columnValue = resolvePivotKey(rawColumn, normalizeKey, missingKey);
    if (indexValue === undefined || columnValue === undefined) {
      continue;
    }
    addColumn(rawColumn);
    const group = getOrCreateGroup(grouped, indexValue);
    const cellRows = group.cells.get(columnValue) ?? [];
    cellRows.push(row);
    group.cells.set(columnValue, cellRows);
  }

  const columnName = options.columnName
    ?? ((valueField: string, column: ReshapeKey) => `${valueField}${separator}${String(column)}`);
  buildOutputNames(indexName, discoveredColumns, options.values, columnName);

  return [...grouped.values()].map((group) => {
    const result: PivotRow = { [indexName]: group.value };

    for (const columnValue of discoveredColumns) {
      const matchingRows = group.cells.get(columnValue) ?? [];

      for (const valueField of options.values) {
        const outputName = columnName(String(valueField), columnValue);
        const cellValues = matchingRows.map((row) => row[valueField]);
        const cellFill = typeof fill === 'function'
          ? fill(outputName, group.value, columnValue)
          : fill;
        result[outputName] = matchingRows.length === 0
          ? cellFill
          : aggregateValues(cellValues, matchingRows, aggregate, cellFill);
      }
    }

    return result;
  });
}