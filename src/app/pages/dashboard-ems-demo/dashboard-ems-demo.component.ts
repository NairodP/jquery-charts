import {CommonModule} from '@angular/common';
import {CdkDragDrop, DragDropModule, moveItemInArray} from '@angular/cdk/drag-drop';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {RouterLink} from '@angular/router';
import {OrganizerButtonComponent, OrganizerButtonEvent, OrganizerConfig, OrganizerState} from '@oneteme/jquery-organizer';
import {ChartProvider, ChartType} from '@oneteme/jquery-core';
import {DashboardDemoChartComponent} from './dashboard-demo-chart.component';

interface DashboardDemoChart {
  id: string;
  title: string;
  type: ChartType;
  columns: 1 | 2;
  config: ChartProvider<string, number>;
  data: Array<Record<string, string | number>>;
}

@Component({
  selector: 'app-dashboard-ems-demo',
  standalone: true,
  imports: [CommonModule, DragDropModule, RouterLink, OrganizerButtonComponent, DashboardDemoChartComponent],
  templateUrl: './dashboard-ems-demo.component.html',
  styleUrls: ['./dashboard-ems-demo.component.scss']
})
export class DashboardEmsDemoComponent implements OnInit, OnDestroy {
  private readonly storageKey = 'jquery-charts:demo:ems-dashboard';
  private dataArrivalSimulationTimeout?: ReturnType<typeof setTimeout>;

  readonly organizerConfig: OrganizerConfig = {
    fields: [
      {id: 'usage', label: 'Consommation', visible: true},
      {id: 'sites', label: 'Sites', visible: true}
    ],
    showActions: true,
    actions: {showCopy: true, showFullscreen: true},
    buttonLabel: 'Actions du graphique',
    buttonIcon: 'settings',
    showButtonIcon: true
  };

  organizerState: OrganizerState = {visibleFields: ['usage', 'sites']};
  charts: DashboardDemoChart[] = [];
  editMode = false;
  isDataArrivalSimulationRunning = false;
  lastInteraction = 'Initialisation du dashboard';

  ngOnInit(): void {
    this.restoreDashboard();
  }

  ngOnDestroy(): void {
    if (this.dataArrivalSimulationTimeout) {
      clearTimeout(this.dataArrivalSimulationTimeout);
    }
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    this.lastInteraction = this.editMode ? 'Mode edition active' : 'Mode vue active';
  }

  onOrganizerChange(event: OrganizerButtonEvent): void {
    this.organizerState = event.state;
    this.lastInteraction = `Organizer : ${event.type}. La configuration et les donnees des graphiques restent inchangees.`;
  }

  reorderCharts(event: CdkDragDrop<DashboardDemoChart[]>): void {
    if (!this.editMode || event.previousIndex === event.currentIndex) {
      return;
    }

    moveItemInArray(this.charts, event.previousIndex, event.currentIndex);
    this.saveDashboard();
    this.lastInteraction = 'Ordre des cartes enregistre sans recreer les configurations de graphique.';
  }

  toggleColumns(chart: DashboardDemoChart): void {
    if (!this.editMode) {
      return;
    }

    chart.columns = chart.columns === 1 ? 2 : 1;
    this.saveDashboard();
    this.lastInteraction = `Largeur de « ${chart.title} » enregistree sans modifier sa configuration.`;
  }

  addChart(): void {
    const position = this.charts.length + 1;
    this.charts.push(this.createChart(`chart-${Date.now()}`, `Nouveau graphique ${position}`, 'column', 1));
    this.saveDashboard();
    this.lastInteraction = 'Nouveau brouillon ajoute avec une configuration JSON serialisable.';
  }

  resetDashboard(): void {
    localStorage.removeItem(this.storageKey);
    this.charts = this.createInitialCharts();
    this.saveDashboard();
    this.lastInteraction = 'Demo reinitialisee.';
  }

  simulateDataArrival(): void {
    const chart = this.charts.find(({id}) => id === 'usage');
    if (!chart || this.isDataArrivalSimulationRunning) {
      return;
    }

    const data = chart.data.map((dataPoint) => ({...dataPoint}));
    this.charts = this.charts.map((currentChart) =>
      currentChart.id === chart.id ? {...currentChart, data: []} : currentChart
    );
    this.isDataArrivalSimulationRunning = true;
    this.lastInteraction = 'Simulation : chargement des donnees de « Consommation mensuelle ».';

    this.dataArrivalSimulationTimeout = setTimeout(() => {
      this.charts = this.charts.map((currentChart) =>
        currentChart.id === chart.id ? {...currentChart, data} : currentChart
      );
      this.isDataArrivalSimulationRunning = false;
      this.dataArrivalSimulationTimeout = undefined;
      this.lastInteraction = 'Simulation : donnees recues. Le chargement est termine.';
    }, 900);
  }

  trackChart(_index: number, chart: DashboardDemoChart): string {
    return chart.id;
  }

  private restoreDashboard(): void {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) {
      this.charts = this.createInitialCharts();
      this.saveDashboard();
      return;
    }

    try {
      const charts = JSON.parse(stored) as DashboardDemoChart[];
      this.charts = Array.isArray(charts) ? charts : this.createInitialCharts();
      this.lastInteraction = 'Dashboard restaure depuis localStorage avec des coordonnees JSON.';
    } catch {
      this.charts = this.createInitialCharts();
      this.saveDashboard();
    }
  }

  private saveDashboard(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.charts));
  }

  private createInitialCharts(): DashboardDemoChart[] {
    return [
      this.createChart('usage', 'Consommation mensuelle', 'column', 1),
      this.createChart('sites', 'Sites actifs', 'line', 1)
    ];
  }

  private createChart(id: string, title: string, type: ChartType, columns: 1 | 2): DashboardDemoChart {
    const suffix = id === 'sites' ? 'sites' : 'usage';
    return {
      id,
      title,
      type,
      columns,
      config: {
        xtitle: 'Periode',
        ytitle: suffix === 'usage' ? 'MWh' : 'Nombre de sites',
        series: [{
          name: title,
          type,
          color: suffix === 'usage' ? '#176b72' : '#bc5b35',
          data: {xField: 'period', yField: suffix}
        }]
      },
      data: [
        {period: 'Jan.', usage: 112, sites: 19},
        {period: 'Fev.', usage: 136, sites: 23},
        {period: 'Mars', usage: 128, sites: 22},
        {period: 'Avr.', usage: 161, sites: 27}
      ]
    };
  }
}