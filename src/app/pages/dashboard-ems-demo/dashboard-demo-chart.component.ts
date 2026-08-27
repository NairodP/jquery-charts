import {AfterViewInit, ChangeDetectionStrategy, Component, ComponentRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild, ViewContainerRef} from '@angular/core';
import {ChartComponent} from '@oneteme/jquery-echarts';
import {ChartProvider, ChartType} from '@oneteme/jquery-core';

@Component({
  selector: 'app-dashboard-demo-chart',
  standalone: true,
  template: '<ng-container #chartHost></ng-container>',
  styles: [':host { display: block; height: 100%; }'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardDemoChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({required: true}) type!: ChartType;
  @Input({required: true}) config!: ChartProvider<any, any>;
  @Input({required: true}) data: Record<string, unknown>[] = [];

  @ViewChild('chartHost', {read: ViewContainerRef, static: true}) private chartHost!: ViewContainerRef;

  private chartRef?: ComponentRef<ChartComponent<any, any>>;

  ngAfterViewInit(): void {
    this.chartRef = this.chartHost.createComponent(ChartComponent);
    this.updateInputs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.chartRef && (changes['type'] || changes['config'] || changes['data'])) {
      this.updateInputs();
    }
  }

  ngOnDestroy(): void {
    this.chartRef?.destroy();
  }

  private updateInputs(): void {
    if (!this.chartRef) {
      return;
    }

    this.chartRef.setInput('type', this.type);
    this.chartRef.setInput('config', this.config);
    this.chartRef.setInput('data', this.data);
    this.chartRef.setInput('renderer', 'canvas');
    this.chartRef.changeDetectorRef.detectChanges();
  }
}