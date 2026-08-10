import { VisualSnapshot } from '@oneteme/jquery-core';
import { TableProvider } from './jquery-table.model';

/**
 * Reconstruit la vue autonome d'un snapshot de tableau.
 * Les actions d'édition sont volontairement absentes d'une copie ; la recherche
 * reste disponible et s'appuie sur les données sérialisées du snapshot.
 */
export function tableProviderFromSnapshot(snapshot: VisualSnapshot): TableProvider<any> {
  if (snapshot.type !== 'table') {
    return { columns: [] };
  }

  const config = snapshot.config as {
    title?: string;
    columns?: Array<{ key: string; header?: string; sortable?: boolean; optional?: boolean }>;
    search?: TableProvider<any>['search'];
    pagination?: TableProvider<any>['pagination'];
  };
  const state = snapshot.state as {
    search?: string;
    groupBy?: string | null;
    columnOrder?: string[];
    visibleColumns?: string[];
    pageSize?: number;
  };
  const columns = (config.columns ?? []).map(column => ({
    key: column.key,
    header: column.header || column.key,
    sortable: column.sortable !== false,
    optional: column.optional,
    searchValue: (row: any): string => {
      const value = row?.[column.key];
      return value == null ? '' : String(value);
    },
  }));
  const orderedKeys = state.columnOrder?.length ? state.columnOrder : state.visibleColumns;
  const orderedColumns = orderedKeys?.length
    ? orderedKeys.map(key => columns.find(column => column.key === key)).filter(Boolean)
    : columns;

  return {
    title: config.title,
    search: config.search
      ? { ...config.search, initialQuery: state.search ?? config.search.initialQuery }
      : undefined,
    pagination: config.pagination
      ? { ...config.pagination, pageSize: state.pageSize ?? config.pagination.pageSize }
      : undefined,
    defaultGroupBy: state.groupBy ?? null,
    view: { enabled: false, enableColumnRemoval: false, enableColumnDragDrop: false },
    export: { enabled: false },
    preferences: { enabled: false },
    showActions: false,
    columns: orderedColumns as any[],
  };
}