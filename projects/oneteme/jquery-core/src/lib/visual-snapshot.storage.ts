import {
  isVisualSnapshot,
  VISUAL_SNAPSHOT_DEFAULT_MAX_BYTES,
  VISUAL_SNAPSHOT_SCHEMA_VERSION,
  VISUAL_SNAPSHOT_STORAGE_KEY,
  VisualSnapshot,
  VisualSnapshotDraft,
  VisualSnapshotCollection,
  VisualSnapshotStorageOptions,
} from './visual-snapshot.model';

export class VisualSnapshotStorage {
  private readonly storage: Storage | null;
  private readonly storageKey: string;
  private readonly maxBytes: number;

  constructor(options: VisualSnapshotStorageOptions = {}) {
    this.storage = options.storage ?? getBrowserStorage();
    this.storageKey = options.storageKey ?? VISUAL_SNAPSHOT_STORAGE_KEY;
    this.maxBytes = options.maxBytes ?? VISUAL_SNAPSHOT_DEFAULT_MAX_BYTES;
  }

  list(): VisualSnapshot[] {
    return this.readCollection().snapshots
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  get(snapshotId: string): VisualSnapshot | null {
    return this.readCollection().snapshots.find(snapshot => snapshot.id === snapshotId) ?? null;
  }

  create(snapshot: VisualSnapshotDraft): VisualSnapshot {
    const now = new Date().toISOString();
    const created: VisualSnapshot = {
      ...snapshot,
      id: createId(),
      schemaVersion: VISUAL_SNAPSHOT_SCHEMA_VERSION,
      createdAt: now,
      updatedAt: now,
    };
    this.writeCollection({
      schemaVersion: VISUAL_SNAPSHOT_SCHEMA_VERSION,
      snapshots: [created, ...this.readCollection().snapshots],
    });
    return created;
  }

  replace(snapshot: VisualSnapshot): void {
    if (!isVisualSnapshot(snapshot)) throw new Error('Invalid visual snapshot');
    const snapshots = this.readCollection().snapshots;
    const index = snapshots.findIndex(item => item.id === snapshot.id);
    if (index === -1) throw new Error(`Unknown visual snapshot: ${snapshot.id}`);
    snapshots[index] = { ...snapshot, updatedAt: new Date().toISOString() };
    this.writeCollection({ schemaVersion: VISUAL_SNAPSHOT_SCHEMA_VERSION, snapshots });
  }

  rename(snapshotId: string, label: string): void {
    const snapshot = this.get(snapshotId);
    if (!snapshot) throw new Error(`Unknown visual snapshot: ${snapshotId}`);
    this.replace({ ...snapshot, label: label.trim() || snapshot.label });
  }

  remove(snapshotId: string): void {
    this.writeCollection({
      schemaVersion: VISUAL_SNAPSHOT_SCHEMA_VERSION,
      snapshots: this.readCollection().snapshots.filter(snapshot => snapshot.id !== snapshotId),
    });
  }

  clear(): void {
    try {
      this.storage?.removeItem(this.storageKey);
    } catch {
      // Storage peut être indisponible en mode privé ou dans un contexte bloqué.
    }
  }

  private readCollection(): VisualSnapshotCollection {
    if (!this.storage) return emptyCollection();
    try {
      const raw = this.storage.getItem(this.storageKey);
      if (!raw) return emptyCollection();
      const parsed: unknown = JSON.parse(raw);
      if (!isCollection(parsed)) {
        this.clear();
        return emptyCollection();
      }
      return parsed;
    } catch {
      return emptyCollection();
    }
  }

  private writeCollection(collection: VisualSnapshotCollection): void {
    if (!this.storage) throw new Error('Visual snapshot storage is unavailable');
    const serialized = JSON.stringify(collection);
    if (serialized.length > this.maxBytes) {
      throw new Error(`Visual snapshot storage limit exceeded (${this.maxBytes} bytes)`);
    }
    try {
      this.storage.setItem(this.storageKey, serialized);
    } catch (error) {
      throw new Error(`Unable to persist visual snapshots: ${String(error)}`);
    }
  }
}

function isCollection(value: unknown): value is VisualSnapshotCollection {
  if (!value || typeof value !== 'object') return false;
  const collection = value as Partial<VisualSnapshotCollection>;
  return collection.schemaVersion === VISUAL_SNAPSHOT_SCHEMA_VERSION
    && Array.isArray(collection.snapshots)
    && collection.snapshots.every(isVisualSnapshot);
}

function emptyCollection(): VisualSnapshotCollection {
  return { schemaVersion: VISUAL_SNAPSHOT_SCHEMA_VERSION, snapshots: [] };
}

function getBrowserStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function createId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // Utilise le fallback si randomUUID est indisponible.
  }
  return `snapshot-${Date.now()}-${fallbackId++}`;
}

let fallbackId = 0;
