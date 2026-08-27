/** Type EventEmitter pour les events toolbar */
export type ChartCustomEvent = 'previous' | 'next' | 'pivot';

/** Paramètres utiles lors d'un clic sur un élément ECharts. */
export interface ChartClickEvent {
  componentType?: string;
  seriesType?: string;
  seriesIndex?: number;
  dataIndex?: number;
  name?: string;
  value?: unknown;
  data?: unknown;
  encode?: Record<string, number[]>;
  event?: unknown;
}

export interface ChartDrilldownLevel {
  id: string;
  label: string;
  groupBy?: string;
}

export interface ChartDrilldownConfig {
  levels: ChartDrilldownLevel[];
  activeLevel: string;
}

export interface ChartDrilldownState {
  active: boolean;
  activeLevel: string;
  rootLevel: string | null;
}

export interface ChartDrilldownRequest {
  fromLevel: string;
  toLevel: string;
  groupBy?: string;
  value: unknown;
  path: Record<string, unknown>;
}

/** Erreur produite lors de la construction de l'option ou de son application a ECharts. */
export interface ChartRenderError {
  error: unknown;
}

/** Alias exposé pour les options ECharts natives */
export type { ECharts, EChartsOption } from 'echarts';

/** Options de la loading API native d'ECharts (hors `text` — fourni par l'Input `loadingLabel`) */
export const DEFAULT_LOADING_OPTION = {
  color: '#5470c6',
  textColor: '#333',
  maskColor: 'rgba(255, 255, 255, 0.8)',
  zlevel: 0,
  fontSize: 12,
  showSpinner: false,
};
