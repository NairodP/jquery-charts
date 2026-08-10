import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ChartProvider, DuplicateVisualSnapshotLabelError, VisualSnapshot, VisualSnapshotStorage, field } from '@oneteme/jquery-core';
import { ChartClickEvent, ChartComponent, ChartDrilldownConfig, ChartDrilldownState } from '@oneteme/jquery-echarts';
import { OrganizerButtonComponent, OrganizerButtonEvent, OrganizerConfig, OrganizerState } from '@oneteme/jquery-organizer';
import { tableProviderFromSnapshot, TableComponent, TableProvider } from '@oneteme/jquery-table';

interface DemoRow {
  month: string;
  sales: number;
  orders: number;
}

interface DashboardSlot {
  id: string;
  snapshot: VisualSnapshot;
}

interface DrilldownRow {
  month: string;
  sales: number;
  orders: number;
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

  readonly drilldownChartConfig: ChartProvider<string, number> = {
    subtitle: '',
    xtitle: 'Période',
    ytitle: 'Valeur',
    series: [
      { name: 'Ventes', data: { x: field('month'), y: field('sales') }, color: '#1b6ca8' },
      { name: 'Commandes', data: { x: field('month'), y: field('orders') }, color: '#d97732' },
    ],
    options: { legend: { show: true }, grid: { left: 48, right: 24, bottom: 48 } },
  };

  readonly tableConfig: TableProvider<DemoRow> = {
    title: 'Activité commerciale',
    search: { enabled: true },
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
  private readonly tableConfigCache = new Map<string, TableProvider<any>>();
  activeCopyTarget: 'chart' | 'table' | null = null;
  copyTitle = '';
  copyError = '';
  drilldownRows: DrilldownRow[] = this.rows;
  selectedDrilldownMonth: string | null = null;
  drilldownLoading = false;
  drilldownError = '';
  drilldownConfig: ChartDrilldownConfig = {
    levels: [
      { id: 'months', label: 'Mois' },
      { id: 'days', label: 'Jours' },
      { id: 'hours', label: 'Heures' },
    ],
    activeLevel: 'months',
  };
  private readonly drilldownCache = new Map<string, DrilldownRow[]>();
  private drilldownRequestId = 0;
  selectedDrilldownDay: string | null = null;
  drilldownIsLocallyScoped = false;

  constructor() {
    this.drilldownCache.set('months', this.rows);
    this.refreshSnapshots();
  }

  refreshSnapshots(): void {
    this.snapshots = this.storage.list();
  }

  openCopyModal(target: 'chart' | 'table'): void {
    this.activeCopyTarget = target;
    this.copyTitle = target === 'chart' ? this.chartConfig.title || 'Graphique' : this.tableConfig.title || 'Tableau';
    this.copyError = '';
  }

  closeCopyModal(): void {
    this.activeCopyTarget = null;
    this.copyTitle = '';
    this.copyError = '';
  }

  get copyTitleAvailable(): boolean {
    return this.storage.isLabelAvailable(this.copyTitle);
  }

  confirmCopy(): void {
    const title = this.copyTitle.trim();
    if (!title || !this.activeCopyTarget || !this.copyTitleAvailable) return;
    try {
      if (this.activeCopyTarget === 'chart') {
        this.demoChart?.copyVisualSnapshot(title);
      } else {
        this.demoTable?.copyVisualSnapshot(title);
      }
    } catch (error) {
      this.copyError = error instanceof DuplicateVisualSnapshotLabelError
        ? 'Ce nom est déjà utilisé.'
        : 'La copie n’a pas pu être enregistrée.';
      return;
    }
    this.refreshSnapshots();
    this.closeCopyModal();
  }

  onChartOrganizerChange(event: OrganizerButtonEvent): void {
    if (event.type === 'fieldToggled') {
      this.chartOrganizerState = event.state;
    }
  }

  onDrilldownClick(event: ChartClickEvent): void {
    const value = typeof event.name === 'string' ? event.name : null;
    if (event.dataIndex === undefined || !value) return;
    if (this.drilldownConfig.activeLevel === 'months') {
      void this.loadMonthDetails(value);
    } else if (this.drilldownConfig.activeLevel === 'days' && this.selectedDrilldownMonth) {
      void this.loadHourDetails(value);
    }
  }

  onDrilldownNavigate(levelId: string): void {
    this.drilldownRequestId++;
    this.drilldownLoading = false;
    this.drilldownError = '';
    if (levelId === 'months') {
      this.selectedDrilldownMonth = null;
      this.selectedDrilldownDay = null;
      this.drilldownRows = this.drilldownCache.get('months') || this.rows;
    } else if (levelId === 'days' && this.selectedDrilldownMonth) {
      this.selectedDrilldownDay = null;
      this.drilldownRows = this.drilldownCache.get(this.monthCacheKey(this.selectedDrilldownMonth)) || this.drilldownRows;
    } else {
      return;
    }
    this.drilldownConfig = { ...this.drilldownConfig, activeLevel: levelId };
  }

  onDrilldownStateChange(state: ChartDrilldownState): void {
    this.drilldownIsLocallyScoped = state.active;
  }

  private async loadMonthDetails(month: string): Promise<void> {
    const requestId = ++this.drilldownRequestId;
    this.selectedDrilldownMonth = month;
    this.selectedDrilldownDay = null;
    this.drilldownLoading = true;
    this.drilldownError = '';

    try {
      const cacheKey = this.monthCacheKey(month);
      const rows = this.drilldownCache.get(cacheKey) || await this.fetchMonthDetails(month);
      if (requestId !== this.drilldownRequestId) return;
      this.drilldownCache.set(cacheKey, rows);
      this.drilldownRows = rows;
      this.drilldownConfig = { ...this.drilldownConfig, activeLevel: 'days' };
    } catch {
      if (requestId !== this.drilldownRequestId) return;
      this.drilldownError = `Impossible de charger le détail de ${month}.`;
    } finally {
      if (requestId === this.drilldownRequestId) this.drilldownLoading = false;
    }
  }

  private async loadHourDetails(day: string): Promise<void> {
    const month = this.selectedDrilldownMonth;
    if (!month) return;
    const requestId = ++this.drilldownRequestId;
    this.selectedDrilldownDay = day;
    this.drilldownLoading = true;
    this.drilldownError = '';

    try {
      const cacheKey = this.hourCacheKey(month, day);
      const rows = this.drilldownCache.get(cacheKey) || await this.fetchHourDetails(month, day);
      if (requestId !== this.drilldownRequestId) return;
      this.drilldownCache.set(cacheKey, rows);
      this.drilldownRows = rows;
      this.drilldownConfig = { ...this.drilldownConfig, activeLevel: 'hours' };
    } catch {
      if (requestId !== this.drilldownRequestId) return;
      this.drilldownError = `Impossible de charger le détail horaire du ${day}.`;
    } finally {
      if (requestId === this.drilldownRequestId) this.drilldownLoading = false;
    }
  }

  private fetchMonthDetails(month: string): Promise<DrilldownRow[]> {
    // Remplacer ce fournisseur local par l'appel HTTP vers l'API métier.
    const monthIndex = this.rows.findIndex(row => row.month === month);
    const source = this.rows[Math.max(monthIndex, 0)];
    return new Promise(resolve => {
      window.setTimeout(() => resolve(Array.from({ length: 28 }, (_, index) => ({
        month: `${String(index + 1).padStart(2, '0')} ${month.toLowerCase()}`,
        sales: Math.round(source.sales * (0.65 + ((index * 17) % 31) / 100)),
        orders: Math.max(1, Math.round(source.orders * (0.7 + ((index * 11) % 21) / 100))),
      }))), 2000);
    });
  }

  private fetchHourDetails(month: string, day: string): Promise<DrilldownRow[]> {
    const monthIndex = this.rows.findIndex(row => row.month === month);
    const source = this.rows[Math.max(monthIndex, 0)];
    const dayIndex = Number.parseInt(day, 10) || 1;
    return new Promise(resolve => {
      window.setTimeout(() => resolve(Array.from({ length: 24 }, (_, hour) => ({
        month: `${String(hour).padStart(2, '0')}:00`,
        sales: Math.max(1, Math.round(source.sales / 24 * (0.7 + ((hour + dayIndex) % 7) / 10))),
        orders: Math.max(1, Math.round(source.orders / 24 * (0.8 + ((hour + dayIndex) % 5) / 10))),
      }))), 900);
    });
  }

  private monthCacheKey(month: string): string { return `days:${month}`; }

  private hourCacheKey(month: string, day: string): string { return `hours:${month}:${day}`; }

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
    const cached = this.tableConfigCache.get(snapshot.id);
    if (cached) return cached;
    const config = tableProviderFromSnapshot(snapshot);
    this.tableConfigCache.set(snapshot.id, config);
    return config;
  }

}
