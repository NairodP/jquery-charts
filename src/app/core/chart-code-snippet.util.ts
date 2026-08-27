import { ChartType } from '@oneteme/jquery-core';

interface ChartExample {
  config?: unknown;
  data?: unknown[];
}

export function buildChartCode(type: ChartType, example: ChartExample): string {
  const data = Array.isArray(example.data) ? example.data : [];
  const formatValue = (value: unknown, indent = 0): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'function') return formatProvider(value, data);
    if (Array.isArray(value)) {
      if (!value.length) return '[]';
      const padding = ' '.repeat(indent + 2);
      return `[\n${value.map(item => `${padding}${formatValue(item, indent + 2)}`).join(',\n')}\n${' '.repeat(indent)}]`;
    }
    if (typeof value === 'object') {
      const coordinate = formatCoordinateProvider(value, data);
      if (coordinate) return coordinate;
      const entries = Object.entries(value);
      if (!entries.length) return '{}';
      const padding = ' '.repeat(indent + 2);
      return `{\n${entries.map(([key, item]) => `${padding}${key}: ${formatValue(item, indent + 2)}`).join(',\n')}\n${' '.repeat(indent)}}`;
    }
    return typeof value === 'string' ? `'${value.replace(/'/g, "\\'")}'` : String(value);
  };

  return `// Données\nconst data = ${formatValue(data)};\n\n// Configuration\nconst config = ${formatValue(example.config)};\n\n// Template HTML\n<chart\n  type="${type}"\n  [config]="config"\n  [data]="data"\n></chart>`;
}

export function highlightChartCode(code: string): string {
  const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped
    .replace(/(\/\/.*)/g, '<span class="comment">$1</span>')
    .replace(/\b(const|let|var|function|return)\b/g, '<span class="keyword">$1</span>')
    .replace(/('[^']*')/g, '<span class="string">$1</span>')
    .replace(/\b(\d+(\.\d+)?)\b/g, '<span class="number">$1</span>')
    .replace(/&lt;chart/g, '<span class="tag">&lt;chart</span>')
    .replace(/&lt;\/chart&gt;/g, '<span class="tag">&lt;/chart&gt;</span>')
    .replace(/(type|config|data)=/g, '<span class="attr">$1</span>=')
    .replace(/\b(field|rangeFields|values|joinFields)\b/g, '<span class="fn">$1</span>');
}

function formatCoordinateProvider(value: object, data: unknown[]): string | null {
  const coordinate = value as { x?: unknown; y?: unknown; xField?: unknown; yField?: unknown };
  if (typeof coordinate.xField === 'string' && typeof coordinate.yField === 'string') {
    return `{ xField: '${coordinate.xField}', yField: '${coordinate.yField}' }`;
  }
  const xFields = resolveProviderFields(coordinate.x, data);
  const yFields = resolveProviderFields(coordinate.y, data);
  if (xFields?.length === 1 && yFields?.length === 1) {
    return `{ xField: '${xFields[0]}', yField: '${yFields[0]}' }`;
  }
  return null;
}

function formatProvider(provider: Function, data: unknown[]): string {
  const fields = resolveProviderFields(provider, data);
  if (fields?.length === 1) return `field('${fields[0]}')`;
  if (fields?.length && fields.length > 1) return `rangeFields(${fields.map(field => `'${field}'`).join(', ')})`;
  return provider.toString();
}

function resolveProviderFields(provider: unknown, data: unknown[]): string[] | null {
  if (typeof provider !== 'function' || !data.length || !data[0] || typeof data[0] !== 'object') return null;
  const availableFields = Object.keys(data[0]);
  const row = new Proxy({}, { get: (_, property) => typeof property === 'string' ? property : undefined });
  try {
    const result = provider(row, 0);
    const fields = Array.isArray(result) ? result : [result];
    return fields.every(field => typeof field === 'string' && availableFields.includes(field)) ? fields : null;
  } catch {
    return null;
  }
}