import { Component, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartComponent as EChartsComponent } from '@oneteme/jquery-echarts';
import { ChartProvider, ChartType } from '@oneteme/jquery-core';

@Component({
  selector: 'app-echarts-test',
  templateUrl: './echarts-test.component.html',
  standalone: true,
  imports: [CommonModule, EChartsComponent],
})
export class EChartsTestComponent  {
  @Input() chartType: ChartType = 'line';
  @Input() chartConfig: ChartProvider<string, number>;
  @Input() chartData: any[] = [];
  @Input() isLoadingChart: boolean = false;
  @ViewChild('chart') chart: EChartsComponent<string, number>;



  reloadChart(): void { if (this.chart) { /* empty */ } }

  onCustomEvent(event: any): void {
    console.log('Custom event received from ECharts:', event);
  }
}
