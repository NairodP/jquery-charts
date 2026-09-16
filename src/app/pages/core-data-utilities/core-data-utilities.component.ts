import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartComponent as EChartsChartComponent } from '@oneteme/jquery-echarts';
import { ChartComponent as HighchartsChartComponent } from '@oneteme/jquery-highcharts';
import {
  ChartClickEvent,
  ChartDateFormatOptions,
  ChartDrilldownConfig,
  ChartDrilldownRequest,
  ChartProvider,
  ChartRenderError,
  ChartType,
  GroupSyncMode,
  OrganizerConfig,
  OrganizerState,
  ReplaceChartDataFields,
  UnitConfig,
  VisualSnapshot,
  convertChartDataValues,
  createUnitConverter,
  defineLinearUnit,
  field,
  formatChartDataDates,
  formatChartDataValues,
  formatChartDate,
  formatChartNumber,
  formatUnitValue,
  normalizeChartDate,
  selectBestScale,
} from '@oneteme/jquery-core';

type DistanceUnit = 'm' | 'km';

interface DemoRow {
  timestamp: string | null;
  value: number | null;
  distanceM: number | null;
  label: string;
}

interface MonthlyRow {
  month: string;
  energy: number;
  production: number;
  temperature: number;
  forecast: number;
}

interface DrilldownRow {
  region: string;
  site: string;
  value: number;
}

type DemoDateRow = ReplaceChartDataFields<DemoRow, 'timestamp', string | null>;
type DemoValueRow = ReplaceChartDataFields<DemoRow, 'value', string | null>;
type DemoDistanceRow = ReplaceChartDataFields<DemoRow, 'distanceM', number | null>;

@Component({
  selector: 'app-echarts-preview',
  standalone: true,
  imports: [EChartsChartComponent],
  template: `
    <chart
      [type]="type"
      [config]="config"
      [data]="data"
      [isLoading]="isLoading"
      [loadingLabel]="loadingLabel"
      [noDataLabel]="noDataLabel"
      [theme]="theme"
      [group]="group"
      [groupSync]="groupSync"
      [renderedOption]="renderedOption"
      [organizer]="organizer"
      [organizerState]="organizerState"
      [drilldown]="drilldown"
      (chartClick)="chartClick.emit($event)"
      (renderError)="renderError.emit($event)"
      (drilldownRequest)="drilldownRequest.emit($event)"
      (drilldownNavigate)="drilldownNavigate.emit($event)"
      (visualCopied)="visualCopied.emit($event)"
    ></chart>
  `,
  styles: [':host { display: block; height: 100%; min-height: 0; }'],
})
export class EChartsPreviewComponent {
  @Input() type: ChartType = 'line';
  @Input({ required: true }) config!: ChartProvider<any, any>;
  @Input() data: any[] = [];
  @Input() isLoading = false;
  @Input() loadingLabel = 'Chargement des données...';
  @Input() noDataLabel = 'Aucune donnée';
  @Input() theme: string | null = null;
  @Input() group: string | null = null;
  @Input() groupSync: GroupSyncMode | null = null;
  @Input() renderedOption: any = null;
  @Input() organizer?: OrganizerConfig;
  @Input() organizerState?: OrganizerState;
  @Input() drilldown?: ChartDrilldownConfig;

  @Output() chartClick = new EventEmitter<ChartClickEvent>();
  @Output() renderError = new EventEmitter<ChartRenderError>();
  @Output() drilldownRequest = new EventEmitter<ChartDrilldownRequest>();
  @Output() drilldownNavigate = new EventEmitter<string>();
  @Output() visualCopied = new EventEmitter<VisualSnapshot>();
}

@Component({
  selector: 'app-chart-comparison',
  standalone: true,
  imports: [EChartsPreviewComponent, HighchartsChartComponent],
  template: `
    <div class="renderer-comparison">
      <section class="renderer-pane">
        <h4>jquery-echarts</h4>
        <app-echarts-preview
          [type]="type"
          [config]="config"
          [data]="data"
          [isLoading]="isLoading"
          [loadingLabel]="loadingLabel"
          [noDataLabel]="noDataLabel"
          [theme]="echartsTheme"
          [group]="group"
          [groupSync]="groupSync"
          [renderedOption]="echartsRenderedOption"
          [organizer]="organizer"
          [organizerState]="organizerState"
          [drilldown]="drilldown"
          (chartClick)="chartClick.emit($event)"
          (renderError)="renderError.emit($event)"
          (drilldownRequest)="drilldownRequest.emit($event)"
          (drilldownNavigate)="drilldownNavigate.emit($event)"
          (visualCopied)="visualCopied.emit($event)"
        ></app-echarts-preview>
      </section>
      <section class="renderer-pane">
        <h4>jquery-highcharts</h4>
        <chart
          [type]="type"
          [config]="config"
          [data]="data"
          [isLoading]="isLoading"
          [loadingLabel]="loadingLabel"
          [noDataLabel]="noDataLabel"
          [theme]="highchartsTheme"
          [group]="group"
          [groupSync]="groupSync"
          [renderedOption]="highchartsRenderedOption"
          [organizer]="organizer"
          [organizerState]="organizerState"
          [drilldown]="drilldown"
          (chartClick)="chartClick.emit($event)"
          (renderError)="renderError.emit($event)"
          (drilldownRequest)="drilldownRequest.emit($event)"
          (drilldownNavigate)="drilldownNavigate.emit($event)"
          (visualCopied)="visualCopied.emit($event)"
        ></chart>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .renderer-comparison { display: grid; gap: .85rem; grid-auto-rows: 310px; grid-template-columns: minmax(0, 1fr); }
    .renderer-pane { display: flex; flex-direction: column; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 9px; min-height: 0; min-width: 0; padding: .55rem .65rem .65rem; }
    .renderer-pane h4 { color: #475569; font-family: var(--font-mono, monospace); font-size: .68rem; letter-spacing: .04em; margin: 0 0 .35rem; text-transform: uppercase; }
    .renderer-pane > chart, .renderer-pane > app-echarts-preview { display: block; flex: 1 1 auto; height: auto; min-height: 0; }
    @media (max-width: 680px) { .renderer-comparison { grid-template-columns: 1fr; } }
  `],
})
export class ChartComparisonComponent {
  @Input() type: ChartType = 'line';
  @Input({ required: true }) config!: ChartProvider<any, any>;
  @Input() data: any[] = [];
  @Input() isLoading = false;
  @Input() loadingLabel = 'Chargement des données...';
  @Input() noDataLabel = 'Aucune donnée';
  @Input() echartsTheme: string | null = null;
  @Input() highchartsTheme: any = null;
  @Input() group: string | null = null;
  @Input() groupSync: GroupSyncMode | null = null;
  @Input() echartsRenderedOption: any = null;
  @Input() highchartsRenderedOption: any = null;
  @Input() organizer?: OrganizerConfig;
  @Input() organizerState?: OrganizerState;
  @Input() drilldown?: ChartDrilldownConfig;

  @Output() chartClick = new EventEmitter<ChartClickEvent>();
  @Output() renderError = new EventEmitter<ChartRenderError>();
  @Output() drilldownRequest = new EventEmitter<ChartDrilldownRequest>();
  @Output() drilldownNavigate = new EventEmitter<string>();
  @Output() visualCopied = new EventEmitter<VisualSnapshot>();
}

@Component({
  selector: 'app-core-data-utilities',
  standalone: true,
  imports: [CommonModule, FormsModule, ChartComparisonComponent, HighchartsChartComponent, EChartsPreviewComponent],
  templateUrl: './core-data-utilities.component.html',
  styleUrls: ['./core-data-utilities.component.scss'],
})
export class CoreDataUtilitiesComponent {
  readonly locales = ['fr-FR', 'en-US'];
  readonly timeZones = ['Europe/Paris', 'UTC', 'America/New_York'];
  readonly sourceData: readonly DemoRow[] = [
    {
      timestamp: '2024-01-15T23:30:00.000Z',
      value: 1234.567,
      distanceM: 2500,
      label: 'Instant avec changement de jour',
    },
    {
      timestamp: null,
      value: null,
      distanceM: null,
      label: 'Valeurs nulles',
    },
  ];
  readonly coreChartData = this.sourceData.map(row => ({
    label: row.label,
    value: row.value ?? 0,
  }));
  readonly coreChartConfig: ChartProvider<string, number> = {
    title: 'Fixture transformée',
    series: [{ name: 'Valeur', color: '#6366f1', data: { x: field('label'), y: field('value') } }],
  };

  readonly monthlyData: readonly MonthlyRow[] = [
    { month: 'Jan', energy: 1200, production: 920, temperature: 5, forecast: 1100 },
    { month: 'Fév', energy: 1450, production: 1050, temperature: 7, forecast: 1350 },
    { month: 'Mar', energy: 1720, production: 1280, temperature: 11, forecast: 1600 },
    { month: 'Avr', energy: 1880, production: 1490, temperature: 14, forecast: 1800 },
    { month: 'Mai', energy: 2140, production: 1760, temperature: 18, forecast: 2050 },
    { month: 'Juin', energy: 2360, production: 2010, temperature: 22, forecast: 2250 },
  ];
  readonly emptyChartData: readonly MonthlyRow[] = [];

  readonly durationValues = [0.42, 0.68, 0.91];
  readonly durationUnitConfig: UnitConfig = {
    baseUnit: 's',
    scales: [
      { unit: 'ms', scale: 1000, threshold: 1 },
      { unit: 's', scale: 1, threshold: Infinity },
    ],
    precision: 0,
  };
  readonly distanceConverter = createUnitConverter<DistanceUnit>([
    defineLinearUnit('m', { factor: 1 }),
    defineLinearUnit('km', { factor: 1000 }),
  ]);

  selectedLocale = 'fr-FR';
  selectedTimeZone = 'Europe/Paris';
  precision = 2;
  formattedDates: DemoDateRow[] = [];
  formattedValues: DemoValueRow[] = [];
  convertedDistances: DemoDistanceRow[] = [];
  formattedInstant = '';
  normalizedInstant = '';
  dynamicDurationDisplay: string[] = [];
  selectedDurationUnit = '';
  invalidDateMessage = '';
  invalidDateNullMessage = '';
  invalidNumberMessage = '';
  invalidNumberNullMessage = '';
  unknownUnitMessage = '';
  sourceIsUnchanged = true;

  readonly mixedConfig: ChartProvider<string, number> = {
    title: 'Consommation et température',
    subtitle: 'Séries mixtes et deux axes Y',
    xtitle: 'Mois',
    ytitle: ['Énergie', 'Température'],
    series: [
      {
        name: 'Consommation',
        type: 'column',
        unit: 'MWh',
        yAxisIndex: 0,
        color: '#2563eb',
        data: { x: field('month'), y: field('energy') },
      },
      {
        name: 'Température',
        type: 'spline',
        unit: '°C',
        yAxisIndex: 1,
        yAxisConfig: { opposite: true },
        color: '#f97316',
        data: { x: field('month'), y: field('temperature') },
      },
    ],
    options: {
      tooltip: { shared: true },
      plotOptions: { series: { animation: false } },
    },
  };

  readonly themedConfig: ChartProvider<string, number> = {
    title: 'Thème injecté',
    subtitle: 'Le wrapper conserve les données et applique le thème',
    series: [
      {
        name: 'Production',
        unit: 'MWh',
        data: { x: field('month'), y: field('production') },
      },
    ],
  };

  readonly renderedOptionConfig: ChartProvider<string, number> = { series: [] };
  readonly renderedOption: any = {
    chart: { type: 'areaspline' },
    title: { text: 'Option Highcharts fournie directement' },
    subtitle: { text: 'renderedOption est prioritaire sur la construction Core' },
    xAxis: { categories: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'] },
    yAxis: { title: { text: 'Valeur brute' } },
    tooltip: { shared: true },
    series: [
      { type: 'areaspline', name: 'Option brute', data: [4, 7, 5, 9, 8, 11] },
    ],
  };
  readonly echartsRenderedOption: any = {
    title: { text: 'Option ECharts fournie directement' },
    subtitle: { text: 'Même contrat renderedOption, format moteur natif' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'] },
    yAxis: { type: 'value', name: 'Valeur brute' },
    series: [
      { type: 'line', name: 'Option brute', data: [4, 7, 5, 9, 8, 11], smooth: true },
    ],
  };

  readonly theme: any = {
    chart: { backgroundColor: '#172554', borderRadius: 12 },
    colors: ['#67e8f9', '#f0abfc', '#fde68a'],
    title: { style: { color: '#f8fafc', fontWeight: '700' } },
    subtitle: { style: { color: '#bfdbfe' } },
    xAxis: {
      labels: { style: { color: '#dbeafe' } },
      lineColor: '#60a5fa',
      tickColor: '#60a5fa',
    },
    yAxis: {
      labels: { style: { color: '#dbeafe' } },
      title: { style: { color: '#dbeafe' } },
      gridLineColor: 'rgba(147, 197, 253, .2)',
    },
    legend: { itemStyle: { color: '#f8fafc' } },
  };

  readonly organizerConfig: OrganizerConfig = {
    enabled: true,
    enableFieldRemoval: true,
    enableFieldDragDrop: false,
  };
  organizerState: OrganizerState = {
    selectedFieldIds: ['Consommation', 'Production', 'Prévision'],
    groupByKey: null,
    dynamicSliceKeys: [],
  };
  readonly organizerChartConfig: ChartProvider<string, number> = {
    title: 'Séries pilotées par Organizer',
    subtitle: 'Les boutons modifient organizerState sans muter la configuration',
    series: [
      { name: 'Consommation', color: '#2563eb', data: { x: field('month'), y: field('energy') } },
      { name: 'Production', color: '#16a34a', data: { x: field('month'), y: field('production') } },
      { name: 'Prévision', color: '#9333ea', data: { x: field('month'), y: field('forecast') } },
    ],
  };

  readonly drilldownLevels: ChartDrilldownConfig = {
    levels: [
      { id: 'region', label: 'Régions', groupBy: 'region' },
      { id: 'site', label: 'Sites', groupBy: 'site' },
    ],
    activeLevel: 'region',
  };
  readonly drilldownChartConfig: ChartProvider<string, number> = {
    title: 'Navigation hiérarchique',
    series: [{
      name: 'Valeur',
      color: '#0f766e',
      data: { x: field('region'), y: field('value') },
    }],
  };
  readonly drilldownSiteChartConfig: ChartProvider<string, number> = {
    title: 'Navigation hiérarchique',
    series: [{
      name: 'Valeur',
      color: '#0f766e',
      data: { x: field('site'), y: field('value') },
    }],
  };
  drilldownConfig: ChartDrilldownConfig = this.drilldownLevels;
  drilldownData: readonly DrilldownRow[] = [
    { region: 'Nord', site: 'Lille', value: 42 },
    { region: 'Nord', site: 'Arras', value: 31 },
    { region: 'Sud', site: 'Toulouse', value: 27 },
    { region: 'Sud', site: 'Montpellier', value: 36 },
  ];
  drilldownTitle = 'Cliquez une région pour descendre au niveau site';

  isLoadingDemo = false;
  showNoDataDemo = false;
  readonly syncGroup = 'core-data-sync-demo';
  lastChartClick = 'Aucun clic capturé';
  lastRenderError = '';
  lastSnapshot: VisualSnapshot | null = null;

  private readonly baseDateOptions: ChartDateFormatOptions = {
    format: { day: '2-digit', month: '2-digit', year: 'numeric' },
  };

  constructor() {
    this.refresh();
  }

  get loadingDemoData(): readonly MonthlyRow[] {
    return this.showNoDataDemo ? this.emptyChartData : this.monthlyData;
  }

  get durationScale(): ReturnType<typeof selectBestScale> {
    return selectBestScale(this.durationUnitConfig, this.durationValues);
  }

  refresh(): void {
    const precision = Number.isInteger(this.precision) && this.precision >= 0 && this.precision <= 10
      ? this.precision
      : 2;
    this.precision = precision;
    const dateOptions: ChartDateFormatOptions = {
      ...this.baseDateOptions,
      locale: this.selectedLocale,
      timeZone: this.selectedTimeZone,
    };

    this.formattedDates = formatChartDataDates(this.sourceData, ['timestamp'], dateOptions);
    this.formattedValues = formatChartDataValues(
      this.sourceData,
      ['value'],
      { locale: this.selectedLocale, precision },
    );
    this.convertedDistances = convertChartDataValues(
      this.sourceData,
      ['distanceM'],
      this.distanceConverter,
      'm',
      'km',
    );
    this.formattedInstant = formatChartDate(this.sourceData[0].timestamp, dateOptions) ?? 'null';
    this.normalizedInstant = normalizeChartDate(this.sourceData[0].timestamp)?.toISOString() ?? 'null';
    this.dynamicDurationDisplay = this.durationValues.map(value =>
      formatUnitValue(value, this.durationUnitConfig.baseUnit, this.durationScale),
    );
    this.selectedDurationUnit = this.durationScale.unit;

    this.invalidDateMessage = this.captureError(() =>
      formatChartDate('not-a-date', dateOptions),
    );
    this.invalidDateNullMessage = String(formatChartDate('not-a-date', {
      ...dateOptions,
      invalidDate: 'null',
    }));
    this.invalidNumberMessage = this.captureError(() =>
      formatChartNumber('not-a-number', { locale: this.selectedLocale }),
    );
    this.invalidNumberNullMessage = String(formatChartNumber('not-a-number', {
      locale: this.selectedLocale,
      invalidNumber: 'null',
    }));
    this.unknownUnitMessage = this.captureError(() =>
      this.distanceConverter.convert(1, 'm', 'mile' as DistanceUnit),
    );
    const sourceValue = this.sourceData[0].value;
    const sourceValueMatches = typeof sourceValue === 'number'
      && Number.isFinite(sourceValue)
      && Math.abs(sourceValue - 1234.567) < 0.000001;
    this.sourceIsUnchanged = sourceValueMatches
      && this.sourceData[0].distanceM === 2500
      && this.sourceData[0].timestamp === '2024-01-15T23:30:00.000Z';
  }

  toggleOrganizerSeries(id: string): void {
    const selected = new Set(this.organizerState.selectedFieldIds);
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    this.organizerState = {
      ...this.organizerState,
      selectedFieldIds: ['Consommation', 'Production', 'Prévision']
        .filter(seriesId => selected.has(seriesId)),
    };
  }

  isOrganizerSeriesSelected(id: string): boolean {
    return this.organizerState.selectedFieldIds.includes(id);
  }

  onDrilldownRequest(request: ChartDrilldownRequest): void {
    if (request.toLevel !== 'site') return;
    const region = this.describeValue(request.value);
    this.drilldownData = this.drilldownData.filter(row => row.region === region);
    this.drilldownConfig = { ...this.drilldownConfig, activeLevel: 'site' };
    this.drilldownTitle = `Sites de ${region} — utilisez le fil d'Ariane pour revenir`;
  }

  onDrilldownNavigate(levelId: string): void {
    if (levelId !== 'region') return;
    this.drilldownData = [
      { region: 'Nord', site: 'Lille', value: 42 },
      { region: 'Nord', site: 'Arras', value: 31 },
      { region: 'Sud', site: 'Toulouse', value: 27 },
      { region: 'Sud', site: 'Montpellier', value: 36 },
    ];
    this.drilldownConfig = { ...this.drilldownConfig, activeLevel: 'region' };
    this.drilldownTitle = 'Cliquez une région pour descendre au niveau site';
  }

  onChartClick(event: ChartClickEvent): void {
    this.lastChartClick = `${event.name ?? 'sans nom'} — valeur ${this.formatJson(event.value)}`;
  }

  onRenderError(event: ChartRenderError): void {
    this.lastRenderError = this.describeValue(event.error);
  }

  onSnapshotCreated(snapshot: VisualSnapshot): void {
    this.lastSnapshot = snapshot;
  }

  formatJson(value: unknown): string {
    try {
      return JSON.stringify(value, null, 2) ?? '';
    } catch {
      return this.describeValue(value);
    }
  }

  captureError(operation: () => unknown): string {
    try {
      operation();
      return 'Aucune erreur';
    } catch (error: unknown) {
      return this.describeValue(error);
    }
  }

  private describeValue(value: unknown): string {
    if (value instanceof Error) return value.message;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
      try {
        return JSON.stringify(value) ?? '<valeur non sérialisable>';
      } catch {
        return '<valeur non sérialisable>';
      }
    }
    switch (typeof value) {
      case 'number':
      case 'boolean':
      case 'bigint':
        return value.toString();
      case 'symbol':
        return value.description ? `Symbol(${value.description})` : 'Symbol()';
      case 'undefined':
        return 'undefined';
      default:
        return '<valeur non sérialisable>';
    }
  }
}
