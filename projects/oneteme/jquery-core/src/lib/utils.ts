/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
export function mergeDeep(target: any, ...sources: any[]): any {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

/** Retourne une copie JSON, sans fonctions ni callbacks non transportables. */
export function cloneSerializable<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_key, nested) =>
    typeof nested === 'function' ? undefined : nested,
  )) as T;
}

/** Indique si une valeur contient une fonction, y compris dans un graphe cyclique. */
export function containsFunction(value: unknown, seen = new WeakSet<object>()): boolean {
  if (typeof value === 'function') return true;
  if (!value || typeof value !== 'object') return false;
  if (seen.has(value)) return false;
  seen.add(value);
  return Object.values(value).some(nested => containsFunction(nested, seen));
}
