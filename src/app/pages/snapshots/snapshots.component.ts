import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ChartProvider, VisualSnapshot, VisualSnapshotStorage, field } from '@oneteme/jquery-core';
import { ChartComponent } from '@oneteme/jquery-echarts';
import { OrganizerButtonComponent, OrganizerButtonEvent, OrganizerConfig, OrganizerState } from '@oneteme/jquery-organizer';
import { TableComponent, TableProvider } from '@oneteme/jquery-table';

interface DemoRow {
  month: string;
  sales: number;
  orders: number;
}

interface DashboardSlot {
  id: string;
  snapshot: VisualSnapshot;
}

@Component({
  selector: 'app-snapshots',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatMenuModule, ChartComponent, TableComponent, OrganizerButtonComponent],
  templateUrl: './snapshots.component.html',
  styleUrls: ['./snapshots.component.scss'],
})
export class SnapshotsComponent {
  @ViewChild('demoChart') demoChart?: ChartComponent<any, any>;
  @ViewChild('demoTable') demoTable?: TableComponent<DemoRow>;

  readonly storage = new VisualSnapshotStorage();
  readonly rows: DemoRow[] = [
    { month: 'Janvier', sales: 120, orders: 18 },
    { month: 'Février', sales: 168, orders: 24 },
    { month: 'Mars', sales: 142, orders: 21 },
    { month: 'Avril', sales: 214, orders: 31 },
    { month: 'Mai', sales: 196, orders: 28 },
    { month: 'Juin', sales: 248, orders: 36 },
  ];

  readonly chartConfig: ChartProvider<string, number> = {
    title: 'Activité commerciale',
    subtitle: 'Démonstration des snapshots',
    xtitle: 'Mois',
    ytitle: 'Valeur',
    series: [
      { name: 'Ventes', data: { x: field('month'), y: field('sales') }, color: '#1b6ca8' },
      { name: 'Commandes', data: { x: field('month'), y: field('orders') }, color: '#d97732' },
    ],
    options: { legend: { show: true }, grid: { left: 48, right: 24, bottom: 48 } },
  };

  readonly tableConfig: TableProvider<DemoRow> = {
    title: 'Activité commerciale',
    search: { enabled: true, searchColumns: ['month'] },
    view: { enabled: true, enableColumnRemoval: true },
    export: { enabled: true, filename: 'activite-commerciale' },
    preferences: { enabled: true, tableId: 'snapshot-demo-table' },
    showActions: true,
    onCopyVisual: () => this.openCopyModal('table'),
    onToggleFullscreen: () => this.demoTable?.toggleFullscreen(),
    columns: [
      { key: 'month', header: 'Mois', sortable: true },
      { key: 'sales', header: 'Ventes', sortable: true, groupable: true },
      { key: 'orders', header: 'Commandes', sortable: true, groupable: true },
    ],
  };

  readonly chartOrganizerConfig: OrganizerConfig = {
    fields: [
      { id: 'Ventes', label: 'Ventes', visible: true },
      { id: 'Commandes', label: 'Commandes', visible: true },
    ],
    showActions: true,
    onCopyVisual: () => this.openCopyModal('chart'),
    onToggleFullscreen: () => this.demoChart?.toggleFullscreen(),
  };

  chartOrganizerState: OrganizerState = { visibleFields: ['Ventes', 'Commandes'] };
  snapshots: VisualSnapshot[] = [];
  dashboardSlots: DashboardSlot[] = [];
  activeCopyTarget: 'chart' | 'table' | null = null;
  copyTitle = '';

  constructor() {
    this.refreshSnapshots();
  }

  refreshSnapshots(): void {
    this.snapshots = this.storage.list();
  }

  openCopyModal(target: 'chart' | 'table'): void {
    this.activeCopyTarget = target;
    this.copyTitle = target === 'chart' ? this.chartConfig.title || 'Graphique' : this.tableConfig.title || 'Tableau';
  }

  closeCopyModal(): void {
    this.activeCopyTarget = null;
    this.copyTitle = '';
  }

  confirmCopy(): void {
    const title = this.copyTitle.trim();
    if (!title || !this.activeCopyTarget) return;
    if (this.activeCopyTarget === 'chart') {
      this.demoChart?.copyVisualSnapshot(title);
    } else {
      this.demoTable?.copyVisualSnapshot(title);
    }
    this.refreshSnapshots();
    this.closeCopyModal();
  }

  onChartOrganizerChange(event: OrganizerButtonEvent): void {
    if (event.type === 'fieldToggled') {
      this.chartOrganizerState = event.state;
    }
  }

  snapshotsOfType(type: 'chart' | 'table'): VisualSnapshot[] {
    return this.snapshots.filter(snapshot => snapshot.type === type);
  }

  addSnapshot(snapshot: VisualSnapshot): void {
    this.dashboardSlots = [...this.dashboardSlots, { id: `${snapshot.id}-${Date.now()}`, snapshot }];
  }

  removeSlot(slotId: string): void {
    this.dashboardSlots = this.dashboardSlots.filter(slot => slot.id !== slotId);
  }

  snapshotChartType(snapshot: VisualSnapshot): string {
    const config = snapshot.config as { type?: string };
    return config.type || 'line';
  }

  snapshotRenderedOption(snapshot: VisualSnapshot): any {
    const config = snapshot.config as { renderedOption?: unknown };
    return config.renderedOption ?? null;
  }

  snapshotChartConfig(snapshot: VisualSnapshot): ChartProvider<any, any> {
    const config = snapshot.config as { provider?: ChartProvider<any, any> };
    return config.provider ?? { series: [] };
  }

  snapshotTableConfig(snapshot: VisualSnapshot): TableProvider<any> {
    const config = snapshot.config as { title?: string; columns?: any[]; search?: TableProvider<any>['search']; pagination?: TableProvider<any>['pagination'] };
    const state = snapshot.state as { search?: string; visibleColumns?: string[]; columnOrder?: string[] };
    const columns = (config.columns || []).map(column => ({
      key: column.key,
      header: column.header || column.key,
      sortable: column.sortable !== false,
      optional: column.optional,
    }));
    const orderedKeys = state.columnOrder || state.visibleColumns;
    const orderedColumns = orderedKeys?.length
      ? orderedKeys.map(key => columns.find(column => column.key === key)).filter(Boolean)
      : columns;
    return {
      title: config.title,
      search: config.search ? { ...config.search, initialQuery: state.search } : undefined,
      pagination: config.pagination,
      columns: orderedColumns as any[],
    };
  }

}
