export type VisualSnapshotType = 'table' | 'chart';

export interface VisualCopyFeedbackConfig {
  enabled?: boolean;
  durationMs?: number;
  message?: string;
}

export interface VisualSnapshot {
  id: string;
  schemaVersion: 1;
  type: VisualSnapshotType;
  label: string;
  createdAt: string;
  updatedAt: string;
  config: Record<string, unknown>;
  state: Record<string, unknown>;
  data: unknown[];
  warnings: string[];
}

export type VisualSnapshotDraft = Omit<VisualSnapshot, 'id' | 'schemaVersion' | 'createdAt' | 'updatedAt'>;

export interface VisualSnapshotCollection {
  schemaVersion: 1;
  snapshots: VisualSnapshot[];
}

export interface VisualSnapshotApplyResult {
  applied: boolean;
  restored: string[];
  skipped: string[];
  warnings: string[];
  data?: unknown[];
}

export interface VisualSnapshotStorageOptions {
  storage?: Storage;
  storageKey?: string;
  maxBytes?: number;
}

export const VISUAL_SNAPSHOT_SCHEMA_VERSION = 1 as const;
export const VISUAL_SNAPSHOT_STORAGE_KEY = 'jquery_visual_snapshots';
export const VISUAL_SNAPSHOT_DEFAULT_MAX_BYTES = 4 * 1024 * 1024;

export function isVisualSnapshot(value: unknown): value is VisualSnapshot {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as Partial<VisualSnapshot>;
  return snapshot.schemaVersion === VISUAL_SNAPSHOT_SCHEMA_VERSION
    && typeof snapshot.id === 'string'
    && typeof snapshot.label === 'string'
    && (snapshot.type === 'table' || snapshot.type === 'chart')
    && typeof snapshot.createdAt === 'string'
    && typeof snapshot.updatedAt === 'string'
    && isRecord(snapshot.config)
    && isRecord(snapshot.state)
    && Array.isArray(snapshot.data)
    && Array.isArray(snapshot.warnings);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
