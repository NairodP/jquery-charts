import {
  Directive,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import {
  ChartClickEvent,
  ChartGroupSyncEvent,
  ChartProvider,
  ChartRenderError,
  ChartView,
  cloneSerializable,
  GroupSyncAction,
  GroupSyncMode,
  mergeDeep,
  publishChartGroupSync,
  registerChartGroupSync,
  XaxisType,
  YaxisType,
} from '@oneteme/jquery-core';
import ApexCharts from 'apexcharts';
import { asapScheduler } from 'rxjs';
import {
  ChartCustomEvent,
  customIcons,
  destroyChart,
  fixToolbarSvgIds,
  initCommonChartOptions,
  setupScrollPrevention,
  setupToolbarObserver,
  updateCommonOptions,
} from './utils';

export interface ApexChartHandle {
  exportImage(fileName?: string, type?: 'png' | 'jpeg' | 'svg', pixelRatio?: number): void;
  exportData(fileName?: string, separator?: string): void;
  resize(): void;
  getRenderedOption(): unknown;
}

@Directive()
export abstract class ApexChartDirectiveBase<
  X extends XaxisType,
  Y extends YaxisType,
> implements ChartView<X, Y>, OnChanges, OnDestroy, ApexChartHandle {
  protected readonly el = inject(ElementRef<HTMLElement>);
  protected readonly ngZone = inject(NgZone);
  protected readonly chartInstance = signal<ApexCharts | null>(null);

  protected _options: any;
  protected _chartConfig!: ChartProvider<X, Y>;
  private toolbarObserver: MutationObserver | null = null;
  private groupSyncUnregister: (() => void) | null = null;
  private readonly groupSyncSource = Symbol('jquery-apexcharts');
  private isSyncing = false;
  private lastTooltipPoint: { seriesIndex: number; dataPointIndex: number } | null = null;
  private _isLoading = false;
  private _loadingLabel = 'Chargement des données...';
  private _noDataLabel = 'Aucune donnée';
  private _canPivot = false;
  private _group: string | null = null;
  private _groupSync: GroupSyncMode | null = null;
  private destroyed = false;

  @Input() debug = false;
  @Input({ required: true }) data: any[] = [];
  @Input() renderedOption?: unknown;

  @Input()
  set config(config: ChartProvider<X, Y>) {
    this._chartConfig = config;
    this._options = updateCommonOptions(this._options, config);
    this.configureTypeSpecificOptions();
    this._options.chart.toolbar.tools.customIcons = this.createCustomIcons();
  }

  @Input()
  set isLoading(value: boolean) {
    this._isLoading = value;
    this.updateNoDataLabel();
  }

  get isLoading(): boolean {
    return this._isLoading;
  }

  @Input()
  set loadingLabel(value: string) {
    this._loadingLabel = value || 'Chargement des données...';
    this.updateNoDataLabel();
  }

  @Input()
  set noDataLabel(value: string) {
    this._noDataLabel = value || 'Aucune donnée';
    this.updateNoDataLabel();
  }

  @Input()
  set canPivot(value: boolean) {
    this._canPivot = value === true;
    this._options.chart.toolbar.tools.customIcons = this.createCustomIcons();
  }

  get canPivot(): boolean {
    return this._canPivot;
  }

  @Input()
  set theme(value: Record<string, unknown> | null) {
    if (value) {
      this._options.theme = value;
    } else {
      delete this._options.theme;
    }
  }

  @Input()
  set group(value: string | null) {
    this._group = value;
  }

  get group(): string | null {
    return this._group ?? this._chartConfig?.group ?? null;
  }

  @Input()
  set groupSync(value: GroupSyncMode | null) {
    this._groupSync = value;
  }

  get groupSync(): GroupSyncMode {
    return this._groupSync ?? this._chartConfig?.groupSync ?? 'all';
  }

  @Output() customEvent = new EventEmitter<ChartCustomEvent>();
  @Output() chartClick = new EventEmitter<ChartClickEvent>();
  @Output() renderError = new EventEmitter<ChartRenderError>();

  protected constructor(initialChartType: string) {
    this._options = initCommonChartOptions(
      this.el,
      this.customEvent,
      this.ngZone,
      initialChartType,
      false,
      this.chartClick,
      {
        onZoomed: (_chartContext, xaxis) => this.publishDataZoom(xaxis),
        onMouseMove: (_event, _chartContext, config) => this.publishTooltip(config),
        onMouseLeave: () => this.publishTooltip(null),
      },
    );
  }

  protected abstract updateData(): void;

  protected abstract updateType(): void;

  protected configureTypeSpecificOptions(): void {
    // Les directives spécialisées peuvent ajuster les options propres à leur type.
  }

  protected get effectiveConfig(): ChartProvider<X, Y> {
    if (this.canPivot || !this._chartConfig) return this._chartConfig;
    return { ...this._chartConfig, pivot: false };
  }

  init(): void {
    if (this.destroyed || this.chartInstance()) return;

    this.ngZone.runOutsideAngular(() => {
      try {
        const options = this.getEffectiveOptions();
        const chart = new ApexCharts(this.el.nativeElement, options);
        this.chartInstance.set(chart);
        this.registerGroupSync();

        void chart
          .render()
          .then(() => {
            if (this.destroyed || this.chartInstance() !== chart) {
              chart.destroy();
              return;
            }
            setupScrollPrevention(this.el.nativeElement, this.chartInstance);
            fixToolbarSvgIds(this.el.nativeElement);
            this.toolbarObserver = setupToolbarObserver(this.el.nativeElement);
          })
          .catch((error) => this.handleRenderError(error));
      } catch (error) {
        this.handleRenderError(error);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.destroyed) return;

    if (this.debug) {
      console.log('[jquery-apexcharts] ngOnChanges', changes);
    }

    this.ngZone.runOutsideAngular(() => {
      asapScheduler.schedule(() => {
        if (!this.destroyed) this.hydrate(changes);
      });
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.disposeChart();
  }

  exportImage(fileName = 'chart', type: 'png' | 'jpeg' | 'svg' = 'png', pixelRatio = 2): void {
    const chart = this.chartInstance();
    if (!chart) return;

    void chart.dataURI({ scale: pixelRatio }).then((result) => {
      if (!('imgURI' in result)) return;
      this.download(result.imgURI, `${fileName}.${type}`);
    });
  }

  exportData(fileName = 'data', separator = ';'): void {
    this.chartInstance()?.exports.exportToCSV({
      fileName,
      columnDelimiter: separator,
    });
  }

  resize(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('resize'));
    }
  }

  getRenderedOption(): unknown {
    if (this.renderedOption) return cloneSerializable(this.renderedOption);
    const chartOptions = (this.chartInstance() as any)?.w?.config;
    return cloneSerializable(chartOptions ?? this._options);
  }

  protected updateChartOptions(
    specificOptions?: any,
    redrawPaths = true,
    animate = true,
    updateSyncedCharts = false,
  ): Promise<void> {
    const chart = this.chartInstance();
    if (!chart) return Promise.resolve();

    return this.ngZone.runOutsideAngular(() =>
      chart
        .updateOptions(
          this.getEffectiveOptions(specificOptions),
          redrawPaths,
          animate,
          updateSyncedCharts,
        )
        .then(() => fixToolbarSvgIds(this.el.nativeElement))
        .catch((error) => this.handleRenderError(error)),
    );
  }

  protected markForRedraw(): void {
    this._options.shouldRedraw = true;
  }

  private hydrate(changes: SimpleChanges): void {
    const needsDataUpdate = !!(changes['data'] || changes['config'] || changes['type']);
    const needsOptionsUpdate = Object.keys(changes).some((key) => key !== 'debug');

    if (changes['type']) this.updateType();
    if (changes['renderedOption']) this.markForRedraw();
    if (needsDataUpdate && this.data && this._chartConfig) this.updateData();

    if (changes['group'] || changes['groupSync'] || changes['config']) {
      this.registerGroupSync();
    }

    if (changes['isLoading'] || changes['loadingLabel'] || changes['noDataLabel']) {
      this.updateChartOptions({ noData: this._options.noData }, false, false, false);
    }

    if (this._options.shouldRedraw || !this.chartInstance()) {
      this.disposeChart();
      delete this._options.shouldRedraw;
      this.init();
    } else if (needsOptionsUpdate) {
      this.updateChartOptions();
    }
  }

  private updateNoDataLabel(): void {
    this._options.noData.text = this._isLoading ? this._loadingLabel : this._noDataLabel;
  }

  private getEffectiveOptions(specificOptions?: any): any {
    const options = this.renderedOption
      ? mergeDeep({}, this._options, this.renderedOption as object)
      : mergeDeep({}, this._options);

    return specificOptions ? mergeDeep(options, specificOptions) : options;
  }

  private createCustomIcons(): any[] {
    return customIcons(
      (event) => this.ngZone.run(() => this.customEvent.emit(event)),
      this._canPivot,
    );
  }

  private disposeChart(): void {
    this.toolbarObserver?.disconnect();
    this.toolbarObserver = null;
    this.groupSyncUnregister?.();
    this.groupSyncUnregister = null;
    destroyChart(this.chartInstance);
    this.lastTooltipPoint = null;
  }

  private handleRenderError(error: unknown): Promise<void> {
    this.chartInstance.set(null);
    this.ngZone.run(() => this.renderError.emit({ error }));
    return Promise.resolve();
  }

  private registerGroupSync(): void {
    this.groupSyncUnregister?.();
    this.groupSyncUnregister = null;
    if (!this.group) return;

    this.groupSyncUnregister = registerChartGroupSync(
      this.group,
      this.groupSyncSource,
      (event) => this.applyGroupSync(event),
    );
  }

  private publishDataZoom(xaxis: any): void {
    if (!this.group || !this.syncs('datazoom') || this.isSyncing || !xaxis) return;
    publishChartGroupSync({
      group: this.group,
      action: 'datazoom',
      source: this.groupSyncSource,
      payload: {
        min: xaxis.min,
        max: xaxis.max,
      },
    });
  }

  private publishTooltip(config: any): void {
    if (!this.group || !this.syncs('tooltip') || this.isSyncing) return;
    const index = config?.dataPointIndex;
    if (typeof index !== 'number' || index < 0) {
      publishChartGroupSync({
        group: this.group,
        action: 'tooltip',
        source: this.groupSyncSource,
        payload: { xValue: null },
      });
      return;
    }

    const point = this._options.series?.[config.seriesIndex ?? 0]?.data?.[index];
    const xValue = this._options.xaxis?.categories?.[index] ?? (point && typeof point === 'object' ? point.x : index);
    publishChartGroupSync({
      group: this.group,
      action: 'tooltip',
      source: this.groupSyncSource,
      payload: { xValue },
    });
  }

  private applyGroupSync(event: ChartGroupSyncEvent): void {
    const chart = this.chartInstance();
    if (!chart || !this.syncs(event.action)) return;

    this.isSyncing = true;
    try {
      if (event.action === 'datazoom') {
        const { min, max } = event.payload;
        if (typeof min === 'number' && typeof max === 'number') chart.zoomX(min, max);
      } else {
        this.applyTooltip(event.payload.xValue);
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private applyTooltip(xValue: unknown): void {
    const chart = this.chartInstance();
    if (!chart) return;

    if (this.lastTooltipPoint) {
      chart.toggleDataPointSelection(
        this.lastTooltipPoint.seriesIndex,
        this.lastTooltipPoint.dataPointIndex,
      );
      this.lastTooltipPoint = null;
    }
    if (xValue === null || xValue === undefined) return;

    const index = this._options.xaxis?.categories?.indexOf(xValue);
    if (typeof index !== 'number' || index < 0) return;
    const seriesIndex = 0;
    chart.toggleDataPointSelection(seriesIndex, index);
    this.lastTooltipPoint = { seriesIndex, dataPointIndex: index };
  }

  private syncs(action: GroupSyncAction): boolean {
    return this.groupSync === 'all'
      || this.groupSync === action
      || (Array.isArray(this.groupSync) && this.groupSync.includes(action));
  }

  private download(href: string, fileName: string): void {
    if (typeof document === 'undefined') return;
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    link.click();
  }
}